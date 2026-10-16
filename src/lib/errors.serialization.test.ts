import { describe, expect, it, spyOn } from 'bun:test'
import { defaultSerovalPlugins, makeSerovalPlugin } from '@tanstack/router-core/ssr/client'
import { fromCrossJSON, toCrossJSONAsync } from 'seroval'
import { startInstance } from '../start'
import { UserFacingError, userMessage } from './errors'

describe('configured RPC error serialization', () => {
  it('preserves expected messages without exposing unexpected errors as user-facing', async () => {
    const options = await startInstance.getOptions()
    if (!options.serializationAdapters)
      throw new Error('Missing RPC serialization adapters')
    const plugins = [
      ...options.serializationAdapters.map(makeSerovalPlugin),
      ...defaultSerovalPlugins,
    ]
    const log = spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const [error, expected] of [
        [
          new UserFacingError('The start date can’t be in the future.'),
          'The start date can’t be in the future.',
        ],
        [new Error('database-internals'), 'Try again.'],
      ] as const) {
        const encoded = await toCrossJSONAsync(
          { error },
          { plugins, refs: new Map() },
        )
        const decoded = fromCrossJSON(encoded, {
          plugins,
          refs: new Map(),
        }) as {
          error: unknown
        }
        expect(userMessage(decoded.error, 'Try again.')).toBe(expected)
        expect(JSON.stringify(encoded)).not.toContain('stack')
        expect(JSON.stringify(encoded)).not.toContain('database-internals')
      }
      expect(log).toHaveBeenCalledTimes(1)
    } finally {
      log.mockRestore()
    }
  })
})
