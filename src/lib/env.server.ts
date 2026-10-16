import { z } from 'zod'

/**
 * Server environment, validated once on first use so a missing or malformed
 * variable fails fast with one clear message instead of a confusing error
 * deep inside a driver. Split in two so tooling that only needs the database
 * (e.g. `bun run smoke:data`) doesn't have to configure auth.
 */

/** Treats unset and blank the same, so `FOO=` in .env behaves like a missing FOO. */
const blankAsUndefined = (v: unknown) => (v === '' ? undefined : v)

const MONGODB_URI_MSG =
  'MONGODB_URI is not set. Add it to your .env file (see .env.example).'
const SECRET_MSG =
  'BETTER_AUTH_SECRET is missing or too short (need 32+ characters). Generate one with: openssl rand -base64 32'

const dbEnvSchema = z.object({
  MONGODB_URI: z.preprocess(
    blankAsUndefined,
    z
      .string({ error: MONGODB_URI_MSG })
      .regex(
        /^mongodb(?:\+srv)?:\/\//,
        'MONGODB_URI must start with mongodb:// or mongodb+srv://.',
      ),
  ),
  MONGODB_DB: z.preprocess(
    blankAsUndefined,
    z.string().default('reset-tracker'),
  ),
})

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.preprocess(
    blankAsUndefined,
    z.string({ error: SECRET_MSG }).min(32, SECRET_MSG),
  ),
  BETTER_AUTH_URL: z.preprocess(
    blankAsUndefined,
    z
      .url({
        error:
          'BETTER_AUTH_URL must be the exact public origin of the app, e.g. http://localhost:3000',
      })
      .refine((value) => {
        const url = new URL(value)
        return (
          (url.protocol === 'http:' || url.protocol === 'https:') &&
          !url.username &&
          !url.password &&
          url.pathname === '/' &&
          !url.search &&
          !url.hash
        )
      }, 'BETTER_AUTH_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.')
      .transform((value) => new URL(value).origin),
  ),
})

function parseEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    throw new Error(
      `Invalid server environment:\n${result.error.issues
        .map((i) => `  - ${i.message}`)
        .join('\n')}`,
    )
  }
  return result.data
}

let dbEnvCache: z.infer<typeof dbEnvSchema> | undefined
let authEnvCache: z.infer<typeof authEnvSchema> | undefined

export function dbEnv() {
  return (dbEnvCache ??= parseEnv(dbEnvSchema))
}

export function authEnv() {
  return (authEnvCache ??= parseEnv(authEnvSchema))
}
