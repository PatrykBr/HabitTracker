// Run the generated function under the same runtime major as Vercel.
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'

assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Install Node.js 24 for this check')
const output = new URL('../.vercel/output/', import.meta.url)
try {
  const { default: app } = await import(new URL('functions/__server.func/index.mjs', output).href)
  const request = (pathname, options = {}) => app.fetch(new Request(`http://localhost:3000${pathname}`, {
    ...options,
    headers: { 'x-forwarded-for': '127.0.0.1', ...options.headers },
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
  for (const [, asset] of assets) await access(new URL(`static${asset}`, output))
  const session = await request('/api/auth/get-session')
  assert.equal(session.status, 200)
  assert.equal(await session.json(), null)
  const credentials = { username: 'vercel_smoke', password: 'vercel-smoke-password' }
  const authRequest = (endpoint, body) => request(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const signup = await authRequest('sign-up/email', { ...credentials, name: credentials.username })
  assert.equal(signup.status, 200, await signup.text())
  const signin = await authRequest('sign-in/username', credentials)
  assert.equal(signin.status, 200, await signin.text())
  const cookie = signin.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  assert.ok(cookie, 'Sign-in must set a session cookie')
  const authenticated = await request('/api/auth/get-session', { headers: { cookie } })
  assert.equal((await authenticated.json()).user.username, credentials.username)
  const dashboard = await request('/', { headers: { cookie } })
  assert.equal(dashboard.status, 200)
  assert.match(dashboard.headers.get('cache-control'), /private, no-store/)
  console.log('Vercel root, login SSR, assets, MongoDB auth and dashboard passed under Node.js 24')
  // The generated bundle owns its Mongo client. Exit so the parent can stop Mongo.
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
