import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { ensureIndexes, getDb, getMongoClient } from './db.server'
import { authEnv } from './env.server'
import {
  credentialsSchema,
  firstIssueMessage,
  internalEmailFor,
  PASSWORD_MAX,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
} from './schemas'

/**
 * Configure server-side username and password authentication. Better Auth's
 * email/password provider requires an email, so signup generates an internal
 * address from the username. The app does not collect or send email.
 */
export const auth = betterAuth({
  database: mongodbAdapter(getDb(), { client: getMongoClient() }),
  secret: authEnv().BETTER_AUTH_SECRET,
  baseURL: authEnv().BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    customRules: {
      '/sign-up/email': { window: 60, max: 5 },
      '/sign-in/username': { window: 60, max: 10 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      await ensureIndexes()
      if (ctx.path === '/sign-up/email' || ctx.path === '/sign-in/username') {
        const parsed = credentialsSchema.safeParse(ctx.body)
        if (!parsed.success)
          throw new APIError('BAD_REQUEST', {
            message: firstIssueMessage(parsed.error),
          })
        ctx.body.username = parsed.data.username
        if (ctx.path === '/sign-up/email') {
          ctx.body.email = internalEmailFor(parsed.data.username)
          ctx.body.name = parsed.data.username
          ctx.body.displayUsername = parsed.data.username
        }
      }
    }),
  },
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN,
      maxUsernameLength: USERNAME_MAX,
    }),
    // Must stay last so cookies set by auth flows reach TanStack Start responses.
    tanstackStartCookies(),
  ],
})
