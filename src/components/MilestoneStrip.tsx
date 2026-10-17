import { labelColor, onColor, tint } from '../lib/color'
import { MILESTONES, nextMilestone } from '../lib/streaks'
import { formatDurationHuman } from '../lib/format'
import { IconCheck } from './Icons'

interface MilestoneStripProps {
  streakMs: number
  /** Resolved CSS color (see `habitColor`). */
  color: string
}

/** Show milestones from 24 hours to 1 year. */
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
              <span className="t-caption1 text-(--text-2)">
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="t-footnote mt-3 mb-0 text-(--text-2)">
        {next ? (
          <>
            Next milestone: <span className="font-semibold text-(--text)">{next.label}</span>{' '}
            in about {formatDurationHuman(next.ms - streakMs)}.
          </>
        ) : (
          <>All milestones reached.</>
        )}
      </p>
    </div>
  )
}
