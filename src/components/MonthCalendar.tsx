import { memo, useRef, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from './Icons'
import { onColor, tint } from '../lib/color'
import { formatMonthYear } from '../lib/format'
import { localDayKey } from '../lib/streaks'
import type { ResetEntry } from '../lib/types'

interface MonthCalendarProps {
  startDate: Date
  resets: ResetEntry[]
  /** Resolved CSS color (see `habitColor`). */
  color: string
  onSelectDay: (dayLabel: string, entries: ResetEntry[]) => void
  /** Changes at local midnight without rerendering on every counter tick. */
  todayKey: string
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Month grid in the user's local timezone. Clean days get a soft tint of the
 * habit color; reset days are solid. Tap a reset day for its details, swipe
 * or use the chevrons to move between months.
 *
 * Memoized: the parent re-renders every second for the live streak counter,
 * and regrouping hundreds of resets per tick is wasted work.
 */
export default memo(function MonthCalendar({
  startDate,
  resets,
  color,
  onSelectDay,
  todayKey,
}: MonthCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const touchStartX = useRef<number | null>(null)

  const resetsByDay = new Map<string, ResetEntry[]>()
  for (const r of resets) {
    const key = localDayKey(new Date(r.timestamp))
    const list = resetsByDay.get(key)
    if (list) list.push(r)
    else resetsByDay.set(key, [r])
  }

  const monthStart = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const leadingBlanks = monthStart.getDay()
  const startKey = localDayKey(startDate)
  const glyph = onColor(color)
  const todayRing = `0 0 0 2px var(--bg-2), 0 0 0 4px ${color}`

  const canGoBack =
    viewYear > startDate.getFullYear() ||
    (viewYear === startDate.getFullYear() && viewMonth > startDate.getMonth())
  const canGoForward =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth())

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const navClass =
    'flex h-11 w-11 items-center justify-center rounded-full text-[var(--accent-text)] transition-opacity disabled:opacity-30'

  return (
    <div
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (dx > 48 && canGoBack) shiftMonth(-1)
        else if (dx < -48 && canGoForward) shiftMonth(1)
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="t-headline pl-1">{formatMonthYear(monthStart)}</span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={!canGoBack}
            aria-label="Previous month"
            className={navClass}
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={!canGoForward}
            aria-label="Next month"
            className={navClass}
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LETTERS.map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="t-caption1 text-center font-semibold text-[var(--text-3)]"
          >
            {letter}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const date = new Date(viewYear, viewMonth, dayNum)
          const key = localDayKey(date)
          const dayResets = resetsByDay.get(key) ?? []
          const isFuture = key > todayKey
          const beforeStart = key < startKey
          const isToday = key === todayKey
          const isResetDay = dayResets.length > 0

          const base =
            'tabular flex min-h-11 min-w-0 items-center justify-center text-[0.9375rem]'

          if (isFuture || beforeStart) {
            return (
              <span key={key} className={`${base} text-[var(--text-3)]`}>
                {dayNum}
              </span>
            )
          }
          if (isResetDay) {
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  onSelectDay(
                    date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    }),
                    dayResets,
                  )
                }
                className={`${base} relative font-semibold transition-transform active:scale-90`}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${dayResets.length} reset${dayResets.length > 1 ? 's' : ''} on ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
              >
                <span
                  className="relative flex aspect-square w-full max-w-9 items-center justify-center rounded-full"
                  style={{
                    background: color,
                    color: glyph,
                    boxShadow: isToday ? todayRing : undefined,
                  }}
                >
                  <span className="-translate-y-0.5">{dayNum}</span>
                  <span aria-hidden className="absolute bottom-0.5 text-[0.625rem] leading-none">
                    ↺
                  </span>
                  {dayResets.length > 1 ? (
                    <span className="t-caption2 absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--bg-2)] px-1 font-bold text-[var(--text)]">
                      {dayResets.length}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          }
          return (
            <span
              key={key}
              aria-current={isToday ? 'date' : undefined}
              className={`${base} text-[var(--text)]`}
              style={{ fontWeight: isToday ? 600 : 400 }}
            >
              <span
                className="flex aspect-square w-full max-w-9 items-center justify-center rounded-full"
                style={{
                  background: tint(color, 14),
                  boxShadow: isToday ? todayRing : undefined,
                }}
              >
                {dayNum}
              </span>
            </span>
          )
        })}
      </div>

      <div className="t-caption1 mt-3 flex items-center gap-4 text-[var(--text-2)]">
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: tint(color, 14) }}
          />
          Clean day
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem]"
            style={{ background: color, color: glyph }}
          >↺</span>
          Reset day
        </span>
      </div>
    </div>
  )
})
