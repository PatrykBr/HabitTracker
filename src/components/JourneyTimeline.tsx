import { memo, useState } from 'react'
import { IconXmark } from './Icons'
import { labelColor, tint } from '../lib/color'
import { formatDate, formatDateTime, formatDurationShort } from '../lib/format'
import type { ResetEntry } from '../lib/types'

/** Recent resets shown before the timeline collapses behind "Show more". */
const INITIAL_SHOWN = 7
const SHOW_MORE_STEP = 30

interface JourneyTimelineProps {
  startDate: Date
  /** Reverse-chronological (newest first). */
  resets: ResetEntry[]
  /** Streak length each reset ended, keyed by reset id. */
  brokenMs: Map<string, number>
  currentStreakMs: number
  /** Resolved CSS color (see `habitColor`). */
  color: string
  onDeleteReset: (reset: ResetEntry) => void
}

/**
 * Show the current streak, recent resets, and tracking start date.
 */
export default function JourneyTimeline({
  startDate,
  resets,
  brokenMs,
  currentStreakMs,
  color,
  onDeleteReset,
}: JourneyTimelineProps) {
  return (
    <ol className="relative m-0 list-none p-0 before:absolute before:inset-y-2 before:left-1.5 before:w-px before:bg-(--separator) before:content-['']">
      {/* Current streak */}
      <li className="relative flex items-start gap-3.5 pb-5">
        <span className="relative mt-1 flex h-3.25 w-3.25 shrink-0">
          <span
            className="relative h-3.25 w-3.25 rounded-full"
            style={{ background: color }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="tabular t-headline" style={{ color: labelColor(color) }}>
            {formatDurationShort(currentStreakMs)}
          </div>
          <div className="t-footnote text-(--text-2)">
            Current streak
          </div>
        </div>
      </li>

      <JourneyHistory
        startDate={startDate}
        resets={resets}
        brokenMs={brokenMs}
        color={color}
        onDeleteReset={onDeleteReset}
      />
    </ol>
  )
}

// Expanding the history must not add work to each tick of the live counter.
const JourneyHistory = memo(function JourneyHistory({
  startDate,
  resets,
  brokenMs,
  color,
  onDeleteReset,
}: Omit<JourneyTimelineProps, 'currentStreakMs'>) {
  const [shownCount, setShownCount] = useState(INITIAL_SHOWN)
  const shown = resets.slice(0, shownCount)
  const hidden = resets.length - shown.length

  return (
    <>
      {shown.map((reset) => (
        <li key={reset.id} className="relative flex items-start gap-3.5 pb-5">
          <span
            className="mt-1 h-3.25 w-3.25 shrink-0 rounded-full border-2 bg-(--bg-2)"
            style={{ borderColor: tint(color, 60) }}
          />
          <div className="min-w-0 flex-1">
            <div className="t-subhead font-semibold">Streak restarted</div>
            <div className="t-footnote text-(--text-2)">
              {formatDateTime(new Date(reset.timestamp))} · after{' '}
              {formatDurationShort(brokenMs.get(reset.id) ?? 0)}
            </div>
            {reset.trigger ? (
              <span
                className="t-caption1 mt-1.5 inline-block rounded-full px-2.5 py-0.5 font-semibold"
                style={{ background: tint(color, 15), color: labelColor(color) }}
              >
                {reset.trigger}
              </span>
            ) : null}
            {reset.note ? (
              <p className="t-footnote mt-1.5 mb-0 text-(--text-2)">
                {reset.note}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Remove this reset"
            onClick={() => onDeleteReset(reset)}
            className="-mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-(--text-3) transition-transform active:scale-90"
          >
            <IconXmark className="h-4 w-4" />
          </button>
        </li>
      ))}

      {hidden > 0 || shownCount > INITIAL_SHOWN ? (
        <li className="relative flex items-center gap-3.5 pb-5">
          <span
            aria-hidden
            className="flex w-3.25 shrink-0 justify-center text-(--text-3)"
          >
            ⋮
          </span>
          <span className="flex flex-wrap gap-2">
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setShownCount((c) => c + SHOW_MORE_STEP)}
                className="chip t-footnote"
              >
                Show {Math.min(SHOW_MORE_STEP, hidden)} more · {hidden} earlier
              </button>
            ) : null}
            {shownCount > INITIAL_SHOWN ? (
              <button
                type="button"
                onClick={() => setShownCount(INITIAL_SHOWN)}
                className="chip t-footnote text-(--text-2)"
              >
                Show fewer
              </button>
            ) : null}
          </span>
        </li>
      ) : null}

      {/* Tracking start */}
      <li className="relative flex items-start gap-3.5">
        <span className="mt-1 h-3.25 w-3.25 shrink-0 rounded-full border-2 border-(--text-3) bg-(--bg-2)" />
        <div className="min-w-0 flex-1">
          <div className="t-subhead font-semibold">Started tracking</div>
          <div className="t-footnote text-(--text-2)">
            {formatDate(startDate)}
            {resets.length === 0 ? ' · no resets logged' : ''}
          </div>
        </div>
      </li>
    </>
  )
})
