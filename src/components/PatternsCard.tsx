import { memo } from 'react'
import { dayOfWeekCounts, timeOfDayCounts } from '../lib/streaks'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface PatternsCardProps {
  resetDates: Date[]
  color: string
}

/**
 * When do resets happen? Day-of-week and time-of-day histograms (in the
 * user's local timezone) — genuinely useful for spotting triggers.
 */
export default memo(function PatternsCard({ resetDates, color }: PatternsCardProps) {
  if (resetDates.length === 0) {
    return (
      <p className="py-2 text-center text-[0.8125rem] text-[var(--text-3)]">
        No resets logged — no patterns to spot yet. That’s a good thing.
      </p>
    )
  }

  const dow = dayOfWeekCounts(resetDates)
  const tod = timeOfDayCounts(resetDates)
  const maxDow = Math.max(...dow, 1)
  const peakDay = DAY_LABELS[dow.indexOf(Math.max(...dow))]
  const peakBucket = tod.reduce((a, b) => (b.count > a.count ? b : a))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-end justify-between gap-1.5" style={{ height: 72 }}>
          {dow.map((count, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
              <div
                className="w-full rounded-md"
                style={{
                  height: `${Math.max(6, (count / maxDow) * 100)}%`,
                  background: count > 0 ? `${color}${count === Math.max(...dow) ? 'ff' : '66'}` : 'var(--field-bg)',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between gap-1.5">
          {DAY_LABELS.map((label) => (
            <span key={label} className="flex-1 text-center text-[0.625rem] font-medium text-[var(--text-3)]">
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tod.map((bucket) => {
          const isPeak = bucket.count > 0 && bucket.label === peakBucket.label
          return (
            <div
              key={bucket.label}
              className="flex flex-col items-center gap-0.5 rounded-xl py-2"
              style={{
                background: isPeak ? `${color}22` : 'var(--field-bg)',
                border: `1px solid ${isPeak ? `${color}55` : 'transparent'}`,
              }}
            >
              <span className="text-base">{bucket.emoji}</span>
              <span className="tabular text-sm font-bold">{bucket.count}</span>
              <span className="text-[0.625rem] text-[var(--text-3)]">{bucket.label}</span>
            </div>
          )
        })}
      </div>

      <p className="text-[0.8125rem] text-[var(--text-2)]">
        Most of your resets land on{' '}
        <span className="font-semibold text-[var(--text)]">{peakDay}s</span>
        {peakBucket.count > 0 ? (
          <>
            , usually in the{' '}
            <span className="font-semibold text-[var(--text)]">
              {peakBucket.label.toLowerCase()}
            </span>
          </>
        ) : null}
        . Knowing your pattern is half the battle.
      </p>
    </div>
  )
})
