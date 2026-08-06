import { MILESTONES, nextMilestone } from '../lib/streaks'
import { formatDurationHuman } from '../lib/format'

interface MilestoneStripProps {
  streakMs: number
  color: string
}

/** Horizontal strip of milestone chips: 24h → 1 year. */
export default function MilestoneStrip({ streakMs, color }: MilestoneStripProps) {
  const next = nextMilestone(streakMs)
  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {MILESTONES.map((m) => {
          const achieved = streakMs >= m.ms
          return (
            <div
              key={m.short}
              className="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3.5 py-2.5"
              style={{
                background: achieved ? `${color}22` : 'var(--field-bg)',
                border: `1px solid ${achieved ? `${color}55` : 'transparent'}`,
              }}
            >
              <span
                className="text-sm font-bold tabular"
                style={{ color: achieved ? color : 'var(--text-3)' }}
              >
                {achieved ? '✓' : ''} {m.short}
              </span>
              <span className="text-[0.625rem] font-medium text-[var(--text-3)]">
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
      {next ? (
        <p className="mt-2 text-[0.8125rem] text-[var(--text-2)]">
          Next up: <span className="font-semibold">{next.label}</span> — about{' '}
          {formatDurationHuman(next.ms - streakMs)} away. Keep going.
        </p>
      ) : (
        <p className="mt-2 text-[0.8125rem] text-[var(--text-2)]">
          Every milestone, reached. Extraordinary.
        </p>
      )}
    </div>
  )
}
