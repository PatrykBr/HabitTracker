import { describe, expect, it } from 'bun:test'
import {
  dominantUnit,
  durationParts,
  formatClock,
  formatDurationHuman,
  formatDurationShort,
  formatUnits,
  toDatetimeLocalValue,
} from './format'
import { DAY_MS, HOUR_MS, MINUTE_MS } from './streaks'

describe('durationParts', () => {
  it('splits milliseconds into d/h/m/s', () => {
    expect(durationParts(2 * DAY_MS + 3 * HOUR_MS + 4 * MINUTE_MS + 5000)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    })
  })
  it('clamps negatives to zero', () => {
    expect(durationParts(-1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('dominantUnit', () => {
  it('prefers days, then hours, then minutes', () => {
    expect(dominantUnit(3 * DAY_MS + HOUR_MS)).toEqual({ value: 3, unit: 'days', short: 'days' })
    expect(dominantUnit(DAY_MS)).toEqual({ value: 1, unit: 'day', short: 'day' })
    expect(dominantUnit(5 * HOUR_MS)).toEqual({ value: 5, unit: 'hours', short: 'hr' })
    expect(dominantUnit(HOUR_MS)).toEqual({ value: 1, unit: 'hour', short: 'hr' })
    expect(dominantUnit(7 * MINUTE_MS)).toEqual({ value: 7, unit: 'minutes', short: 'min' })
    expect(dominantUnit(MINUTE_MS)).toEqual({ value: 1, unit: 'minute', short: 'min' })
  })
  it('shows 0 minutes for a brand-new streak', () => {
    expect(dominantUnit(30_000)).toEqual({ value: 0, unit: 'minutes', short: 'min' })
  })
})

describe('duration strings', () => {
  it('formatDurationShort', () => {
    expect(formatDurationShort(12 * DAY_MS + 4 * HOUR_MS)).toBe('12d 4h')
    expect(formatDurationShort(4 * HOUR_MS + 23 * MINUTE_MS)).toBe('4h 23m')
    expect(formatDurationShort(23 * MINUTE_MS)).toBe('23m')
    expect(formatDurationShort(45_000)).toBe('45s')
  })
  it('formatDurationHuman', () => {
    expect(formatDurationHuman(DAY_MS)).toBe('1 day')
    expect(formatDurationHuman(18 * DAY_MS)).toBe('18 days')
    expect(formatDurationHuman(6 * HOUR_MS)).toBe('6 hours')
    expect(formatDurationHuman(MINUTE_MS)).toBe('1 minute')
    expect(formatDurationHuman(500)).toBe('moments')
  })
  it('formatClock pads and wraps days away', () => {
    expect(formatClock(DAY_MS + 4 * HOUR_MS + 32 * MINUTE_MS + 7000)).toBe('04:32:07')
  })
})

describe('formatUnits', () => {
  it('rounds to one decimal and drops .0', () => {
    expect(formatUnits(3)).toBe('3')
    expect(formatUnits(3.04)).toBe('3')
    expect(formatUnits(3.25)).toBe('3.3')
  })
})

describe('toDatetimeLocalValue', () => {
  it('formats for <input type="datetime-local">', () => {
    expect(toDatetimeLocalValue(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05T09:07')
  })
})
