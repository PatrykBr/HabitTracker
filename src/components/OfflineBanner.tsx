import { useOnline } from '../lib/hooks'

/**
 * Show offline status. Writes remain disabled until the browser reconnects.
 */
export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-6"
      style={{ top: 'calc(env(safe-area-inset-top) + 3.75rem)' }}
    >
      <div className="glass anim-rise-in t-footnote pointer-events-auto max-w-sm rounded-full px-4 py-2 text-center font-medium text-(--text-2)">
        You're offline. Streaks keep counting. Reconnect to log a reset.
      </div>
    </div>
  )
}
