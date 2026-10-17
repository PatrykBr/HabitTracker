import { tint } from '../lib/color'
import { HOUR_MS } from '../lib/streaks'
import type { Segment } from '../lib/streaks'
import { formatDate, formatDurationShort } from '../lib/format'

interface TrendChartProps {
  completed: Segment[]
  ongoing: Segment
  /** Resolved CSS color (see `habitColor`). */
  color: string
}

/**
 * Simple bar chart of streak lengths over time (oldest → newest). The current,
 * ongoing streak is the highlighted last bar.
 */
export default function TrendChart({
  completed,
  ongoing,
  color,
}: TrendChartProps) {
  if (completed.length === 0) {
    return (
      <p className="t-footnote m-0 py-2 text-center text-(--text-2)">
        Once you’ve logged a reset, your streak lengths will chart here so you
        can watch them grow.
      </p>
    )
  }

  const shown = [...completed.slice(-23), ongoing]
  const total = completed.length + 1
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
              // CSS color functions must go through `style` to work in SVG.
              style={{ fill: s.ongoing ? color : tint(color, 35) }}
            />
          )
        })}
      </svg>
      <div className="t-caption1 mt-2 flex justify-between text-(--text-2)">
        <span>{formatDate(shown[0].start)}</span>
        <span>
          Longest {formatDurationShort(Math.max(...shown.map((s) => s.ms)))}
        </span>
        <span>Now</span>
      </div>
      {total > shown.length ? (
        <p className="t-caption1 mt-1 mb-0 text-(--text-3)">
          Showing the most recent {shown.length} streaks (of {total}).
        </p>
      ) : null}
    </div>
  )
}
