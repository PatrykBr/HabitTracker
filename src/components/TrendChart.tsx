import { HOUR_MS } from '../lib/streaks'
import type { Segment } from '../lib/streaks'
import { formatDate, formatDurationShort } from '../lib/format'

interface TrendChartProps {
  segments: Segment[]
  color: string
}

/**
 * Simple bar chart of streak lengths over time (oldest → newest). The current,
 * ongoing streak is the highlighted last bar.
 */
export default function TrendChart({ segments, color }: TrendChartProps) {
  if (segments.length < 2) {
    return (
      <p className="py-4 text-center text-[0.8125rem] text-[var(--text-3)]">
        Once you’ve logged a reset, your streak lengths will chart here so you
        can watch them grow.
      </p>
    )
  }

  const shown = segments.slice(-24)
  const max = Math.max(...shown.map((s) => s.ms), HOUR_MS)
  const W = 320
  const H = 120
  const gap = 4
  const barW = (W - gap * (shown.length - 1)) / shown.length

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Streak lengths over time"
      >
        {shown.map((s, i) => {
          const h = Math.max(4, (s.ms / max) * (H - 8))
          const x = i * (barW + gap)
          return (
            <rect
              key={i}
              x={x}
              y={H - h}
              width={barW}
              height={h}
              rx={Math.min(5, barW / 2)}
              fill={s.ongoing ? color : `${color}55`}
            />
          )
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[0.6875rem] text-[var(--text-3)]">
        <span>{formatDate(shown[0].start)}</span>
        <span>
          longest {formatDurationShort(Math.max(...shown.map((s) => s.ms)))}
        </span>
        <span>now</span>
      </div>
      {segments.length > shown.length ? (
        <p className="mt-1 text-[0.6875rem] text-[var(--text-3)]">
          Showing the most recent {shown.length} streaks (of {segments.length}
          ). Days are measured in your local timezone.
        </p>
      ) : null}
    </div>
  )
}
