import { z } from 'zod'
import { UserFacingError } from './errors'

/**
 * Forms and server functions share these validation schemas and messages.
 */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 30
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

export const usernameSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^[a-zA-Z0-9_.]{${USERNAME_MIN},${USERNAME_MAX}}$`),
    `Usernames must have ${USERNAME_MIN} to ${USERNAME_MAX} characters. Use letters, numbers, dots or underscores.`,
  )

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Your password needs at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Your password can be at most ${PASSWORD_MAX} characters.`)

/** ASCII hex keeps every allowed username valid in an email local part. */
export function internalEmailFor(username: string): string {
  const hex = Array.from(username.trim().toLowerCase(), (c) =>
    c.charCodeAt(0).toString(16).padStart(2, '0'),
  ).join('')
  return `u-${hex}@users.reset.internal`
}

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

const positiveNumber = (max: number) =>
  z
    .number({ error: 'Cost and units should be positive numbers.' })
    .positive('Cost and units should be positive numbers.')
    .max(max, 'That number is too large.')

/** Fields the user edits when creating or updating a habit. */
export const habitFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Give your habit a name.').max(60),
    icon: z.string().min(1).max(8),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    startDate: z.iso.datetime({
      error: 'Enter a valid start date.',
    }),
    costPerUnit: positiveNumber(1_000_000).nullable(),
    unitsPerDay: positiveNumber(10_000).nullable(),
  })
  // Savings estimates require both cost per unit and units per day.
  .refine((d) => (d.costPerUnit === null) === (d.unitsPerDay === null), {
    message:
      'Enter both cost per unit and units per day, or leave both empty.',
  })

export type HabitFormInput = z.infer<typeof habitFormSchema>

export const updateHabitSchema = z.object({
  habitId: z.string(),
  patch: habitFormSchema,
})

/** Empty strings become null so optional fields have one representation. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((s) => (s ? s : null))

export const logResetSchema = z.object({
  habitId: z.string(),
  timestamp: z.iso.datetime({
    error: 'Enter a valid date and time.',
  }),
  trigger: optionalText(32),
  note: optionalText(500),
})

export type LogResetInput = z.infer<typeof logResetSchema>

/** First validation message from a failed `safeParse`, for inline form errors. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Check the form and try again.'
}

/** Form validation uses the same safe, inline error path as expected server errors. */
export function parseForm<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (!result.success) throw new UserFacingError(firstIssueMessage(result.error))
  return result.data
}
