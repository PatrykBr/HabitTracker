import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

/**
 * Every server function that accesses user data must call this in its handler.
 * Route guards alone cannot protect server functions from direct requests.
 * Redirect to login when the session is missing or expired.
 */
export async function requireUserId(): Promise<string> {
  const { headers } = getRequest()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw redirect({ to: '/login', replace: true })
  }
  return session.user.id
}
