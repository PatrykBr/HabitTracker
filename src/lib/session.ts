import { getSessionUser } from './auth.functions'
import type { SessionUser } from './auth.functions'

/**
 * Route guards call this on every navigation (and every intent preload).
 * In the browser the answer is cached briefly so hovering links doesn't hit
 * the session store each time. On the server there is no cache: module state
 * there would be shared across users' requests.
 */
const CACHE_TTL_MS = 30_000

let cached: { user: SessionUser | null; at: number } | null = null
let pending: Promise<SessionUser | null> | null = null
let generation = 0

export async function fetchSessionUser(): Promise<SessionUser | null> {
  if (typeof window === 'undefined') return getSessionUser()
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.user
  if (pending) return pending
  const currentGeneration = generation
  const request = getSessionUser()
    .then((user) => {
      // A response started before sign-in/out must not restore the old session.
      if (generation !== currentGeneration) return fetchSessionUser()
      cached = { user, at: Date.now() }
      return user
    })
    .finally(() => {
      if (pending === request) pending = null
    })
  pending = request
  return request
}

/** The login guard bypasses stale UX state, including after session expiry. */
export function clearSessionCache(): void {
  cached = null
  pending = null
  generation++
}
