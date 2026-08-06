import { formatDurationShort } from '../lib/format'

interface StreakBarsProps {
  currentMs: number
  longestMs: number
  averageMs: number
  totalResets: number
  color: string
}

/**
 * Glanceable comparison of current vs longest vs average streak as
 * horizontal bars on a shared scale. The current streak bar ticks live.
 */
export default function StreakBars({
  currentMs,
  longestMs,
  averageMs,
  totalResets,
  color,
}: StreakBarsProps) {
  const max = Math.max(currentMs, longestMs, averageMs, 1)
  const rows = [
    { label: 'Current', ms: currentMs, main: true },
    { label: 'Longest', ms: longestMs, main: false },
    { label: 'Average', ms: averageMs, main: false },
  ]

  const atRecord = currentMs >= longestMs
  const pct = Math.min(100, Math.round((currentMs / Math.max(longestMs, 1)) * 100))

  return (
    <div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <span className="w-14 shrink-0 text-[0.6875rem] font-semibold tracking-wide text-[var(--text-3)] uppercase">
              {row.label}
            </span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-[var(--field-bg)]">
              <div
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{
                  width: `${Math.max(2, (row.ms / max) * 100)}%`,
                  background: row.main ? color : `${color}44`,
                  transition: 'width 0.6s cubic-bezier(0.22, 1.2, 0.36, 1)',
                }}
              />
            </div>
            <span className="tabular w-16 shrink-0 text-right text-[0.8125rem] font-bold">
              {formatDurationShort(row.ms)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 mb-0 text-[0.8125rem] text-[var(--text-2)]">
        {totalResets === 0 ? (
          <>No resets yet — this run is the whole story so far.</>
        ) : atRecord ? (
          <>
            This is your{' '}
            <span className="font-semibold" style={{ color }}>
              longest run ever
            </span>
            . Every second extends the record.
          </>
        ) : (
          <>
            You're{' '}
            <span className="font-semibold" style={{ color }}>
              {pct}%
            </span>{' '}
            of the way to your record — you've done it before.
          </>
        )}
      </p>
    </div>
  )
}
