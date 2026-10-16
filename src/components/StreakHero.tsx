import { dominantUnit, formatClock, formatDateTime } from '../lib/format'
import { labelColor, tint } from '../lib/color'
import { nextMilestone } from '../lib/streaks'

interface StreakHeroProps {
  sinceMs: number
  since: Date
  hadResets: boolean
  /** Resolved CSS color (see `habitColor`). */
  color: string
}

/**
 * The hero: a huge, live-updating streak counter in SF Rounded. Days
 * dominate once the streak is a day old; before that, hours or minutes lead.
 */
export default function StreakHero({
  sinceMs,
  since,
  hadResets,
  color,
}: StreakHeroProps) {
  const { value, unit } = dominantUnit(sinceMs)
  const next = nextMilestone(sinceMs)
  const progress = next ? Math.min(1, Math.max(0, sinceMs / next.ms)) : 1
  const circumference = 2 * Math.PI * 112

  return (
    <div
      className="flex flex-col items-center pt-2 pb-6 text-center"
      style={{ ['--tint' as string]: color, ['--label-tint' as string]: labelColor(color) }}
    >
      <div className="streak-orbit">
        <svg viewBox="0 0 256 256" aria-hidden>
          <circle cx="128" cy="128" r="112" fill="none" strokeWidth="5" style={{ stroke: tint(color, 13) }} />
          <circle
            cx="128" cy="128" r="112" fill="none" strokeWidth="5" strokeLinecap="round"
            transform="rotate(-90 128 128)"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ stroke: color }}
          />
        </svg>
        <div className="relative grid justify-items-center gap-1">
          <div className="streak-value tabular">{value}</div>
          <div className="t-title3 text-[var(--text-2)]">{unit} clean</div>
        </div>
      </div>
      <div className="streak-goal">
        {next ? `${Math.floor(progress * 100)}% to ${next.label}` : 'One year and counting'}
      </div>
      <div className="tabular mt-4 font-mono text-[0.9375rem] text-[var(--text-2)]">
        {formatClock(sinceMs)}
      </div>
      <div className="t-footnote mt-1 text-[var(--text-2)]">
        {hadResets ? 'Since your last reset' : 'Tracking since'}
        <br />
        {formatDateTime(since)}
      </div>
    </div>
  )
}
