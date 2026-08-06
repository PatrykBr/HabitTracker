import { useOnline } from '../lib/hooks'

/**
 * Clear offline state. Writes are disabled while offline (v1 keeps it simple
 * — no offline write queue), so tell the user what's going on.
 */
export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="glass anim-rise-in sticky top-0 z-40 mx-4 mt-2 rounded-2xl px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[var(--text-2)] safe-top">
      You’re offline — your streaks keep counting. Logging is paused until
      you’re back online.
    </div>
  )
}
