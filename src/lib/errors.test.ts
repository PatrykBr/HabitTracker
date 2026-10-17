import { describe, expect, it } from 'bun:test'
import { UserFacingError, isUserFacingError, userMessage } from './errors'

describe('UserFacingError', () => {
  it('is recognised as an instance', () => {
    const err = new UserFacingError('Nope.')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('UserFacingError')
    expect(isUserFacingError(err)).toBe(true)
  })

  it('survives losing its prototype (server-to-client serialization)', () => {
    const wire = JSON.parse(
      JSON.stringify({ name: 'UserFacingError', message: 'Nope.', userFacing: true }),
    )
    expect(isUserFacingError(wire)).toBe(true)
    expect(userMessage(wire, 'fallback')).toBe('Nope.')
  })

  it('does not treat other errors as user-facing', () => {
    expect(isUserFacingError(new Error('ECONNREFUSED'))).toBe(false)
    expect(isUserFacingError('string')).toBe(false)
    expect(isUserFacingError(null)).toBe(false)
    expect(userMessage(new Error('[{"code":"invalid_type"}]'), 'Try again.')).toBe(
      'Try again.',
    )
  })

  it('falls back when the user-facing message is empty', () => {
    expect(userMessage(new UserFacingError(''), 'Try again.')).toBe('Try again.')
  })
})
