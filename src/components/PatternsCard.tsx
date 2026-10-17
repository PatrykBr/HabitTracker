import { memo } from 'react'
import { labelColor, tint } from '../lib/color'
import { dayOfWeekCounts, timeOfDayCounts } from '../lib/streaks'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
]

interface PatternsCardProps {
  resetDates: Date[]
  /** Resolved CSS color (see `habitColor`). */
  color: string
}

/**
 * Count resets by local weekday and time of day.
 */
export default memo(function PatternsCard({
  resetDates,
  color,
}: PatternsCardProps) {
  if (resetDates.length === 0) {
    return (
      <p className="t-footnote m-0 py-2 text-center text-(--text-2)">
        No resets logged yet. Patterns will appear here after you log a reset.
      </p>
    )
  }

  const dow = dayOfWeekCounts(resetDates)
  const tod = timeOfDayCounts(resetDates)
  const maxDow = Math.max(...dow, 1)
  const peakDays = DAY_NAMES.filter((_, index) => dow[index] === maxDow)
  const maxTod = Math.max(...tod.map((bucket) => bucket.count))
  const peakTimes = tod.filter((bucket) => bucket.count === maxTod)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div
          className="flex items-end justify-between gap-1.5"
          style={{ height: 72 }}
        >
          {dow.map((count, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center justify-end self-stretch"
            >
              <div
                className="w-full rounded-md"
                style={{
                  height: `${Math.max(6, (count / maxDow) * 100)}%`,
                  background:
                    count === 0
                      ? 'var(--fill-4)'
                      : count === maxDow
                        ? color
                        : tint(color, 40),
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between gap-1.5">
          {DAY_LABELS.map((label) => (
            <span
              key={label}
              className="t-caption1 flex-1 text-center font-medium text-(--text-2)"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tod.map((bucket) => {
          const isPeak = bucket.count === maxTod
          return (
            <div
              key={bucket.label}
              className="flex flex-col items-center gap-0.5 rounded-(--r-inner) py-2"
              style={{
                background: isPeak ? tint(color, 18) : 'var(--fill-4)',
                color: isPeak ? labelColor(color) : 'var(--text)',
              }}
            >
              <span className="text-base">{bucket.emoji}</span>
              <span className="tabular t-subhead font-semibold">
                {bucket.count}
              </span>
              <span className="t-caption2 text-(--text-2)">
                {bucket.label}
              </span>
            </div>
          )
        })}
      </div>

      <p className="t-footnote m-0 text-(--text-2)">
        Most frequent days: {peakDays.join(', ')}. Most frequent times:{' '}
        {peakTimes.map((bucket) => bucket.label.toLowerCase()).join(', ')}.{' '}
        Knowing your pattern can help you plan ahead.
      </p>
    </div>
  )
})
