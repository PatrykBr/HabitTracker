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
  updateHabitForUser,
} from './habits.server'
import { habitFormSchema, logResetSchema, updateHabitSchema } from './schemas'

export const listHabits = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()
    return listHabitsForUser(userId)
  },
)

export const createHabit = createServerFn({ method: 'POST' })
  .validator(habitFormSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return createHabitForUser(userId, data)
  })

export const updateHabit = createServerFn({ method: 'POST' })
  .validator(updateHabitSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await updateHabitForUser(userId, data.habitId, data.patch)
    return { ok: true }
  })

export const getHabitDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ habitId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const detail = await getHabitDetailForUser(userId, data.habitId)
    if (!detail) throw notFound()
    return detail
  })

export const logReset = createServerFn({ method: 'POST' })
  .validator(logResetSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return logResetForUser(userId, data)
  })

export const deleteReset = createServerFn({ method: 'POST' })
  .validator(z.object({ resetId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await deleteResetForUser(userId, data.resetId)
    return { ok: true }
  })

export const deleteHabit = createServerFn({ method: 'POST' })
  .validator(z.object({ habitId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await deleteHabitForUser(userId, data.habitId)
    return { ok: true }
  })
