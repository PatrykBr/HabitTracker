/**
 * Errors whose message is written for the user and safe to show verbatim.
 *
 * Server functions throw these for expected validation and lookup errors.
 * The client shows fallback copy for unexpected errors so driver messages,
 * validation internals, and network details remain private.
 *
 * A dedicated serialization adapter in start.ts preserves these across RPCs;
 * the router's default Error adapter only keeps the message. The marker/name
 * checks also recognize plain error objects after other serialization steps.
 */
export class UserFacingError extends Error {
  readonly userFacing = true

  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}

export function isUserFacingError(err: unknown): err is { message: string } {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { userFacing?: unknown; name?: unknown; message?: unknown }
  if (typeof e.message !== 'string') return false
  return e.userFacing === true || e.name === 'UserFacingError'
}

/** The message to show for a caught error: the user-facing one, or the fallback. */
export function userMessage(err: unknown, fallback: string): string {
  return isUserFacingError(err) && err.message ? err.message : fallback
}
