import { durationParts, formatClock, formatDateTime } from '../lib/format'

interface StreakHeroProps {
  sinceMs: number
  since: Date
  hadResets: boolean
  color: string
}

/**
 * The hero: a huge, live-updating streak counter. Days dominate once the
 * streak is a day old; before that, hours or minutes take the lead.
 */
export default function StreakHero({
  sinceMs,
  since,
  hadResets,
  color,
}: StreakHeroProps) {
  const p = durationParts(sinceMs)

  let big: string
  let unit: string
  if (p.days >= 1) {
    big = String(p.days)
    unit = p.days === 1 ? 'day' : 'days'
  } else if (p.hours >= 1) {
    big = String(p.hours)
    unit = p.hours === 1 ? 'hour' : 'hours'
  } else {
    big = String(Math.max(0, p.minutes))
    unit = p.minutes === 1 ? 'minute' : 'minutes'
  }

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div
        className="tabular text-[6.5rem] leading-none font-extrabold tracking-tighter"
        style={{ color, textShadow: `0 0 60px ${color}44` }}
      >
        {big}
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight text-[var(--text)]">
        {unit}
      </div>
      <div className="tabular mt-2 font-mono text-sm text-[var(--text-2)]">
        {formatClock(sinceMs)}
      </div>
      <div className="mt-1 text-[0.8125rem] text-[var(--text-3)]">
        {hadResets ? 'since your last reset' : 'clean since the start'} ·{' '}
        {formatDateTime(since)}
      </div>
    </div>
  )
}
