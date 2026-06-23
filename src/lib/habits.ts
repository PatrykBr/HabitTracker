import "server-only";

import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  startOfMonth,
  subDays,
} from "date-fns";
import { ObjectId, type Filter } from "mongodb";

import { db } from "@/lib/db";

export type HabitDoc = {
  _id?: ObjectId;
  userId: string;
  name: string;
  quitStartedAt: Date;
  motivation: string;
  targetDays: number;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ResetEventDoc = {
  _id?: ObjectId;
  userId: string;
  habitId: ObjectId;
  occurredAt: Date;
  note?: string;
  trigger?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Habit = Omit<HabitDoc, "_id"> & { id: string };
export type ResetEvent = Omit<ResetEventDoc, "_id" | "habitId"> & {
  id: string;
  habitId: string;
};

export type HabitStats = {
  currentDays: number;
  currentHours: number;
  longestDays: number;
  totalResets: number;
  resetsThisWeek: number;
  resetsThisMonth: number;
  averageStreakDays: number;
  avoidedDays: number;
  nextMilestoneDays: number;
  milestoneProgress: number;
  resetFreeRate: number;
  commonTriggers: Array<{ trigger: string; count: number }>;
};

const habits = db.collection<HabitDoc>("habits");
const resetEvents = db.collection<ResetEventDoc>("reset_events");

function serializeHabit(habit: HabitDoc): Habit {
  const { _id, ...habitFields } = habit;

  return {
    ...habitFields,
    id: _id!.toString(),
  };
}

function serializeReset(event: ResetEventDoc): ResetEvent {
  const { _id, habitId, ...eventFields } = event;

  return {
    ...eventFields,
    id: _id!.toString(),
    habitId: habitId.toString(),
  };
}

export function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }

  return new ObjectId(id);
}

export async function getHabits(userId: string) {
  const docs = await habits
    .find({ userId, archivedAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map(serializeHabit);
}

export async function getActiveHabit(userId: string, habitId?: string | null) {
  const filter: Filter<HabitDoc> = { userId, archivedAt: { $exists: false } };

  if (habitId) {
    filter._id = toObjectId(habitId);
  }

  const doc = await habits.findOne(filter, { sort: { createdAt: 1 } });

  return doc ? serializeHabit(doc) : null;
}

export async function getActiveHabitWithResetEvents(userId: string, habitId?: string | null) {
  const filter: Filter<HabitDoc> = { userId, archivedAt: { $exists: false } };

  if (habitId) {
    filter._id = toObjectId(habitId);
  }

  const doc = await habits
    .aggregate<HabitDoc & { events: ResetEventDoc[] }>([
      { $match: filter },
      { $sort: { createdAt: 1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "reset_events",
          localField: "_id",
          foreignField: "habitId",
          pipeline: [
            { $match: { userId } },
            { $sort: { occurredAt: -1, createdAt: -1 } },
          ],
          as: "events",
        },
      },
    ])
    .next();

  if (!doc) {
    return { habit: null, events: [] };
  }

  const { events, ...habit } = doc;

  return {
    habit: serializeHabit(habit),
    events: events.map(serializeReset),
  };
}

export async function getResetEvents(userId: string, habitId: string) {
  const docs = await resetEvents
    .find({ userId, habitId: toObjectId(habitId) })
    .sort({ occurredAt: -1, createdAt: -1 })
    .toArray();

  return docs.map(serializeReset);
}

export async function getRecentResetEvents(userId: string, limit = 6) {
  const docs = await resetEvents
    .find({ userId })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map(serializeReset);
}

export async function createHabit(input: {
  userId: string;
  name: string;
  quitStartedAt: Date;
  motivation: string;
  targetDays: number;
}) {
  const now = new Date();

  const result = await habits.insertOne({
    userId: input.userId,
    name: input.name,
    quitStartedAt: input.quitStartedAt,
    motivation: input.motivation,
    targetDays: input.targetDays,
    createdAt: now,
    updatedAt: now,
  });

  return result.insertedId.toString();
}

export async function updateHabit(input: {
  userId: string;
  habitId: string;
  name: string;
  quitStartedAt: Date;
  motivation: string;
  targetDays: number;
}) {
  await habits.updateOne(
    { _id: toObjectId(input.habitId), userId: input.userId },
    {
      $set: {
        name: input.name,
        quitStartedAt: input.quitStartedAt,
        motivation: input.motivation,
        targetDays: input.targetDays,
        updatedAt: new Date(),
      },
    },
  );
}

export async function createResetEvent(input: {
  userId: string;
  habitId: string;
  occurredAt: Date;
  note?: string;
  trigger?: string;
}) {
  const habit = await habits.findOne({
    _id: toObjectId(input.habitId),
    userId: input.userId,
  });

  if (!habit) {
    throw new Error("Habit not found");
  }

  if (isBefore(input.occurredAt, habit.quitStartedAt)) {
    throw new Error("Reset date cannot be before the clean-since date.");
  }

  const now = new Date();

  await resetEvents.insertOne({
    userId: input.userId,
    habitId: habit._id,
    occurredAt: input.occurredAt,
    note: input.note,
    trigger: input.trigger,
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteResetEvent(input: {
  userId: string;
  resetId: string;
}) {
  await resetEvents.deleteOne({
    _id: toObjectId(input.resetId),
    userId: input.userId,
  });
}

export function calculateStats(habit: Habit, events: ResetEvent[]): HabitStats {
  const now = new Date();
  const ascending = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const latestReset = ascending.at(-1);
  const currentStart = latestReset?.occurredAt ?? habit.quitStartedAt;
  const elapsedDays = Math.max(0, differenceInCalendarDays(now, habit.quitStartedAt));
  const currentDays = Math.max(0, differenceInCalendarDays(now, currentStart));
  const currentHours = Math.max(
    0,
    Math.floor((now.getTime() - currentStart.getTime()) / (1000 * 60 * 60)),
  );

  const completedStreaks: number[] = [];
  let segmentStart = habit.quitStartedAt;

  for (const event of ascending) {
    if (isBefore(event.occurredAt, habit.quitStartedAt)) {
      continue;
    }

    completedStreaks.push(
      Math.max(0, differenceInCalendarDays(event.occurredAt, segmentStart)),
    );
    segmentStart = event.occurredAt;
  }

  const allStreaks = [...completedStreaks, currentDays];
  const longestDays = allStreaks.length > 0 ? Math.max(...allStreaks) : currentDays;
  const averageStreakDays = completedStreaks.length
    ? Math.round(
        completedStreaks.reduce((sum, streak) => sum + streak, 0) /
          completedStreaks.length,
      )
    : currentDays;

  const weekStart = subDays(now, 7);
  const monthStart = startOfMonth(now);
  const resetDays = new Set(events.map((event) => format(event.occurredAt, "yyyy-MM-dd")));
  const triggerCounts = new Map<string, number>();

  for (const event of events) {
    if (event.trigger) {
      triggerCounts.set(event.trigger, (triggerCounts.get(event.trigger) ?? 0) + 1);
    }
  }

  const milestoneOptions = [1, 3, 7, 14, 30, 60, 90, 180, 365, habit.targetDays]
    .filter((days) => days > currentDays)
    .sort((a, b) => a - b);
  const nextMilestoneDays = milestoneOptions[0] ?? habit.targetDays;

  return {
    currentDays,
    currentHours,
    longestDays,
    totalResets: events.length,
    resetsThisWeek: events.filter((event) => isAfter(event.occurredAt, weekStart)).length,
    resetsThisMonth: events.filter((event) => isAfter(event.occurredAt, monthStart)).length,
    averageStreakDays,
    avoidedDays: Math.max(0, elapsedDays - resetDays.size),
    nextMilestoneDays,
    milestoneProgress: Math.min(100, Math.round((currentDays / nextMilestoneDays) * 100)),
    resetFreeRate:
      elapsedDays === 0 ? 100 : Math.max(0, Math.round(((elapsedDays - resetDays.size) / elapsedDays) * 100)),
    commonTriggers: [...triggerCounts.entries()]
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
  };
}

export function getMonthResetMap(events: ResetEvent[], monthDate: Date) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const map = new Map<string, ResetEvent[]>();

  for (const event of events) {
    if (isBefore(event.occurredAt, start) || isAfter(event.occurredAt, end)) {
      continue;
    }

    const key = format(event.occurredAt, "yyyy-MM-dd");
    const dayEvents = map.get(key) ?? [];
    dayEvents.push(event);
    map.set(key, dayEvents);
  }

  return map;
}
