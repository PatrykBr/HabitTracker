import { labelColor, onColor, tint } from '../lib/color'
import { MILESTONES, nextMilestone } from '../lib/streaks'
import { formatDurationHuman } from '../lib/format'
import { IconCheck } from './Icons'

interface MilestoneStripProps {
  streakMs: number
  /** Resolved CSS color (see `habitColor`). */
  color: string
}

/** Horizontal strip of milestone chips: 24h → 1 year. */
export default function MilestoneStrip({ streakMs, color }: MilestoneStripProps) {
  const next = nextMilestone(streakMs)
  return (
    <div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto py-2">
        {MILESTONES.map((m) => {
          const achieved = streakMs >= m.ms
          return (
            <div
              key={m.short}
              className="milestone-token"
              role="img"
              aria-label={`${m.label}${achieved ? ', reached' : ''}`}
            >
              <span
                className="milestone-mark tabular"
                style={{
                  background: achieved ? color : tint(color, 7),
                  color: achieved ? onColor(color) : labelColor(color),
                  boxShadow: achieved ? undefined : `inset 0 0 0 1px ${tint(color, 15)}`,
                }}
              >
                {achieved ? <IconCheck className="h-5 w-5" /> : m.short}
              </span>
              <span className="t-caption1 text-[var(--text-2)]">
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="t-footnote mt-3 mb-0 text-[var(--text-2)]">
        {next ? (
          <>
            Next up: <span className="font-semibold text-[var(--text)]">{next.label}</span>{' '}
            — about {formatDurationHuman(next.ms - streakMs)} away.
          </>
        ) : (
          <>Every milestone, reached. Extraordinary.</>
        )}
      </p>
    </div>
  )
}
