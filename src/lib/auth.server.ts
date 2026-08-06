import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

/**
 * Data-boundary auth check. Every server function that touches user data must
 * call this inside its handler — route guards are UX, not security.
 */
export async function requireUserId(): Promise<string> {
  const { headers } = getRequest()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('You need to be signed in to do that.')
  }
  return session.user.id
}
