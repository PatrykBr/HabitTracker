import { ObjectId } from 'mongodb'
import { collections } from './db.server'
import type { HabitDoc, ResetDoc } from './db.server'
import type { HabitDetail, HabitSummary, ResetEntry } from './types'

/** Small grace window so "now" resets aren't rejected by client/server clock skew. */
const CLOCK_SKEW_MS = 2 * 60 * 1000

function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null
}

function habitToSummary(
  doc: HabitDoc,
  lastResetAt: Date | null,
  totalResets: number,
): HabitSummary {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    icon: doc.icon,
    color: doc.color,
    startDate: doc.startDate.toISOString(),
    costPerUnit: doc.costPerUnit,
    unitsPerDay: doc.unitsPerDay,
    createdAt: doc.createdAt.toISOString(),
    lastResetAt: lastResetAt ? lastResetAt.toISOString() : null,
    totalResets,
  }
}

function resetToEntry(doc: ResetDoc): ResetEntry {
  return {
    id: doc._id.toHexString(),
    timestamp: doc.timestamp.toISOString(),
    trigger: doc.trigger,
    note: doc.note,
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function listHabitsForUser(
  userId: string,
): Promise<HabitSummary[]> {
  const { habits, resets } = collections()
  const [habitDocs, resetStats] = await Promise.all([
    habits.find({ userId }).sort({ createdAt: 1 }).toArray(),
    resets
      .aggregate<{ _id: ObjectId; count: number; last: Date }>([
        { $match: { userId } },
        {
          $group: {
            _id: '$habitId',
            count: { $sum: 1 },
            last: { $max: '$timestamp' },
          },
        },
      ])
      .toArray(),
  ])
  const statsByHabit = new Map(
    resetStats.map((s) => [s._id.toHexString(), s] as const),
  )
  return habitDocs.map((doc) => {
    const stats = statsByHabit.get(doc._id.toHexString())
    return habitToSummary(doc, stats?.last ?? null, stats?.count ?? 0)
  })
}

export interface CreateHabitInput {
  name: string
  icon: string
  color: string
  startDate: string
  costPerUnit: number | null
  unitsPerDay: number | null
}

export async function createHabitForUser(
  userId: string,
  input: CreateHabitInput,
): Promise<HabitSummary> {
  const startDate = new Date(input.startDate)
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('That start date doesn’t look right — try again.')
  }
  if (startDate.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw new Error('The start date can’t be in the future.')
  }
  const { habits } = collections()
  const doc: HabitDoc = {
    _id: new ObjectId(),
    userId,
    name: input.name,
    icon: input.icon,
    color: input.color,
    startDate,
    costPerUnit: input.costPerUnit,
    unitsPerDay: input.unitsPerDay,
    createdAt: new Date(),
  }
  await habits.insertOne(doc)
  return habitToSummary(doc, null, 0)
}

async function findOwnedHabit(
  userId: string,
  habitId: string,
): Promise<HabitDoc | null> {
  const _id = toObjectId(habitId)
  if (!_id) return null
  const { habits } = collections()
  return habits.findOne({ _id, userId })
}

export async function getHabitDetailForUser(
  userId: string,
  habitId: string,
): Promise<HabitDetail | null> {
  const habit = await findOwnedHabit(userId, habitId)
  if (!habit) return null
  const { resets } = collections()
  const resetDocs = await resets
    .find({ habitId: habit._id, userId })
    .sort({ timestamp: -1 })
    .toArray()
  return {
    ...habitToSummary(
      habit,
      resetDocs.length > 0 ? resetDocs[0].timestamp : null,
      resetDocs.length,
    ),
    resets: resetDocs.map(resetToEntry),
  }
}

export interface LogResetInput {
  habitId: string
  timestamp: string
  trigger: string | null
  note: string | null
}

export async function logResetForUser(
  userId: string,
  input: LogResetInput,
): Promise<ResetEntry> {
  const habit = await findOwnedHabit(userId, input.habitId)
  if (!habit) {
    throw new Error('We couldn’t find that habit.')
  }
  const timestamp = new Date(input.timestamp)
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('That date and time doesn’t look right — try again.')
  }
  if (timestamp.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw new Error('A reset can’t be in the future.')
  }
  if (timestamp.getTime() < habit.startDate.getTime()) {
    throw new Error('That’s before you started tracking this habit.')
  }
  const { resets } = collections()
  const latest = await resets
    .find({ habitId: habit._id, userId })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray()
  if (latest.length > 0 && timestamp.getTime() <= latest[0].timestamp.getTime()) {
    throw new Error(
      'That’s earlier than a reset you already logged. Pick a time after your most recent reset.',
    )
  }
  const doc: ResetDoc = {
    _id: new ObjectId(),
    habitId: habit._id,
    userId,
    timestamp,
    trigger: input.trigger,
    note: input.note,
    createdAt: new Date(),
  }
  await resets.insertOne(doc)
  return resetToEntry(doc)
}

export async function deleteResetForUser(
  userId: string,
  resetId: string,
): Promise<void> {
  const _id = toObjectId(resetId)
  if (!_id) throw new Error('We couldn’t find that reset.')
  const { resets } = collections()
  const result = await resets.deleteOne({ _id, userId })
  if (result.deletedCount === 0) {
    throw new Error('We couldn’t find that reset.')
  }
}

export async function deleteHabitForUser(
  userId: string,
  habitId: string,
): Promise<void> {
  const habit = await findOwnedHabit(userId, habitId)
  if (!habit) throw new Error('We couldn’t find that habit.')
  const { habits, resets } = collections()
  // Delete the habit first: if the reset cleanup below fails, the leftovers
  // are unreachable (all queries go through the habit) instead of the habit
  // surviving with its history destroyed. No transactions — standalone Mongo
  // (e.g. the dev memory server) doesn't support them.
  const result = await habits.deleteOne({ _id: habit._id, userId })
  if (result.deletedCount === 0) {
    throw new Error('We couldn’t find that habit.')
  }
  await resets.deleteMany({ habitId: habit._id, userId })
}
