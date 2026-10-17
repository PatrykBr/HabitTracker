import type { ResetEntry } from './types'

/**
 * Pure streak math. Timestamps are stored in UTC; everything that involves
 * "which day was that" uses local Date methods so days match the user's
 * actual timezone.
 */

export const MINUTE_MS = 60_000
export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000

export interface Segment {
  start: Date
  end: Date
  ms: number
  /** True for the streak currently running (ends "now"). */
  ongoing: boolean
}

/** Static history derived once per load; the live counter adds only its own duration. */
export function summarizeHistory(
  startDate: Date,
  resetsNewestFirst: ResetEntry[],
) {
  const resetDatesAsc: Date[] = []
  const brokenByResetId = new Map<string, number>()
  const completedSegments: Segment[] = []
  let completedMax = 0
  let completedTotal = 0
  let start = startDate
  for (let i = resetsNewestFirst.length - 1; i >= 0; i--) {
    const reset = resetsNewestFirst[i]
    const end = new Date(reset.timestamp)
    const ms = Math.max(0, end.getTime() - start.getTime())
    resetDatesAsc.push(end)
    brokenByResetId.set(reset.id, ms)
    completedSegments.push({
      start,
      end,
      ms,
      ongoing: false,
    })
    completedMax = Math.max(completedMax, ms)
    completedTotal += ms
    start = end
  }
  return {
    resetDatesAsc,
    brokenByResetId,
    completedSegments,
    completedMax,
    completedTotal,
  }
}

export function currentStreakStart(
  startDate: Date,
  lastResetAt: Date | null,
): Date {
  return lastResetAt && lastResetAt.getTime() > startDate.getTime()
    ? lastResetAt
    : startDate
}

export interface Milestone {
  ms: number
  label: string
  short: string
}

export const MILESTONES: Milestone[] = [
  { ms: DAY_MS, label: '24 hours', short: '24h' },
  { ms: 3 * DAY_MS, label: '3 days', short: '3d' },
  { ms: 7 * DAY_MS, label: '1 week', short: '1w' },
  { ms: 14 * DAY_MS, label: '2 weeks', short: '2w' },
  { ms: 30 * DAY_MS, label: '1 month', short: '1mo' },
  { ms: 90 * DAY_MS, label: '3 months', short: '3mo' },
  { ms: 180 * DAY_MS, label: '6 months', short: '6mo' },
  { ms: 365 * DAY_MS, label: '1 year', short: '1y' },
]

export function nextMilestone(streakMs: number): Milestone | null {
  return MILESTONES.find((m) => m.ms > streakMs) ?? null
}

/** Milestone crossed between two ticks of the live counter, if any. */
export function milestoneCrossed(
  prevMs: number,
  currentMs: number,
): Milestone | null {
  return MILESTONES.find((m) => prevMs < m.ms && currentMs >= m.ms) ?? null
}

/** Counts per local day-of-week, index 0 = Sunday. */
export function dayOfWeekCounts(dates: Date[]): number[] {
  const counts = new Array<number>(7).fill(0)
  for (const d of dates) counts[d.getDay()]++
  return counts
}

export interface TimeBucket {
  label: string
  emoji: string
  count: number
}

/** Counts per local time-of-day bucket. */
export function timeOfDayCounts(dates: Date[]): TimeBucket[] {
  const buckets: TimeBucket[] = [
    { label: 'Morning', emoji: '🌅', count: 0 }, // 06:00 to 12:00
    { label: 'Afternoon', emoji: '☀️', count: 0 }, // 12:00 to 18:00
    { label: 'Evening', emoji: '🌆', count: 0 }, // 18:00 to midnight
    { label: 'Night', emoji: '🌙', count: 0 }, // Midnight to 06:00
  ]
  for (const d of dates) {
    const h = d.getHours()
    if (h >= 6 && h < 12) buckets[0].count++
    else if (h >= 12 && h < 18) buckets[1].count++
    else if (h >= 18) buckets[2].count++
    else buckets[3].count++
  }
  return buckets
}

/** Local-timezone day key, e.g. "2026-07-28". */
export function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
