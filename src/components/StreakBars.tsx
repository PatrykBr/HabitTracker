import { labelColor, tint } from '../lib/color'
import { formatDurationShort } from '../lib/format'

interface StreakBarsProps {
  currentMs: number
  longestMs: number
  averageMs: number
  totalResets: number
  /** Resolved CSS color (see `habitColor`). */
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
      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="t-footnote w-14 shrink-0 text-(--text-2)">
              {row.label}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-(--fill-4)">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.max(2, (row.ms / max) * 100)}%`,
                  background: row.main ? color : tint(color, 35),
                  transition: 'width 0.6s var(--spring)',
                }}
              />
            </div>
            <span className="tabular t-subhead w-16 shrink-0 text-right font-semibold">
              {formatDurationShort(row.ms)}
            </span>
          </div>
        ))}
      </div>

      <p className="t-footnote mt-3 mb-0 text-(--text-2)">
        {totalResets === 0 ? (
          <>No resets yet — this run is the whole story so far.</>
        ) : atRecord ? (
          <>
            This is your{' '}
            <span className="font-semibold" style={{ color: labelColor(color) }}>
              longest run ever
            </span>
            . Every second extends the record.
          </>
        ) : (
          <>
            You’re{' '}
            <span className="font-semibold" style={{ color: labelColor(color) }}>
              {pct}%
            </span>{' '}
            of the way to your record — you’ve done it before.
          </>
        )}
      </p>
    </div>
  )
}
