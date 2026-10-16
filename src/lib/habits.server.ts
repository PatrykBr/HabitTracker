import { ObjectId } from 'mongodb'
import type { ClientSession } from 'mongodb'
import { collections, ensureIndexes, getMongoClient } from './db.server'
import type { HabitDoc, ResetDoc } from './db.server'
import { UserFacingError } from './errors'
import type { HabitFormInput, LogResetInput } from './schemas'
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

function parseStartDate(value: string): Date {
  const startDate = new Date(value)
  if (Number.isNaN(startDate.getTime())) {
    throw new UserFacingError('That start date doesn’t look right — try again.')
  }
  if (startDate.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw new UserFacingError('The start date can’t be in the future.')
  }
  return startDate
}

export async function createHabitForUser(
  userId: string,
  input: HabitFormInput,
): Promise<HabitSummary> {
  const startDate = parseStartDate(input.startDate)
  await ensureIndexes()
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

/**
 * All history mutations write the parent first. Snapshot reads alone don't
 * conflict with concurrent inserts into another collection; this write makes
 * Mongo retry competing edits/logs/deletes against the latest committed state.
 */
async function mutateHabit<T>(
  userId: string,
  habitId: string,
  action: (habit: HabitDoc, session: ClientSession) => Promise<T>,
): Promise<T> {
  const _id = toObjectId(habitId)
  if (!_id) throw new UserFacingError('We couldn’t find that habit.')
  await ensureIndexes()
  const { habits } = collections()
  return getMongoClient().withSession((session) =>
    session.withTransaction(async () => {
      const habit = await habits.findOneAndUpdate(
        { _id, userId },
        { $inc: { revision: 1 } },
        { session, returnDocument: 'after' },
      )
      if (!habit) throw new UserFacingError('We couldn’t find that habit.')
      return action(habit, session)
    }),
  )
}

export async function updateHabitForUser(
  userId: string,
  habitId: string,
  patch: HabitFormInput,
): Promise<void> {
  const startDate = parseStartDate(patch.startDate)
  return mutateHabit(userId, habitId, async (habit, session) => {
    const { habits, resets } = collections()
    // Moving the start later than an existing reset would put that reset
    // before the habit began - the same rule logging enforces, from the other side.
    const earliest = await resets
      .find({ habitId: habit._id, userId }, { session })
      .sort({ timestamp: 1 })
      .limit(1)
      .toArray()
    if (
      earliest.length > 0 &&
      startDate.getTime() > earliest[0].timestamp.getTime()
    ) {
      throw new UserFacingError(
        'The start date has to be on or before your first logged reset.',
      )
    }
    await habits.updateOne(
      { _id: habit._id, userId },
      {
        $set: {
          name: patch.name,
          icon: patch.icon,
          color: patch.color,
          startDate,
          costPerUnit: patch.costPerUnit,
          unitsPerDay: patch.unitsPerDay,
        },
      },
      { session },
    )
  })
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

export async function logResetForUser(
  userId: string,
  input: LogResetInput,
): Promise<ResetEntry> {
  const timestamp = new Date(input.timestamp)
  if (Number.isNaN(timestamp.getTime())) {
    throw new UserFacingError(
      'That date and time doesn’t look right — try again.',
    )
  }
  if (timestamp.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw new UserFacingError('A reset can’t be in the future.')
  }
  return mutateHabit(userId, input.habitId, async (habit, session) => {
    if (timestamp.getTime() < habit.startDate.getTime()) {
      throw new UserFacingError(
        'That’s before you started tracking this habit.',
      )
    }
    const { resets } = collections()
    const latest = await resets
      .find({ habitId: habit._id, userId }, { session })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray()
    if (
      latest.length > 0 &&
      timestamp.getTime() <= latest[0].timestamp.getTime()
    ) {
      throw new UserFacingError(
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
    await resets.insertOne(doc, { session })
    return resetToEntry(doc)
  })
}

export async function deleteResetForUser(
  userId: string,
  resetId: string,
): Promise<void> {
  const _id = toObjectId(resetId)
  if (!_id) throw new UserFacingError('We couldn’t find that reset.')
  const { resets } = collections()
  const reset = await resets.findOne({ _id, userId })
  if (!reset) throw new UserFacingError('We couldn’t find that reset.')
  await mutateHabit(
    userId,
    reset.habitId.toHexString(),
    async (habit, session) => {
      const result = await resets.deleteOne(
        { _id, habitId: habit._id, userId },
        { session },
      )
      if (result.deletedCount === 0)
        throw new UserFacingError('We couldn’t find that reset.')
    },
  )
}

export async function deleteHabitForUser(
  userId: string,
  habitId: string,
): Promise<void> {
  await mutateHabit(userId, habitId, async (habit, session) => {
    const { habits, resets } = collections()
    await habits.deleteOne({ _id: habit._id, userId }, { session })
    await resets.deleteMany({ habitId: habit._id, userId }, { session })
  })
}
