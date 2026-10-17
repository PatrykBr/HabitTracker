// Production HTTP checks against an isolated replica set; never uses .env data.
import assert from 'node:assert/strict'
import { fromCrossJSON, toJSONAsync } from 'seroval'
import { defaultSerovalPlugins, makeSerovalPlugin } from '@tanstack/router-core/ssr/client'
import { errorAdapter } from '../src/lib/errors.serialization.ts'
import { UserFacingError } from '../src/lib/errors.ts'
import { withSmokeApp } from './smoke-app.mjs'

await withSmokeApp(async ({ origin, request }) => {

  const login = await request('/login')
  assert.equal(login.status, 200)
  assert.match(login.headers.get('cache-control'), /private, no-store/)
  const html = await login.text()
  assert.match(html, /Reset/)
  const assetPath = html.match(/(?:src|href)="(\/assets\/[^"?#]+\.js)"/)?.[1]
  assert.ok(assetPath, 'SSR must link a built client script')
  const asset = await request(assetPath)
  assert.equal(asset.status, 200)
  assert.match(asset.headers.get('cache-control'), /immutable/)
  const body = await asset.arrayBuffer()
  const head = await request(assetPath, { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(Number(head.headers.get('content-length')), body.byteLength)
  assert.equal((await head.arrayBuffer()).byteLength, 0)
  console.log('✓ production SSR, client assets, HEAD and cache headers')

  for (const pathname of ['/sw.js', '/sw-cleanup.js', '/offline.html', '/manifest.webmanifest']) {
    const response = await request(pathname)
    assert.equal(response.status, 200, pathname)
    assert.equal(response.headers.get('cache-control'), 'no-cache', pathname)
    assert.ok((await response.arrayBuffer()).byteLength > 0, pathname)
  }
  for (const pathname of ['/.env', '/server.ts', '/server/server.js', '/assets/missing.js']) {
    const response = await request(pathname)
    assert.equal(response.status, 404, pathname)
    assert.match(response.headers.get('cache-control'), /no-store/, pathname)
  }
  console.log('✓ public PWA assets revalidate; server files stay private')

  for (const endpoint of ['unknown', 'update-user', 'sign-in/email', 'delete-user']) {
    const response = await request(`/api/auth/${endpoint}`, {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}',
    })
    assert.equal(response.status, 404)
  }

  const oversized = await request('/api/auth/sign-in/username', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'none', password: 'x'.repeat(70 * 1024) }),
  })
  assert.equal(oversized.status, 413)

  const protectedPage = await request('/', { redirect: 'manual' })
  assert.equal(protectedPage.status, 307)
  assert.match(protectedPage.headers.get('location'), /\/login/)
  const credentials = { username: 'bun_smoke', password: 'bun-smoke-password' }
  const authRequest = (endpoint, body, cookie) => request(`/api/auth/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      origin,
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const signup = await authRequest('sign-up/email', {
    ...credentials, name: credentials.username,
  })
  assert.equal(signup.status, 200, await signup.text())
  const signin = await authRequest('sign-in/username', credentials)
  assert.equal(signin.status, 200, await signin.text())
  const cookie = signin.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  assert.ok(cookie)
  const session = await authRequest('get-session', undefined, cookie)
  assert.equal((await session.json()).user.username, credentials.username)
  const dashboard = await request('/', { headers: { cookie }, redirect: 'manual' })
  assert.equal(dashboard.status, 200)
  assert.match(dashboard.headers.get('cache-control'), /private, no-store/)
  console.log('✓ signup, sign-in, cookie session and authenticated dashboard over HTTP')

  // Call the built RPC transport. Read compiler-generated IDs so the tests
  // follow source and route changes.
  const entry = await Bun.file('dist/server/server.js').text()
  const ids = Object.fromEntries(
    [...entry.matchAll(/"([a-f0-9]{64})": \{\s*functionName: "(\w+)_createServerFn_handler"/g)]
      .map((match) => [match[2], match[1]]),
  )
  const plugins = [makeSerovalPlugin(errorAdapter), ...defaultSerovalPlugins]
  const rpc = async (name, method, data, authCookie = cookie, headers = {}) => {
    assert.ok(ids[name], `Missing built server function: ${name}`)
    const payload = data === undefined ? undefined : JSON.stringify(await toJSONAsync({ data }, { plugins }))
    const response = await request(`/_serverFn/${ids[name]}${
      method === 'GET' && payload ? '?' + new URLSearchParams({ payload }) : ''
    }`, {
      method,
      headers: {
        origin, cookie: authCookie, 'x-tsr-serverFn': 'true',
        'content-type': 'application/json', ...headers,
      },
      ...(method === 'POST' && payload ? { body: payload } : {}),
    })
    assert.match(response.headers.get('cache-control'), /private, no-store/)
    const text = await response.text()
    const value = response.headers.has('x-tss-serialized')
      ? fromCrossJSON(JSON.parse(text), { plugins, refs: new Map() })
      : text
    return { response, text, value }
  }
  const fields = {
    name: 'Coffee', icon: '☕', color: '#34C759',
    startDate: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    costPerUnit: null, unitsPerDay: null,
  }
  for (const [name, method, data] of [
    ['listHabits', 'GET'],
    ['getHabitDetail', 'GET', { habitId: '000000000000000000000000' }],
    ['createHabit', 'POST', fields],
    ['updateHabit', 'POST', { habitId: '000000000000000000000000', patch: fields }],
    ['logReset', 'POST', { habitId: '000000000000000000000000', timestamp: new Date().toISOString(), trigger: null, note: null }],
    ['deleteReset', 'POST', { resetId: '000000000000000000000000' }],
    ['deleteHabit', 'POST', { habitId: '000000000000000000000000' }],
  ]) {
    const result = await rpc(name, method, data, '')
    assert.equal(JSON.parse(result.text).to, '/login', name)
  }
  assert.equal((await rpc('createHabit', 'GET', fields)).response.status, 405)
  for (const headers of [
    { origin: 'https://other.example' },
    { 'sec-fetch-site': 'same-site' },
    { origin: '', referer: '' },
  ]) assert.equal((await rpc('createHabit', 'POST', fields, cookie, headers)).response.status, 403)

  const habit = (await rpc('createHabit', 'POST', fields)).value.result
  assert.equal(habit.name, fields.name)
  const malformed = await rpc('createHabit', 'POST', { ...fields, costPerUnit: 5 })
  assert.ok(malformed.value.error instanceof Error)
  assert.equal(malformed.value.error.message, 'We couldn\'t complete that request. Try again.')
  assert.ok(!malformed.text.includes('stack'))
  assert.equal((await rpc('listHabits', 'GET')).value.result.length, 1)
  const future = await rpc('logReset', 'POST', {
    habitId: habit.id, timestamp: new Date(Date.now() + 86_400_000).toISOString(), trigger: null, note: null,
  })
  assert.ok(future.value.error instanceof UserFacingError)
  assert.equal(future.value.error.message, 'A reset can\'t be in the future.')
  assert.ok(!future.text.includes('stack'))
  const reset = (await rpc('logReset', 'POST', {
    habitId: habit.id, timestamp: new Date().toISOString(), trigger: 'Stress', note: 'A test note.',
  })).value.result
  assert.equal((await rpc('getHabitDetail', 'GET', { habitId: habit.id })).value.result.resets[0].id, reset.id)

  const otherSignup = await authRequest('sign-up/email', {
    username: 'other_smoke', password: credentials.password,
  })
  assert.equal(otherSignup.status, 200)
  const otherCookie = otherSignup.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  assert.deepEqual((await rpc('listHabits', 'GET', undefined, otherCookie)).value.result, [])
  assert.equal((await rpc('getHabitDetail', 'GET', { habitId: habit.id }, otherCookie)).value.error.isNotFound, true)
  for (const [name, data] of [
    ['updateHabit', { habitId: habit.id, patch: fields }],
    ['logReset', { habitId: habit.id, timestamp: new Date().toISOString(), trigger: null, note: null }],
    ['deleteReset', { resetId: reset.id }],
    ['deleteHabit', { habitId: habit.id }],
  ]) assert.ok((await rpc(name, 'POST', data, otherCookie)).value.error instanceof UserFacingError)
  assert.equal((await rpc('getHabitDetail', 'GET', { habitId: habit.id })).value.result.totalResets, 1)
  await rpc('deleteReset', 'POST', { resetId: reset.id })
  await rpc('deleteHabit', 'POST', { habitId: habit.id })
  assert.deepEqual((await rpc('listHabits', 'GET')).value.result, [])
  console.log('✓ every data RPC enforces auth, ownership, methods, CSRF, validation and safe error serialization')

  // All calls come from one socket peer. Client-controlled forwarding headers
  // must not turn them into distinct rate-limit buckets on direct deployments.
  for (let i = 0; i < 11; i++) {
    const response = await request('/api/auth/sign-in/username', {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        'x-forwarded-for': `192.0.2.${i + 1}`,
      },
      body: JSON.stringify({ username: 'none', password: 'x' }),
    })
    // The successful sign-in above already used one of the ten attempts.
    assert.equal(response.status, i < 9 ? 400 : 429)
  }
  console.log('✓ oversized request bodies and spoofed rate-limit headers are rejected')
})

await withSmokeApp(async ({ origin, request }) => {
  // Explicit proxy mode delegates header sanitization to deployment infrastructure.
  // Confirm the opt-in still permits independent clients behind that proxy.
  for (let i = 0; i < 12; i++) {
    const response = await request('/api/auth/sign-in/username', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': `192.0.2.${i + 1}` },
      body: JSON.stringify({ username: 'none', password: 'x' }),
    })
    assert.equal(response.status, 400)
  }
  console.log('✓ explicit proxy mode preserves independently forwarded client identities')
}, { trustProxy: true })
