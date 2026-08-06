import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getDb } from './db.server'

/**
 * Better Auth instance (server-only).
 *
 * Auth is username + password. Better Auth's email/password provider requires
 * an email, so we synthesize a non-routable internal one from the username —
 * no email is ever collected or sent (no verification / reset flows in v1).
 */
export const auth = betterAuth({
  database: mongodbAdapter(getDb()),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 30 }),
    // Must stay last so cookies set by auth flows reach TanStack Start responses.
    tanstackStartCookies(),
  ],
})
