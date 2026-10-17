import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

export interface SessionUser {
  id: string
  username: string
  createdAt: string
}

/** Returns the signed-in user, or null. Used by route guards (UX only). */
export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const { headers } = getRequest()
    const session = await auth.api.getSession({ headers })
    if (!session) return null
    const user = session.user
    return {
      id: user.id,
      username: user.displayUsername ?? user.username ?? user.name,
      createdAt: new Date(user.createdAt).toISOString(),
    }
  },
)
