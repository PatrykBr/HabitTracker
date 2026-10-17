// Check the deployed artifact with an isolated database and no .env settings.
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

const output = new URL('../.vercel/output/', import.meta.url)
const config = await Bun.file(new URL('config.json', output)).json()
assert.equal(config.version, 3)
assert.ok(config.routes.some((route) => route.src === '/(.*)' && route.dest === '/__server'),
  'Vercel must route app requests to the server function')
const functionConfig = await Bun.file(new URL('functions/__server.func/.vc-config.json', output)).json()
assert.equal(functionConfig.runtime, 'nodejs24.x',
  'Vercel must use Node.js 24; its Bun runtime lacks the V8 API used by BSON')
assert.ok(await Bun.file(new URL(`functions/__server.func/${functionConfig.handler}`, output)).exists())

for (const pathname of ['sw.js', 'sw-cleanup.js', 'offline.html', 'manifest.webmanifest'])
  assert.ok(await Bun.file(new URL(`static/${pathname}`, output)).exists(), pathname)
const sw = await Bun.file(new URL('static/sw.js', output)).text()
assert.match(sw, /offline\.html/)
assert.match(sw, /NetworkOnly/)
assert.doesNotMatch(sw, /url:["']\/?(?:login|index\.html)["']/)
console.log('Vercel routes, function entry and public PWA assets passed')

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
try {
  const child = Bun.spawn(['node', fileURLToPath(new URL('./smoke-vercel-function.mjs', import.meta.url))], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      MONGODB_URI: mongo.getUri(),
      MONGODB_DB: `reset-vercel-smoke-${crypto.randomUUID()}`,
      BETTER_AUTH_SECRET: crypto.randomUUID(),
      BETTER_AUTH_URL: 'http://localhost:3000',
    },
    stdout: 'inherit',
    stderr: 'inherit',
  })
  assert.equal(await child.exited, 0, 'Vercel function checks must pass under Node.js 24')
} finally {
  await mongo.stop()
}
