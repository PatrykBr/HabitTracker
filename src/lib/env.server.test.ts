import { describe, expect, it } from 'bun:test'

// Each process gets a fresh validation cache without mutating the test runner's
// environment or loading credentials from the developer's .env.
async function readAuthEnv(origin: string) {
  const moduleUrl = new URL('./env.server.ts', import.meta.url).href
  const child = Bun.spawn([
    process.execPath,
    '--no-env-file',
    '--eval',
    `import { authEnv } from ${JSON.stringify(moduleUrl)};
     console.log(JSON.stringify(authEnv()))`,
  ], {
    env: {
      ...process.env,
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      BETTER_AUTH_URL: origin,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}

describe('server environment', () => {
  it('requires an explicit origin and rejects URLs that are not origins', async () => {
    for (const value of [
      '',
      'file:///tmp/app',
      'https://user:pass@example.com',
      'https://example.com/subpath',
      'https://example.com?query=yes',
    ]) {
      const result = await readAuthEnv(value)
      expect(result.exitCode).not.toBe(0)
      expect(result.stderr).toContain('BETTER_AUTH_URL')
    }
  })
  it('accepts and normalizes the configured origin', async () => {
    const result = await readAuthEnv('https://example.com/')
    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout).BETTER_AUTH_URL).toBe('https://example.com')
  })
})
