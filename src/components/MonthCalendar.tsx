import { memo, useRef, useState } from 'react'
import { formatMonthYear } from '../lib/format'
import { localDayKey } from '../lib/streaks'
import type { ResetEntry } from '../lib/types'

interface MonthCalendarProps {
  startDate: Date
  resets: ResetEntry[]
  color: string
  onSelectDay: (dayLabel: string, entries: ResetEntry[]) => void
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
  const todayKey = localDayKey(today)

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
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="press rounded-full bg-[var(--field-bg)] px-3 py-1.5 text-sm font-semibold disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-[0.9375rem] font-bold tracking-tight">
          {formatMonthYear(monthStart)}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="press rounded-full bg-[var(--field-bg)] px-3 py-1.5 text-sm font-semibold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LETTERS.map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="text-center text-[0.625rem] font-semibold text-[var(--text-3)]"
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
            'tabular flex aspect-square items-center justify-center rounded-xl text-[0.8125rem] font-semibold'

          if (isFuture || beforeStart) {
            return (
              <span key={key} className={`${base} text-[var(--text-3)] opacity-35`}>
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
                className={`${base} press relative text-white`}
                style={{
                  background: color,
                  boxShadow: isToday ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}` : undefined,
                }}
                aria-label={`${dayResets.length} reset${dayResets.length > 1 ? 's' : ''} on day ${dayNum}`}
              >
                {dayNum}
                {dayResets.length > 1 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--card)] px-0.5 text-[0.5625rem] font-bold text-[var(--text)]">
                    {dayResets.length}
                  </span>
                ) : null}
              </button>
            )
          }
          return (
            <span
              key={key}
              className={`${base} text-[var(--text-2)]`}
              style={{
                background: `${color}14`,
                boxShadow: isToday ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}` : undefined,
              }}
            >
              {dayNum}
            </span>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[0.6875rem] text-[var(--text-3)]">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: `${color}14` }} />
          clean day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: color }} />
          reset day
        </span>
      </div>
    </div>
  )
})
