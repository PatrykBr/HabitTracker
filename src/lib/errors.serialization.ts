import { createSerializationAdapter } from '@tanstack/react-router'
import { UserFacingError } from './errors'

/** Preserve expected copy; keep driver/configuration details on the server. */
export const errorAdapter = createSerializationAdapter({
  key: 'reset/Error',
  test: (value): value is Error => value instanceof Error,
  toSerializable: (error) => {
    const userFacing = error instanceof UserFacingError
    if (!userFacing && typeof window === 'undefined')
      console.error('[server]', error)
    return {
      userFacing,
      message: userFacing
        ? error.message
        : 'We couldn\'t complete that request. Try again.',
    }
  },
  fromSerializable: ({
    message,
    userFacing,
  }: {
    message: string
    userFacing: boolean
  }) => (userFacing ? new UserFacingError(message) : new Error(message)),
})
