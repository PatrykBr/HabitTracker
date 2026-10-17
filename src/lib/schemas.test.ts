import { describe, expect, it } from 'bun:test'
import {
  credentialsSchema,
  firstIssueMessage,
  habitFormSchema,
  logResetSchema,
  internalEmailFor,
  parseForm,
} from './schemas'
import { UserFacingError } from './errors'

const validHabit = {
  name: 'Coffee',
  icon: '☕',
  color: '#ff8800',
  startDate: '2026-01-01T12:00:00.000Z',
  costPerUnit: null,
  unitsPerDay: null,
}

describe('parseForm', () => {
  it('returns normalized form values', () => {
    expect(parseForm(credentialsSchema, {
      username: '  Alice  ', password: 'longenough',
    })).toEqual({ username: 'Alice', password: 'longenough' })
    expect(parseForm(logResetSchema, {
      habitId: 'abc', timestamp: validHabit.startDate, trigger: '  ', note: ' note ',
    })).toEqual({
      habitId: 'abc', timestamp: validHabit.startDate, trigger: null, note: 'note',
    })
  })
  it('uses friendly expected errors for invalid fields and cross-field rules', () => {
    for (const [input, message] of [
      [{ ...validHabit, name: '' }, 'Give your habit a name.'],
      [{ ...validHabit, costPerUnit: 2 }, 'Enter both cost per unit and units per day, or leave both empty.'],
    ] as const) {
      expect(() => parseForm(habitFormSchema, input)).toThrow(new UserFacingError(message))
    }
  })
})

describe('credentialsSchema', () => {
  it('caps passwords before hashing', () => {
    expect(
      credentialsSchema.safeParse({
        username: 'alice',
        password: 'a'.repeat(129),
      }).success,
    ).toBe(false)
  })
  it('trims and accepts a valid username', () => {
    const r = credentialsSchema.safeParse({
      username: '  alice.b_1 ',
      password: 'longenough',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.username).toBe('alice.b_1')
  })
  it('rejects short usernames with the user-facing copy', () => {
    const r = credentialsSchema.safeParse({
      username: 'ab',
      password: 'longenough',
    })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(firstIssueMessage(r.error)).toMatch(/3 to 30 characters/)
  })
  it('rejects short passwords', () => {
    const r = credentialsSchema.safeParse({
      username: 'alice',
      password: 'short',
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(firstIssueMessage(r.error)).toMatch(/at least 8/)
  })
})

describe('internalEmailFor', () => {
  it('maps even dot-heavy usernames to valid, distinct synthetic emails', () => {
    expect(internalEmailFor(' Alice ')).toBe(internalEmailFor('alice'))
    expect(internalEmailFor('a..b')).toBe('u-612e2e62@users.reset.internal')
    expect(internalEmailFor('a_b')).not.toBe(internalEmailFor('a.b'))
  })
})

describe('habitFormSchema', () => {
  it('accepts a habit with no savings fields', () => {
    expect(habitFormSchema.safeParse(validHabit).success).toBe(true)
  })
  it('accepts a habit with both savings fields', () => {
    expect(
      habitFormSchema.safeParse({
        ...validHabit,
        costPerUnit: 4.5,
        unitsPerDay: 2,
      }).success,
    ).toBe(true)
  })
  it('rejects only one savings field set', () => {
    const r = habitFormSchema.safeParse({ ...validHabit, costPerUnit: 4.5 })
    expect(r.success).toBe(false)
    if (!r.success) expect(firstIssueMessage(r.error)).toMatch(/both/)
  })
  it('rejects a blank name', () => {
    const r = habitFormSchema.safeParse({ ...validHabit, name: '   ' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(firstIssueMessage(r.error)).toBe('Give your habit a name.')
  })
  it('rejects non-ISO start dates', () => {
    expect(
      habitFormSchema.safeParse({ ...validHabit, startDate: 'yesterday' })
        .success,
    ).toBe(false)
  })
  it('rejects non-positive numbers', () => {
    expect(
      habitFormSchema.safeParse({
        ...validHabit,
        costPerUnit: 0,
        unitsPerDay: 1,
      }).success,
    ).toBe(false)
  })
})

describe('logResetSchema', () => {
  it('normalizes empty optional text to null', () => {
    const r = logResetSchema.safeParse({
      habitId: 'abc',
      timestamp: '2026-01-02T12:00:00.000Z',
      trigger: '  ',
      note: null,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.trigger).toBeNull()
      expect(r.data.note).toBeNull()
    }
  })
  it('keeps trimmed text', () => {
    const r = logResetSchema.safeParse({
      habitId: 'abc',
      timestamp: '2026-01-02T12:00:00.000Z',
      trigger: ' Stress ',
      note: 'Long day.',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.trigger).toBe('Stress')
  })
})
