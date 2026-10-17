// Check the deployed artifact with an isolated database and no .env settings.
import assert from 'node:assert/strict'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

const output = new URL('../.vercel/output/', import.meta.url)
const config = await Bun.file(new URL('config.json', output)).json()
assert.equal(config.version, 3)
assert.ok(config.routes.some((route) => route.src === '/(.*)' && route.dest === '/__server'),
  'Vercel must route app requests to the server function')
const functionConfig = await Bun.file(new URL('functions/__server.func/.vc-config.json', output)).json()
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
  Object.assign(process.env, {
    NODE_ENV: 'production',
    MONGODB_URI: mongo.getUri(),
    MONGODB_DB: `reset-vercel-smoke-${crypto.randomUUID()}`,
    BETTER_AUTH_SECRET: crypto.randomUUID(),
    BETTER_AUTH_URL: 'http://localhost:3000',
  })
  const { default: app } = await import(new URL('functions/__server.func/index.mjs', output).href)
  const request = (pathname) => app.fetch(new Request(`http://localhost:3000${pathname}`, {
    headers: { 'x-forwarded-for': '127.0.0.1' },
  }))
  const root = await request('/')
  assert.equal(root.status, 307)
  assert.match(root.headers.get('location'), /\/login/)
  assert.match(root.headers.get('cache-control'), /private, no-store/)
  const login = await request('/login')
  assert.equal(login.status, 200)
  assert.match(login.headers.get('cache-control'), /private, no-store/)
  const html = await login.text()
  assert.match(html, /Sign in/)
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)]
  assert.ok(assets.length > 0, 'SSR must link built client assets')
  for (const [, asset] of assets)
    assert.ok(await Bun.file(new URL(`static${asset}`, output)).exists(), asset)
  const session = await request('/api/auth/get-session')
  assert.equal(session.status, 200)
  assert.equal(await session.json(), null)
  console.log('Vercel function root redirect, login SSR, assets and auth passed')
} finally {
  await mongo.stop()
  // The bundled app owns its Mongo client; exit after stopping the test database.
}
process.exit(0)
