// Real browser checks against a fresh production app and throwaway database.
// Install a browser once: bunx playwright install chromium
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { withSmokeApp } from './smoke-app.mjs'

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
})
try {
  await withSmokeApp(async ({ origin }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    page.setDefaultTimeout(15_000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const dialog = page.getByRole('dialog')
    const noOverflow = async () => {
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, viewport: innerWidth,
      }))
      assert.ok(dimensions.width <= dimensions.viewport, JSON.stringify(dimensions))
    }
    const focusInDialog = () => page.waitForFunction(() =>
      document.querySelector('[role="dialog"]')?.contains(document.activeElement),
    )
    const close = async () => {
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
    }
    const localTimeAgo = (ms) => page.evaluate((offset) => {
      const date = new Date(Date.now() - offset)
      return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    }, ms)

    // Seed only legacy caches, before the app registers the current worker.
    await page.goto(origin + '/offline.html')
    await page.evaluate(async () => {
      for (const name of ['pages', 'static-media']) {
        const cache = await caches.open(name)
        await cache.put('/', new Response('private legacy fixture'))
      }
    })
    await page.goto(origin + '/login')
    await page.getByRole('radio', { name: 'Create account', exact: true }).click()
    await page.getByRole('textbox', { name: 'Username', exact: true }).fill('browser_smoke')
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('browser-smoke-password')
    await page.getByRole('button', { name: 'Start fresh', exact: true }).click()
    await page.waitForURL(origin + '/')

    await page.getByRole('button', { name: 'Add a habit', exact: true }).click()
    await page.getByRole('textbox', { name: 'Habit name', exact: true }).waitFor()
    assert.equal(await page.getByRole('textbox', { name: 'Habit name', exact: true }).evaluate((el) => el === document.activeElement), true)
    await close()
    assert.equal(await page.getByRole('button', { name: 'Add a habit', exact: true }).evaluate((el) => el === document.activeElement), true)

    await page.getByRole('button', { name: 'Add a habit', exact: true }).click()
    const habitName = page.getByRole('textbox', { name: 'Habit name', exact: true })
    await habitName.press('Enter')
    await dialog.getByRole('alert').getByText('Give your habit a name.', { exact: true }).waitFor()
    const focusStyle = await habitName.evaluate((el) => {
      const style = getComputedStyle(el)
      return { visible: el.matches(':focus-visible'), outline: style.outlineStyle }
    })
    assert.ok(focusStyle.visible && focusStyle.outline !== 'none', JSON.stringify(focusStyle))
    await habitName.fill('X'.repeat(60))
    // Several days in the past, in this browser's local timezone.
    const started = await localTimeAgo(45 * 86_400_000)
    await page.getByLabel('Started', { exact: true }).fill(started)
    await habitName.press('Enter')
    await dialog.waitFor({ state: 'detached' })
    await page.locator('a[href^="/habits/"]').click()
    await page.getByRole('button', { name: 'Log a reset', exact: true }).waitFor()
    const habitUrl = page.url()

    await page.getByRole('button', { name: 'Log a reset', exact: true }).click()
    await page.getByRole('radio', { name: 'Earlier', exact: true }).click()
    const earlier = await localTimeAgo(86_400_000)
    await page.getByLabel('When', { exact: true }).fill(earlier)
    await page.getByRole('button', { name: 'Stress', exact: true }).click()
    await page.getByRole('textbox', { name: 'Note', exact: true }).fill('N'.repeat(500))
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByRole('button', { name: 'Restart My Streak', exact: true }).waitFor()
    await focusInDialog()
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).evaluate((el) => el === document.activeElement), true)
    await page.keyboard.press('Tab')
    assert.equal(await page.getByRole('button', { name: 'Close sheet', exact: true }).evaluate((el) => el === document.activeElement), true)

    // Hold the real mutation to verify busy-state dismissal and submission gating.
    let release
    const held = new Promise((resolve) => { release = resolve })
    const intercepted = page.waitForRequest((request) =>
      request.method() === 'POST' && request.url().includes('/_serverFn/'),
    )
    let writes = 0
    await page.route('**/_serverFn/**', async (route) => {
      if (route.request().method() === 'POST') {
        writes++
        await held
      }
      await route.continue()
    })
    try {
      await page.getByRole('button', { name: 'Restart My Streak', exact: true }).click()
      await intercepted
      await page.keyboard.press('Escape')
      assert.equal(await dialog.count(), 1)
      assert.equal(await page.getByRole('button', { name: 'Logging…', exact: true }).isDisabled(), true)
    } finally {
      release()
    }
    await dialog.waitFor({ state: 'detached' })
    await page.getByText('Streak restarted', { exact: true }).waitFor()
    await page.unroute('**/_serverFn/**')
    assert.equal(writes, 1)
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      await noOverflow()
    }
    const resetInPreviousMonth = earlier.slice(0, 7) !== (await localTimeAgo(0)).slice(0, 7)
    if (resetInPreviousMonth)
      await page.getByRole('button', { name: 'Previous month', exact: true }).click()
    await page.getByRole('button', { name: /^1 reset on / }).click()
    await dialog.waitFor()
    await noOverflow()
    await close()
    if (resetInPreviousMonth)
      await page.getByRole('button', { name: 'Next month', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Next month', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: 'Previous month', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Next month', exact: true }).isDisabled(), false)
    await page.getByRole('button', { name: 'Next month', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Next month', exact: true }).isDisabled(), true)
    console.log('✓ signup, create, backdated reset, long text, focus restoration/trapping and busy confirmation')

    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await habitName.fill('Less coffee')
    await page.getByLabel('Cost per unit', { exact: true }).fill('2.5')
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click()
    await dialog.getByRole('alert').getByText('To track savings', { exact: false }).waitFor()
    await page.getByLabel('Units per day', { exact: true }).fill('2')
    await habitName.press('Enter')
    await dialog.waitFor({ state: 'detached' })
    await page.reload()
    await page.getByRole('heading', { name: 'Less coffee', exact: true }).waitFor()

    // Exercise expansion with enough real history to exceed the initial cap.
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: 'Log a reset', exact: true }).click()
      await page.getByRole('radio', { name: 'Earlier', exact: true }).click()
      const timestamp = await localTimeAgo((22 - i * 2) * 3_600_000)
      await page.getByLabel('When', { exact: true }).fill(timestamp)
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
      await page.getByRole('button', { name: 'Restart My Streak', exact: true }).click()
      await dialog.waitFor({ state: 'detached' })
    }
    assert.equal(await page.getByRole('button', { name: 'Remove this reset', exact: true }).count(), 7)
    await page.getByRole('button', { name: /^Show 2 more/ }).click()
    assert.equal(await page.getByRole('button', { name: 'Remove this reset', exact: true }).count(), 9)
    await page.getByRole('button', { name: 'Show fewer', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Remove this reset', exact: true }).count(), 7)
    console.log('✓ keyboard submission, visible field focus, shared validation and history expansion')

    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    const cacheState = await page.evaluate(async () => {
      const names = await caches.keys()
      const paths = []
      for (const name of names)
        for (const request of await (await caches.open(name)).keys())
          paths.push(new URL(request.url).pathname)
      return { names, paths }
    })
    assert.ok(!cacheState.names.includes('pages') && !cacheState.names.includes('static-media'))
    assert.ok(cacheState.paths.includes('/offline.html'))
    assert.ok(cacheState.paths.every((path) =>
      path.startsWith('/assets/') || path.startsWith('/icons/') || path.startsWith('/splash/') ||
      ['/offline.html', '/sw-cleanup.js', '/manifest.webmanifest'].includes(path),
    ), JSON.stringify(cacheState.paths))
    await context.setOffline(true)
    await page.getByRole('status').getByText('You’re offline', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Log a reset', exact: true }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Edit', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: 'Stop tracking this habit', exact: true }).click()
    assert.equal(await dialog.getByRole('button', { name: 'Delete habit', exact: true }).isDisabled(), true)
    await close()
    await context.setOffline(false)
    await page.getByRole('status').waitFor({ state: 'detached' })
    assert.equal(await page.getByRole('button', { name: 'Log a reset', exact: true }).isDisabled(), false)
    await context.setOffline(true)
    await page.getByRole('status').waitFor()
    await page.reload()
    await page.getByRole('heading', { name: 'You’re offline', exact: true }).waitFor()
    await context.setOffline(false)
    await page.goto(origin + '/you')
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await dialog.getByRole('button', { name: 'Sign out', exact: true }).click()
    await page.waitForURL(origin + '/login')
    await page.goto(habitUrl)
    await page.waitForURL(origin + '/login')
    assert.deepEqual(errors, [])
    console.log('✓ edits persist; public-only SW caches, legacy cleanup, offline fallback and sign-out isolation')
    await context.close()
  })
} finally {
  await browser.close()
}
