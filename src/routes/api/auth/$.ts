import { createFileRoute } from '@tanstack/react-router'
import { auth } from '../../../lib/auth'
import { ensureIndexes } from '../../../lib/db.server'

const AUTH_PATHS = new Set([
  '/get-session',
  '/sign-up/email',
  '/sign-in/username',
  '/sign-out',
])

async function handleAuth({ request }: { request: Request }) {
  // Reject unused and unknown operations before rate limiting can create a
  // database row for an attacker-controlled path. Hooks run too late for this.
  const endpoint = new URL(request.url).pathname
    .slice('/api/auth'.length)
    .replace(/\/+$/, '')
  if (!AUTH_PATHS.has(endpoint)) return new Response('Not Found', { status: 404 })
  // Rate limiting runs before Better Auth's hooks, so its unique key index
  // must exist before dispatch, including on the first request after startup.
  await ensureIndexes()
  return auth.handler(request)
}

/** Expose only the username app's four auth operations. */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: handleAuth,
      POST: handleAuth,
    },
  },
})
