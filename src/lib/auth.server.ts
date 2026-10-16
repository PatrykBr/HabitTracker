import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

/**
 * Data-boundary auth check. Every server function that touches user data must
 * call this inside its handler - route guards are UX, not security.
 *
 * Throws a redirect rather than an error: when a session expires mid-visit the
 * user lands on the login page instead of a dead-end error screen.
 */
export async function requireUserId(): Promise<string> {
  const { headers } = getRequest()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw redirect({ to: '/login', replace: true })
  }
  return session.user.id
}
