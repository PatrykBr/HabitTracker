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
import { MongoServerError, ObjectId, type Filter } from "mongodb";

import { getMongoDb } from "@/lib/db";

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
  resetsPreviousWeek: number;
  resetsThisMonth: number;
  averageStreakDays: number;
  avoidedDays: number;
  cleanDaysThisWeek: number;
  daysSinceLastReset: number | null;
  nextMilestoneDays: number;
  daysUntilNextMilestone: number;
  milestoneProgress: number;
  resetFreeRate: number;
  weeklyResetTrend: number;
  streakVsAverageDays: number;
  commonTriggers: Array<{ trigger: string; count: number }>;
};

function habits() {
  return getMongoDb().collection<HabitDoc>("habits");
}

function resetEvents() {
  return getMongoDb().collection<ResetEventDoc>("reset_events");
}

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

function optionalObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function getActiveHabit(userId: string, habitId?: string | null) {
  const filter: Filter<HabitDoc> = { userId, archivedAt: { $exists: false } };

  if (habitId) {
    const objectId = optionalObjectId(habitId);

    if (objectId) {
      filter._id = objectId;
    }
  }

  const doc = await habits().findOne(filter, { sort: { createdAt: 1 } });

  return doc ? serializeHabit(doc) : null;
}

export async function getResetEventsForHabit(
  userId: string,
  habitId: string,
  range?: { start: Date; end: Date },
) {
  const objectId = optionalObjectId(habitId);

  if (!objectId) {
    return [];
  }

  const filter: Filter<ResetEventDoc> = { userId, habitId: objectId };

  if (range) {
    filter.occurredAt = { $gte: range.start, $lte: range.end };
  }

  const docs = await resetEvents()
    .find(filter)
    .sort({ occurredAt: -1, createdAt: -1 })
    .toArray();

  return docs.map(serializeReset);
}

export async function getActiveHabitEventHistory(userId: string, habitId?: string | null) {
  const habit = await getActiveHabit(userId, habitId);

  if (!habit) {
    return { habit: null, events: [] };
  }

  return {
    habit,
    events: await getResetEventsForHabit(userId, habit.id),
  };
}

export async function createHabit(input: {
  userId: string;
  name: string;
  quitStartedAt: Date;
  motivation: string;
  targetDays: number;
}) {
  const now = new Date();

  let result;

  try {
    result = await habits().insertOne({
      userId: input.userId,
      name: input.name,
      quitStartedAt: input.quitStartedAt,
      motivation: input.motivation,
      targetDays: input.targetDays,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new Error("You already have an active habit.");
    }

    throw error;
  }

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
  const result = await habits().updateOne(
    { _id: toObjectId(input.habitId), userId: input.userId, archivedAt: { $exists: false } },
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

  if (result.matchedCount === 0) {
    throw new Error("Habit not found.");
  }
}

export async function createResetEvent(input: {
  userId: string;
  habitId: string;
  occurredAt: Date;
  note?: string;
  trigger?: string;
}) {
  const habit = await habits().findOne({
    _id: toObjectId(input.habitId),
    userId: input.userId,
    archivedAt: { $exists: false },
  });

  if (!habit) {
    throw new Error("Habit not found");
  }

  if (isBefore(input.occurredAt, habit.quitStartedAt)) {
    throw new Error("Reset date cannot be before the clean-since date.");
  }

  const now = new Date();

  await resetEvents().insertOne({
    userId: input.userId,
    habitId: habit._id,
    occurredAt: input.occurredAt,
    ...(input.note ? { note: input.note } : {}),
    ...(input.trigger ? { trigger: input.trigger } : {}),
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteResetEvent(input: {
  userId: string;
  resetId: string;
}) {
  const resetId = optionalObjectId(input.resetId);

  if (!resetId) {
    return;
  }

  await resetEvents().deleteOne({
    _id: resetId,
    userId: input.userId,
  });
}

export function calculateStats(habit: Habit, events: ResetEvent[]): HabitStats {
  const now = new Date();
  const ascending = events.toSorted(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const oldestReset = ascending[0];
  const latestReset = ascending.at(-1);
  const currentStart = latestReset?.occurredAt ?? habit.quitStartedAt;
  const trackingStart = oldestReset && isBefore(oldestReset.occurredAt, habit.quitStartedAt)
    ? oldestReset.occurredAt
    : habit.quitStartedAt;
  const elapsedDays = Math.max(0, differenceInCalendarDays(now, trackingStart));
  const currentDays = Math.max(0, differenceInCalendarDays(now, currentStart));
  const currentHours = Math.max(
    0,
    Math.floor((now.getTime() - currentStart.getTime()) / (1000 * 60 * 60)),
  );

  const completedStreaks: number[] = [];
  let segmentStart = trackingStart;
  let hasOpenSegment = !oldestReset || !isBefore(oldestReset.occurredAt, habit.quitStartedAt);

  for (const event of ascending) {
    if (isBefore(event.occurredAt, segmentStart)) {
      continue;
    }

    if (hasOpenSegment) {
      completedStreaks.push(
        Math.max(0, differenceInCalendarDays(event.occurredAt, segmentStart)),
      );
    }

    segmentStart = event.occurredAt;
    hasOpenSegment = true;
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
  const previousWeekStart = subDays(now, 14);
  const monthStart = startOfMonth(now);
  const resetDays = new Set<string>();
  const resetDaysThisWeek = new Set<string>();
  const triggerCounts = new Map<string, number>();
  let resetsThisWeek = 0;
  let resetsPreviousWeek = 0;
  let resetsThisMonth = 0;

  for (const event of events) {
    const resetDay = format(event.occurredAt, "yyyy-MM-dd");
    resetDays.add(resetDay);

    if (isAfter(event.occurredAt, weekStart)) {
      resetsThisWeek += 1;
      resetDaysThisWeek.add(resetDay);
    } else if (isAfter(event.occurredAt, previousWeekStart)) {
      resetsPreviousWeek += 1;
    }

    if (isAfter(event.occurredAt, monthStart)) {
      resetsThisMonth += 1;
    }

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
    resetsThisWeek,
    resetsPreviousWeek,
    resetsThisMonth,
    averageStreakDays,
    avoidedDays: Math.max(0, elapsedDays - resetDays.size),
    cleanDaysThisWeek: Math.max(0, 7 - resetDaysThisWeek.size),
    daysSinceLastReset: latestReset ? Math.max(0, differenceInCalendarDays(now, latestReset.occurredAt)) : null,
    nextMilestoneDays,
    daysUntilNextMilestone: Math.max(0, nextMilestoneDays - currentDays),
    milestoneProgress: Math.min(100, Math.round((currentDays / nextMilestoneDays) * 100)),
    resetFreeRate:
      elapsedDays === 0 ? 100 : Math.max(0, Math.round(((elapsedDays - resetDays.size) / elapsedDays) * 100)),
    weeklyResetTrend: resetsThisWeek - resetsPreviousWeek,
    streakVsAverageDays: currentDays - averageStreakDays,
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
