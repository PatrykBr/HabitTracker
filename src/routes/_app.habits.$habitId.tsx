import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import Celebration from '../components/Celebration'
import ConfirmSheet from '../components/ConfirmSheet'
import JourneyTimeline from '../components/JourneyTimeline'
import MilestoneStrip from '../components/MilestoneStrip'
import MonthCalendar from '../components/MonthCalendar'
import PatternsCard from '../components/PatternsCard'
import ResetSheet from '../components/ResetSheet'
import Sheet from '../components/Sheet'
import StreakBars from '../components/StreakBars'
import StreakHero from '../components/StreakHero'
import TrendChart from '../components/TrendChart'
import { deleteHabit, deleteReset, getHabitDetail } from '../lib/habits.functions'
import { haptic, useNow, useOnline } from '../lib/hooks'
import { DAY_MS, currentStreakStart, milestoneCrossed } from '../lib/streaks'
import type { Segment } from '../lib/streaks'
import { formatDateTime, formatMoney, formatUnits } from '../lib/format'
import type { ResetEntry } from '../lib/types'

export const Route = createFileRoute('/_app/habits/$habitId')({
  loader: ({ params }) => getHabitDetail({ data: { habitId: params.habitId } }),
  pendingComponent: DetailPending,
  errorComponent: DetailError,
  notFoundComponent: DetailNotFound,
  component: HabitDetailPage,
})

function DetailPending() {
  return (
    <div className="pt-6">
      <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--field-bg)]" />
      <div className="mx-auto mt-10 h-40 w-56 animate-pulse rounded-3xl bg-[var(--field-bg)]" />
      <div className="card mt-10 h-28 animate-pulse opacity-60" />
    </div>
  )
}

function DetailNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 pt-24 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="text-lg font-bold">This habit isn’t here</h1>
      <p className="max-w-xs text-[0.875rem] text-[var(--text-2)]">
        It may have been removed. Your other habits are right where you left
        them.
      </p>
      <Link
        to="/"
        className="press mt-1 rounded-2xl bg-[var(--accent)] px-6 py-3 text-[0.9375rem] font-bold text-white no-underline"
      >
        Back to habits
      </Link>
    </div>
  )
}

function DetailError({ error }: { error: Error }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center gap-3 pt-24 text-center">
      <div className="text-4xl">🌧️</div>
      <h1 className="text-lg font-bold">We couldn’t load this habit</h1>
      <p className="max-w-xs text-[0.875rem] text-[var(--text-2)]">
        {error.message || 'Something went wrong on our side.'}
      </p>
      <button
        type="button"
        onClick={() => router.invalidate()}
        className="press mt-1 rounded-2xl bg-[var(--accent)] px-6 py-3 text-[0.9375rem] font-bold text-white"
      >
        Try again
      </button>
    </div>
  )
}

function SectionCard({
  title,
  children,
  delay = 0,
}: {
  title: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <section
      className="anim-rise-in card p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="mb-3 text-[0.8125rem] font-semibold tracking-wide text-[var(--text-3)] uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-2xl bg-[var(--field-bg)] px-3.5 py-3">
      <div
        className="tabular text-xl font-extrabold tracking-tight"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[0.6875rem] font-medium text-[var(--text-3)]">
        {label}
      </div>
    </div>
  )
}

function HabitDetailPage() {
  const habit = Route.useLoaderData()
  const router = useRouter()
  const online = useOnline()
  const now = useNow(1000)

  const [resetOpen, setResetOpen] = useState(false)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [dayDetail, setDayDetail] = useState<{
    label: string
    entries: ResetEntry[]
  } | null>(null)
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState(false)
  const [resetToDelete, setResetToDelete] = useState<ResetEntry | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const startDate = useMemo(() => new Date(habit.startDate), [habit.startDate])

  // Everything derivable from the (per-load static) reset history is computed
  // once here — the component re-renders every second for the live counter,
  // and this must not be O(resets) per tick.
  const history = useMemo(() => {
    const resetDatesAsc = habit.resets
      .map((r) => new Date(r.timestamp))
      .reverse()

    // Streak each reset ended, keyed by reset id (resets are newest-first).
    const brokenByResetId = new Map<string, number>()
    habit.resets.forEach((r, i) => {
      const ascIndex = habit.resets.length - 1 - i
      const prevBoundary =
        ascIndex > 0 ? resetDatesAsc[ascIndex - 1] : startDate
      brokenByResetId.set(
        r.id,
        Math.max(
          0,
          new Date(r.timestamp).getTime() - prevBoundary.getTime(),
        ),
      )
    })

    // Completed streak segments: habit start → reset 1 → … → latest reset.
    const completedSegments: Segment[] = resetDatesAsc.map((end, i) => {
      const start = i > 0 ? resetDatesAsc[i - 1] : startDate
      return {
        start,
        end,
        ms: Math.max(0, end.getTime() - start.getTime()),
        ongoing: false,
      }
    })
    const completedMax = completedSegments.reduce(
      (max, s) => Math.max(max, s.ms),
      0,
    )
    const completedTotal = completedSegments.reduce((sum, s) => sum + s.ms, 0)

    return {
      resetDatesAsc,
      brokenByResetId,
      completedSegments,
      completedMax,
      completedTotal,
    }
  }, [habit.resets, startDate])

  const lastResetAt =
    habit.lastResetAt !== null ? new Date(habit.lastResetAt) : null

  const since = currentStreakStart(startDate, lastResetAt)
  const streakMs = Math.max(0, now.getTime() - since.getTime())
  // Only the ongoing segment depends on "now" — O(1) per tick.
  const segments: Segment[] = [
    ...history.completedSegments,
    { start: since, end: now, ms: streakMs, ongoing: true },
  ]
  const longest = Math.max(history.completedMax, streakMs)
  const average = (history.completedTotal + streakMs) / segments.length

  // Celebrate milestones crossed while the page is open.
  const prevMsRef = useRef<number | null>(null)
  useEffect(() => {
    if (prevMsRef.current !== null && prevMsRef.current < streakMs) {
      const crossed = milestoneCrossed(prevMsRef.current, streakMs)
      if (crossed) {
        setCelebration(`${crossed.label} clean`)
        haptic([15, 80, 15, 80, 15])
      }
    }
    prevMsRef.current = streakMs
  }, [streakMs])

  const streakDays = streakMs / DAY_MS
  const hasCostStats =
    habit.costPerUnit !== null &&
    habit.unitsPerDay !== null &&
    habit.costPerUnit > 0 &&
    habit.unitsPerDay > 0
  const unitsAvoided = habit.unitsPerDay !== null ? streakDays * habit.unitsPerDay : 0
  const moneySaved =
    hasCostStats && habit.costPerUnit !== null
      ? unitsAvoided * habit.costPerUnit
      : 0
  const weeklySavings =
    hasCostStats && habit.costPerUnit !== null && habit.unitsPerDay !== null
      ? habit.costPerUnit * habit.unitsPerDay * 7
      : 0

  const removeReset = async () => {
    if (!resetToDelete) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteReset({ data: { resetId: resetToDelete.id } })
      setResetToDelete(null)
      await router.invalidate()
    } catch (err) {
      // Keep the sheet open so the user can retry.
      setDeleteError(
        err instanceof Error && err.message
          ? err.message
          : 'We couldn’t remove that reset — mind trying again?',
      )
    } finally {
      setDeleteBusy(false)
    }
  }

  const removeHabit = async () => {
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteHabit({ data: { habitId: habit.id } })
      await router.navigate({ to: '/' })
      await router.invalidate()
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message
          ? err.message
          : 'We couldn’t delete this habit — mind trying again?',
      )
    } finally {
      setDeleteBusy(false)
    }
  }

  const openDayDetail = useCallback(
    (label: string, entries: ResetEntry[]) => setDayDetail({ label, entries }),
    [],
  )
  const celebrationDone = useCallback(() => setCelebration(null), [])

  return (
    <div className="pt-4">
      <div className="anim-rise-in flex items-center justify-between">
        <Link
          to="/"
          className="glass press flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text)] no-underline"
        >
          ‹ Habits
        </Link>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{
            background: `${habit.color}1f`,
            border: `1px solid ${habit.color}44`,
          }}
        >
          {habit.icon}
        </span>
      </div>

      <h1 className="anim-rise-in mt-4 text-center text-xl font-bold tracking-tight">
        {habit.name}
      </h1>

      <div className="anim-rise-in">
        <StreakHero
          sinceMs={streakMs}
          since={since}
          hadResets={habit.totalResets > 0}
          color={habit.color}
        />
      </div>

      <button
        type="button"
        disabled={!online}
        onClick={() => setResetOpen(true)}
        className="glass press anim-rise-in mx-auto block w-full max-w-xs rounded-2xl py-4 text-[0.9375rem] font-bold disabled:opacity-50"
        style={{ color: habit.color, border: `1.5px solid ${habit.color}55` }}
      >
        I slipped — log a reset
      </button>
      <p className="anim-rise-in mt-2 text-center text-[0.75rem] text-[var(--text-3)]">
        Honest logging beats perfect streaks.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <SectionCard title="Milestones" delay={40}>
          <MilestoneStrip streakMs={streakMs} color={habit.color} />
        </SectionCard>

        <SectionCard title="Stats" delay={80}>
          <StreakBars
            currentMs={streakMs}
            longestMs={longest}
            averageMs={average}
            totalResets={habit.totalResets}
            color={habit.color}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatTile
              label={habit.totalResets === 1 ? 'reset logged' : 'resets logged'}
              value={String(habit.totalResets)}
            />
            {hasCostStats ? (
              <>
                <StatTile
                  label="units avoided"
                  value={formatUnits(unitsAvoided)}
                />
                <StatTile
                  label="saved this streak"
                  value={formatMoney(moneySaved)}
                  color={habit.color}
                />
                <StatTile
                  label="saved per week at this pace"
                  value={formatMoney(weeklySavings)}
                />
              </>
            ) : null}
          </div>
          {!hasCostStats ? (
            <p className="mt-2 text-[0.6875rem] text-[var(--text-3)]">
              Add cost per unit and units per day when creating a habit to see
              money saved.
            </p>
          ) : null}
        </SectionCard>

        <SectionCard title="Streak trend" delay={120}>
          <TrendChart segments={segments} color={habit.color} />
        </SectionCard>

        <SectionCard title="When resets happen" delay={160}>
          <PatternsCard resetDates={history.resetDatesAsc} color={habit.color} />
        </SectionCard>

        <SectionCard title="Calendar" delay={200}>
          <MonthCalendar
            startDate={startDate}
            resets={habit.resets}
            color={habit.color}
            onSelectDay={openDayDetail}
          />
        </SectionCard>

        <SectionCard title="Journey" delay={240}>
          <JourneyTimeline
            key={habit.id}
            startDate={startDate}
            resets={habit.resets}
            brokenMs={history.brokenByResetId}
            currentStreakMs={streakMs}
            color={habit.color}
            onDeleteReset={setResetToDelete}
          />
        </SectionCard>

        <button
          type="button"
          onClick={() => setConfirmDeleteHabit(true)}
          className="anim-rise-in press mx-auto mt-2 rounded-full px-4 py-2 text-[0.8125rem] font-semibold text-[var(--danger)]"
          style={{ animationDelay: '280ms' }}
        >
          Stop tracking this habit
        </button>
      </div>

      <ResetSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        habitId={habit.id}
        habitName={habit.name}
        color={habit.color}
        streakStart={since}
        onLogged={() => router.invalidate()}
      />

      <Sheet
        open={dayDetail !== null}
        onClose={() => setDayDetail(null)}
        title={dayDetail?.label}
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {dayDetail?.entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-[var(--field-bg)] p-3.5">
              <div className="text-[0.875rem] font-semibold">
                {formatDateTime(new Date(entry.timestamp))}
              </div>
              {entry.trigger ? (
                <div
                  className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold"
                  style={{ background: `${habit.color}22`, color: habit.color }}
                >
                  {entry.trigger}
                </div>
              ) : null}
              {entry.note ? (
                <p className="mt-1.5 mb-0 text-[0.8125rem] leading-snug text-[var(--text-2)]">
                  “{entry.note}”
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Sheet>

      <ConfirmSheet
        open={resetToDelete !== null}
        onClose={() => {
          setResetToDelete(null)
          setDeleteError(null)
        }}
        onConfirm={removeReset}
        title="Remove this reset?"
        message="Use this if it was logged by mistake. Your streaks will be recalculated as if it never happened."
        confirmLabel="Remove reset"
        danger
        busy={deleteBusy}
        error={resetToDelete !== null ? deleteError : null}
      />

      <ConfirmSheet
        open={confirmDeleteHabit}
        onClose={() => {
          setConfirmDeleteHabit(false)
          setDeleteError(null)
        }}
        onConfirm={removeHabit}
        title={`Stop tracking “${habit.name}”?`}
        message="This deletes the habit and its whole history. There’s no undo — but you can always start tracking it again."
        confirmLabel="Delete habit"
        danger
        busy={deleteBusy}
        error={confirmDeleteHabit ? deleteError : null}
      />

      <Celebration
        trigger={celebration}
        color={habit.color}
        onDone={celebrationDone}
      />
    </div>
  )
}
