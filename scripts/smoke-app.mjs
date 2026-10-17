// Shared lifecycle for production HTTP/browser checks. Never loads .env data.
import assert from 'node:assert/strict'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

export async function withSmokeApp(check, { trustProxy = false } = {}) {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  let child
  let logs = ''
  const drains = []
  try {
    // Auth needs the exact origin before startup. Reserve an ephemeral port
    // rather than assuming the developer's usual port is free.
    const reservation = Bun.serve({
      hostname: '127.0.0.1', port: 0, fetch: () => new Response(),
    })
    const origin = reservation.url.origin
    const port = reservation.port
    await reservation.stop(true)
    child = Bun.spawn([process.execPath, '--no-env-file', 'server.ts'], {
      env: {
        ...process.env,
        NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
        MONGODB_URI: mongo.getUri(),
        MONGODB_DB: `reset-smoke-${crypto.randomUUID()}`,
        BETTER_AUTH_SECRET: crypto.randomUUID(), BETTER_AUTH_URL: origin,
        TRUST_PROXY: String(trustProxy),
      },
      stdout: 'pipe', stderr: 'pipe',
    })
    for (const stream of [child.stdout, child.stderr]) {
      drains.push((async () => {
        const decoder = new TextDecoder()
        for await (const chunk of stream) logs += decoder.decode(chunk)
      })())
    }
    const deadline = Date.now() + 20_000
    while (!logs.includes('Reset listening on ') && child.exitCode === null && Date.now() < deadline)
      await Bun.sleep(25)
    assert.ok(logs.includes('Reset listening on '), `Production server did not start:\n${logs}`)
    await check({
      origin,
      request: (pathname, options) => fetch(new URL(pathname, origin), options),
    })
  } catch (error) {
    if (logs) console.error('Production server output:\n' + logs)
    throw error
  } finally {
    try {
      if (child) {
        child.kill()
        await child.exited
        await Promise.all(drains)
      }
    } finally {
      await mongo.stop()
    }
  }
}
