import { useCallback, useEffect, useRef, useState } from 'react'
import { userMessage } from './errors'

export interface AsyncAction<Args extends unknown[]> {
  /** Runs the action; resolves true on success, false if it threw. */
  run: (...args: Args) => Promise<boolean>
  busy: boolean
  /** User-facing message from the last failed run, until cleared or re-run. */
  error: string | null
  clearError: () => void
}

/**
 * Busy/error state for one user-triggered request (submit, delete, sign out).
 * Only `UserFacingError` messages are shown verbatim; anything else - network
 * failures, driver errors - gets `fallbackMessage`.
 */
export function useAsyncAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<unknown>,
  fallbackMessage: string,
): AsyncAction<Args> {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const run = async (...args: Args): Promise<boolean> => {
    // State updates aren't synchronous: two submits in one tick can both run.
    if (inFlight.current) return false
    inFlight.current = true
    setBusy(true)
    setError(null)
    try {
      await action(...args)
      return true
    } catch (err) {
      setError(userMessage(err, fallbackMessage))
      return false
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  // Stable so components can list it as an effect dependency.
  const clearError = useCallback(() => setError(null), [])

  return { run, busy, error, clearError }
}

/** A Date that ticks on an interval — powers all live streak counters. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/** Tracks navigator.onLine so we can show a clear offline state. */
export function useOnline(): boolean {
  // SSR and the first browser render must agree. Node also exposes navigator,
  // but has no onLine property; read the actual connection after mounting.
  const [online, setOnline] = useState(true)
  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}

/** Light haptic tap where the platform supports it. */
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // not supported — fine
    }
  }
}
