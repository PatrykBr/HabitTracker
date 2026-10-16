import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { restoreGlobals, stubGlobal } from '../../tests/globals'
import type { SessionUser } from './auth.functions'

const request = mock((): Promise<SessionUser | null> => Promise.resolve(null))
mock.module('./auth.functions', () => ({ getSessionUser: request }))
// Bun module mocks must be registered before importing their consumers.
const { clearSessionCache, fetchSessionUser } = await import('./session')
const user = {
  id: 'alice',
  username: 'Alice',
  createdAt: '2026-01-01T00:00:00.000Z',
}
beforeEach(() => {
  stubGlobal('window', {})
  clearSessionCache()
  request.mockReset()
})
afterEach(restoreGlobals)

describe('session cache', () => {
  it('deduplicates concurrent guards and caches their response', async () => {
    request.mockResolvedValue(user)
    expect(await Promise.all([fetchSessionUser(), fetchSessionUser()])).toEqual(
      [user, user],
    )
    expect(await fetchSessionUser()).toEqual(user)
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('does not reuse a response from before an account change', async () => {
    let finish!: (value: typeof user) => void
    request.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const old = fetchSessionUser()
    clearSessionCache()
    request.mockResolvedValue(null)
    expect(await fetchSessionUser()).toBeNull()
    finish(user)
    expect(await old).toBeNull()
    expect(await fetchSessionUser()).toBeNull()
  })
  it('retries after a network failure', async () => {
    request.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(user)
    await expect(fetchSessionUser()).rejects.toThrow('offline')
    expect(await fetchSessionUser()).toEqual(user)
  })
  it('never caches across server requests', async () => {
    stubGlobal('window', undefined)
    request.mockResolvedValueOnce(user).mockResolvedValueOnce(null)
    expect(await fetchSessionUser()).toEqual(user)
    expect(await fetchSessionUser()).toBeNull()
  })
})
