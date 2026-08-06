import { useState } from 'react'
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
  color: string
  onDeleteReset: (reset: ResetEntry) => void
}

/**
 * The habit's story as a vertical timeline: the live current streak at the
 * top, every reset in between, the start date at the bottom. Reads as a
 * journey rather than a bare list — even with zero or one reset.
 */
export default function JourneyTimeline({
  startDate,
  resets,
  brokenMs,
  currentStreakMs,
  color,
  onDeleteReset,
}: JourneyTimelineProps) {
  const [shownCount, setShownCount] = useState(INITIAL_SHOWN)
  const shown = resets.slice(0, shownCount)
  const hidden = resets.length - shown.length

  return (
    <ol className="relative m-0 list-none p-0">
      <span
        aria-hidden
        className="absolute top-2 bottom-2 left-[6px] w-px"
        style={{ background: 'var(--card-border)' }}
      />

      {/* Now — the live streak */}
      <li className="relative flex items-start gap-3.5 pb-5">
        <span className="relative mt-1 flex h-[13px] w-[13px] shrink-0">
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-40"
            style={{ background: color }}
          />
          <span
            className="relative h-[13px] w-[13px] rounded-full"
            style={{ background: color, boxShadow: `0 0 10px ${color}77` }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="tabular text-[0.9375rem] font-bold" style={{ color }}>
            {formatDurationShort(currentStreakMs)} clean
          </div>
          <div className="text-[0.75rem] text-[var(--text-3)]">
            your streak right now — still going
          </div>
        </div>
      </li>

      {shown.map((reset) => (
        <li key={reset.id} className="relative flex items-start gap-3.5 pb-5">
          <span
            className="mt-1 h-[13px] w-[13px] shrink-0 rounded-full border-2 bg-[var(--card)]"
            style={{ borderColor: `${color}88` }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[0.875rem] font-semibold">
              Streak restarted
            </div>
            <div className="text-[0.75rem] text-[var(--text-3)]">
              {formatDateTime(new Date(reset.timestamp))} · after{' '}
              {formatDurationShort(brokenMs.get(reset.id) ?? 0)} clean
            </div>
            {reset.trigger ? (
              <span
                className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold"
                style={{ background: `${color}1c`, color }}
              >
                {reset.trigger}
              </span>
            ) : null}
            {reset.note ? (
              <p className="mt-1.5 mb-0 text-[0.8125rem] leading-snug text-[var(--text-2)]">
                “{reset.note}”
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Remove this reset"
            onClick={() => onDeleteReset(reset)}
            className="press rounded-full px-2 py-0.5 text-[var(--text-3)]"
          >
            ×
          </button>
        </li>
      ))}

      {hidden > 0 || shownCount > INITIAL_SHOWN ? (
        <li className="relative flex items-center gap-3.5 pb-5">
          <span
            aria-hidden
            className="flex w-[13px] shrink-0 justify-center text-[var(--text-3)]"
          >
            ⋮
          </span>
          <span className="flex flex-wrap gap-2">
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setShownCount((c) => c + SHOW_MORE_STEP)}
                className="press rounded-full bg-[var(--field-bg)] px-3.5 py-1.5 text-[0.75rem] font-semibold text-[var(--text-2)]"
              >
                Show {Math.min(SHOW_MORE_STEP, hidden)} more · {hidden} earlier
              </button>
            ) : null}
            {shownCount > INITIAL_SHOWN ? (
              <button
                type="button"
                onClick={() => setShownCount(INITIAL_SHOWN)}
                className="press rounded-full bg-[var(--field-bg)] px-3.5 py-1.5 text-[0.75rem] font-semibold text-[var(--text-3)]"
              >
                Show fewer
              </button>
            ) : null}
          </span>
        </li>
      ) : null}

      {/* The day it all began */}
      <li className="relative flex items-start gap-3.5">
        <span className="mt-1 h-[13px] w-[13px] shrink-0 rounded-full border-2 border-[var(--text-3)] bg-[var(--card)]" />
        <div className="min-w-0 flex-1">
          <div className="text-[0.875rem] font-semibold">Started the quit</div>
          <div className="text-[0.75rem] text-[var(--text-3)]">
            {formatDate(startDate)}
            {resets.length === 0 ? ' — clean ever since' : ''}
          </div>
        </div>
      </li>
    </ol>
  )
}
