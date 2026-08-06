import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { requireUserId } from './auth.server'
import {
  createHabitForUser,
  deleteHabitForUser,
  deleteResetForUser,
  getHabitDetailForUser,
  listHabitsForUser,
  logResetForUser,
} from './habits.server'

const createHabitSchema = z
  .object({
    name: z.string().trim().min(1, 'Give your habit a name.').max(60),
    icon: z.string().min(1).max(8),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    startDate: z.string(),
    costPerUnit: z.number().positive().max(1_000_000).nullable(),
    unitsPerDay: z.number().positive().max(10_000).nullable(),
  })
  // Savings stats need both numbers — half-filled settings would silently do nothing.
  .refine((d) => (d.costPerUnit === null) === (d.unitsPerDay === null), {
    message:
      'To track savings, fill in both cost per unit and units per day — or leave both empty.',
  })

const logResetSchema = z.object({
  habitId: z.string(),
  timestamp: z.string(),
  trigger: z.string().trim().max(32).nullable(),
  note: z.string().trim().max(500).nullable(),
})

export const listHabits = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()
    return listHabitsForUser(userId)
  },
)

export const createHabit = createServerFn({ method: 'POST' })
  .inputValidator(createHabitSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return createHabitForUser(userId, data)
  })

export const getHabitDetail = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ habitId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const detail = await getHabitDetailForUser(userId, data.habitId)
    if (!detail) throw notFound()
    return detail
  })

export const logReset = createServerFn({ method: 'POST' })
  .inputValidator(logResetSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return logResetForUser(userId, {
      habitId: data.habitId,
      timestamp: data.timestamp,
      trigger: data.trigger && data.trigger.length > 0 ? data.trigger : null,
      note: data.note && data.note.length > 0 ? data.note : null,
    })
  })

export const deleteReset = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ resetId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await deleteResetForUser(userId, data.resetId)
    return { ok: true }
  })

export const deleteHabit = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ habitId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await deleteHabitForUser(userId, data.habitId)
    return { ok: true }
  })
