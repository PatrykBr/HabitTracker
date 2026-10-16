import { describe, expect, it } from 'bun:test'
import {
  DAY_MS,
  MILESTONES,
  summarizeHistory,
  currentStreakStart,
  dayOfWeekCounts,
  localDayKey,
  milestoneCrossed,
  nextMilestone,
  timeOfDayCounts,
} from './streaks'
import type { ResetEntry } from './types'

const T0 = new Date(2026, 0, 1, 12)
const at = (days: number) => new Date(T0.getTime() + days * DAY_MS)
const reset = (id: string, days: number): ResetEntry => ({
  id,
  timestamp: at(days).toISOString(),
  createdAt: at(days + 1).toISOString(),
  trigger: null,
  note: null,
})

describe('summarizeHistory', () => {
  it('has no completed streaks before the first reset', () => {
    const result = summarizeHistory(T0, [])
    expect(result.completedSegments).toEqual([])
    expect(result.completedMax).toBe(0)
    expect(result.completedTotal).toBe(0)
    expect(result.brokenByResetId.size).toBe(0)
  })
  it('derives chronological segments and per-reset durations from newest-first history', () => {
    const result = summarizeHistory(T0, [reset('last', 4), reset('first', 1)])
    expect(result.resetDatesAsc).toEqual([at(1), at(4)])
    expect(result.completedSegments).toEqual([
      { start: T0, end: at(1), ms: DAY_MS, ongoing: false },
      { start: at(1), end: at(4), ms: 3 * DAY_MS, ongoing: false },
    ])
    expect(result.brokenByResetId.get('first')).toBe(DAY_MS)
    expect(result.brokenByResetId.get('last')).toBe(3 * DAY_MS)
    expect(result.completedMax).toBe(3 * DAY_MS)
    expect(result.completedTotal).toBe(4 * DAY_MS)
  })
  it('uses when a reset happened, rather than when it was logged', () => {
    const result = summarizeHistory(T0, [reset('backdated', 2)])
    expect(result.completedTotal).toBe(2 * DAY_MS)
  })
})

describe('currentStreakStart', () => {
  it('uses the habit start when there is no reset', () => {
    expect(currentStreakStart(T0, null)).toBe(T0)
  })
  it('uses the latest reset when it is after the start', () => {
    expect(currentStreakStart(T0, at(2))).toEqual(at(2))
  })
  it('ignores a reset that predates the start', () => {
    expect(currentStreakStart(at(2), T0)).toEqual(at(2))
  })
})

describe('milestones', () => {
  it('are sorted ascending', () => {
    const ms = MILESTONES.map((m) => m.ms)
    expect(ms).toEqual([...ms].sort((a, b) => a - b))
  })
  it('returns the first milestone beyond the streak', () => {
    expect(nextMilestone(0)?.label).toBe('24 hours')
    expect(nextMilestone(DAY_MS)?.label).toBe('3 days')
    expect(nextMilestone(400 * DAY_MS)).toBeNull()
  })
  it('detects a milestone crossed between ticks', () => {
    expect(milestoneCrossed(DAY_MS - 500, DAY_MS + 500)?.label).toBe('24 hours')
    expect(milestoneCrossed(DAY_MS, DAY_MS + 1000)).toBeNull()
  })
})

describe('local-time bucketing', () => {
  it('counts by local getDay()', () => {
    const counts = dayOfWeekCounts([T0, at(7), at(1)])
    expect(counts[T0.getDay()]).toBe(2)
    expect(counts[at(1).getDay()]).toBe(1)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3)
  })
  it('buckets every time-of-day boundary by local hour', () => {
    const dates = [0, 5, 6, 11, 12, 17, 18, 23].map(
      (h) => new Date(2026, 5, 15, h),
    )
    expect(timeOfDayCounts(dates).map((b) => b.count)).toEqual([2, 2, 2, 2])
  })
  it('produces a zero-padded local key', () => {
    expect(localDayKey(new Date(2026, 6, 5, 23, 59))).toBe('2026-07-05')
  })
})
