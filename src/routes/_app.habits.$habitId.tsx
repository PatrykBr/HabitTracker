import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import Celebration from '../components/Celebration'
import ConfirmSheet from '../components/ConfirmSheet'
import HabitSheet from '../components/HabitSheet'
import JourneyTimeline from '../components/JourneyTimeline'
import MilestoneStrip from '../components/MilestoneStrip'
import NavBar from '../components/NavBar'
import { IconChevronLeft, IconReset } from '../components/Icons'
import MonthCalendar from '../components/MonthCalendar'
import PatternsCard from '../components/PatternsCard'
import ResetSheet from '../components/ResetSheet'
import Sheet from '../components/Sheet'
import StreakBars from '../components/StreakBars'
import StreakHero from '../components/StreakHero'
import TrendChart from '../components/TrendChart'
import { userMessage } from '../lib/errors'
import { habitColor, labelColor, tint } from '../lib/color'
import {
  deleteHabit,
  deleteReset,
  getHabitDetail,
} from '../lib/habits.functions'
import { haptic, useAsyncAction, useNow, useOnline } from '../lib/hooks'
import {
  DAY_MS,
  currentStreakStart,
  milestoneCrossed,
  summarizeHistory,
  localDayKey,
} from '../lib/streaks'
import type { Segment } from '../lib/streaks'
import { formatDateTime, formatMoney, formatUnits } from '../lib/format'
import type { HabitDetail, ResetEntry } from '../lib/types'

export const Route = createFileRoute('/_app/habits/$habitId')({
  // Live counter, calendar and date formatting depend on the visitor's clock,
  // timezone and locale - render client-side only (loader still runs on the server).
  ssr: 'data-only',
  loader: ({ params }) => getHabitDetail({ data: { habitId: params.habitId } }),
  pendingComponent: DetailPending,
  errorComponent: DetailError,
  notFoundComponent: DetailNotFound,
  component: HabitDetailRoute,
})

function HabitDetailRoute() {
  const { habitId } = Route.useParams()
  const habit = Route.useLoaderData()
  return <HabitDetailPage key={habitId} habit={habit} />
}

function DetailPending() {
  return (
    <div className="pt-6">
      <div className="h-10 w-24 animate-pulse rounded-full bg-(--fill-3)" />
      <div className="mx-auto mt-10 h-40 w-56 animate-pulse rounded-3xl bg-(--fill-3)" />
      <div className="cell mt-10 h-28 animate-pulse opacity-60" />
    </div>
  )
}

function DetailNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 pt-24 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="text-lg font-bold">This habit isn't here</h1>
      <p className="max-w-xs text-[0.875rem] text-(--text-2)">
        Check the address or return to your habits.
      </p>
      <Link
        to="/"
        className="btn btn-tinted mt-1 w-auto no-underline"
      >
        Back to habits
      </Link>
    </div>
  )
}

function DetailError({ error }: { error: unknown }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center gap-3 pt-24 text-center">
      <div className="text-4xl">🌧️</div>
      <h1 className="text-lg font-bold">We couldn't load this habit</h1>
      <p className="max-w-xs text-[0.875rem] text-(--text-2)">
        {userMessage(
          error,
          'Try again to load this habit.',
        )}
      </p>
      <button
        type="button"
        onClick={() => router.invalidate()}
        className="btn btn-tinted mt-1 w-auto"
      >
        Try again
      </button>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="cell p-4">
      <h2 className="t-headline mt-0 mb-3">{title}</h2>
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
    <div className="rounded-2xl bg-(--fill-4) px-3.5 py-3">
      <div
        className="tabular text-xl font-extrabold tracking-tight"
        style={color ? { color: labelColor(color) } : undefined}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[0.6875rem] font-medium text-(--text-2)">
        {label}
      </div>
    </div>
  )
}

/** What the current streak has avoided so far, plus the habit's usual weekly spend. */
function savingsFor(
  costPerUnit: number,
  unitsPerDay: number,
  streakMs: number,
) {
  const unitsAvoided = (streakMs / DAY_MS) * unitsPerDay
  return {
    unitsAvoided,
    moneySaved: unitsAvoided * costPerUnit,
    weeklySpend: costPerUnit * unitsPerDay * 7,
  }
}

function HabitDetailPage({ habit }: { habit: HabitDetail }) {
  const color = habitColor(habit.color)
  const router = useRouter()
  const online = useOnline()
  const now = useNow(1000)

  const deleteResetFn = useServerFn(deleteReset)
  const deleteHabitFn = useServerFn(deleteHabit)

  const [resetOpen, setResetOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [celebration, setCelebration] = useState<string | null>(null)
  // The day's entries stay around while the sheet animates closed, so its
  // title doesn't blank out mid-animation; `dayDetailOpen` drives visibility.
  const [dayDetail, setDayDetail] = useState<{
    label: string
    entries: ResetEntry[]
  } | null>(null)
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState(false)
  const [resetToDelete, setResetToDelete] = useState<ResetEntry | null>(null)

  const startDate = useMemo(() => new Date(habit.startDate), [habit.startDate])

  // Recompute history summaries only when the data changes. The live counter
  // updates every second and must not scan the reset history on each tick.
  const history = useMemo(
    () => summarizeHistory(startDate, habit.resets),
    [habit.resets, startDate],
  )

  const lastResetAt =
    habit.lastResetAt !== null ? new Date(habit.lastResetAt) : null

  const since = currentStreakStart(startDate, lastResetAt)
  const streakMs = Math.max(0, now.getTime() - since.getTime())
  // Only the ongoing segment depends on "now", with O(1) work per tick.
  const ongoing: Segment = {
    start: since,
    end: now,
    ms: streakMs,
    ongoing: true,
  }
  const longest = Math.max(history.completedMax, streakMs)
  const average =
    (history.completedTotal + streakMs) / (habit.resets.length + 1)

  // Celebrate milestones crossed while the page is open.
  const prevMsRef = useRef<{ since: number; ms: number } | null>(null)
  useEffect(() => {
    const previous = prevMsRef.current
    if (previous?.since === since.getTime() && previous.ms < streakMs) {
      const crossed = milestoneCrossed(previous.ms, streakMs)
      if (crossed) {
        setCelebration(crossed.label)
        haptic([15, 80, 15, 80, 15])
      }
    }
    prevMsRef.current = { since: since.getTime(), ms: streakMs }
  }, [streakMs, since.getTime()])

  // Both savings fields are set together or not at all (enforced server-side).
  const savings =
    habit.costPerUnit !== null && habit.unitsPerDay !== null
      ? savingsFor(habit.costPerUnit, habit.unitsPerDay, streakMs)
      : null

  // Each confirm sheet owns its request state; on failure it stays open to retry.
  const removeReset = useAsyncAction(async (reset: ResetEntry) => {
    await deleteResetFn({ data: { resetId: reset.id } })
    setResetToDelete(null)
    await router.invalidate()
  }, "Couldn't remove this reset. Try again.")

  const removeHabit = useAsyncAction(async () => {
    await deleteHabitFn({ data: { habitId: habit.id } })
    await router.navigate({ to: '/' })
    await router.invalidate()
  }, "Couldn't delete this habit. Try again.")

  const openDayDetail = useCallback((label: string, entries: ResetEntry[]) => {
    setDayDetail({ label, entries })
    setDayDetailOpen(true)
  }, [])
  const celebrationDone = useCallback(() => setCelebration(null), [])

  return (
    <div>
      <NavBar
        title={habit.name}
        leading={
          <Link
            to="/"
            aria-label="Back to habits"
            className="glass glass-press flex h-11 w-11 items-center justify-center rounded-full text-(--text) no-underline"
          >
            <IconChevronLeft className="h-6 w-6" />
          </Link>
        }
        trailing={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={!online}
            className="glass glass-press t-body flex min-h-11 items-center justify-center rounded-full px-4 text-(--text) disabled:opacity-50"
          >
            Edit
          </button>
        }
      />

      <StreakHero
        sinceMs={streakMs}
        since={since}
        hadResets={habit.totalResets > 0}
        color={color}
      />

      <button
        type="button"
        disabled={!online}
        onClick={() => setResetOpen(true)}
        className="btn glass glass-press reset-action mx-auto flex max-w-xs disabled:opacity-50"
        style={{
          ['--tint' as string]: color,
          ['--label-tint' as string]: labelColor(color),
        }}
      >
        <IconReset className="h-5 w-5" />
        <span>Log a reset</span>
      </button>
      <p className="mt-2 text-center text-[0.75rem] text-(--text-3)">
        You can log a reset now or enter an earlier time.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <SectionCard title="Milestones">
          <MilestoneStrip streakMs={streakMs} color={color} />
        </SectionCard>

        <SectionCard title="Stats">
          <StreakBars
            currentMs={streakMs}
            longestMs={longest}
            averageMs={average}
            totalResets={habit.totalResets}
            color={color}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatTile
              label={habit.totalResets === 1 ? 'reset logged' : 'resets logged'}
              value={String(habit.totalResets)}
            />
            {savings ? (
              <>
                <StatTile
                  label="units avoided"
                  value={formatUnits(savings.unitsAvoided)}
                />
                <StatTile
                  label="estimated savings"
                  value={formatMoney(savings.moneySaved)}
                  color={color}
                />
                <StatTile
                  label="usual weekly spending"
                  value={formatMoney(savings.weeklySpend)}
                />
              </>
            ) : null}
          </div>
          {!savings ? (
            <p className="mt-2 text-[0.6875rem] text-(--text-3)">
              Tap Edit and add cost per unit and units per day to estimate savings.
            </p>
          ) : null}
        </SectionCard>

        <SectionCard title="Streak trend">
          <TrendChart
            completed={history.completedSegments}
            ongoing={ongoing}
            color={color}
          />
        </SectionCard>

        <SectionCard title="When resets happen">
          <PatternsCard resetDates={history.resetDatesAsc} color={color} />
        </SectionCard>

        <SectionCard title="Calendar">
          <MonthCalendar
            startDate={startDate}
            resets={habit.resets}
            color={color}
            onSelectDay={openDayDetail}
            todayKey={localDayKey(now)}
          />
        </SectionCard>

        <SectionCard title="Reset history">
          <JourneyTimeline
            startDate={startDate}
            resets={habit.resets}
            brokenMs={history.brokenByResetId}
            currentStreakMs={streakMs}
            color={color}
            onDeleteReset={setResetToDelete}
          />
        </SectionCard>

        <button
          type="button"
          onClick={() => setConfirmDeleteHabit(true)}
          className="mx-auto mt-2 min-h-11 rounded-full px-4 py-2 text-[0.9375rem] font-semibold text-(--danger-text)"
        >
          Stop tracking this habit
        </button>
      </div>

      <ResetSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        habitId={habit.id}
        habitName={habit.name}
        color={color}
        streakStart={since}
        onLogged={() => router.invalidate()}
      />

      <HabitSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        habit={habit}
        onSaved={() => router.invalidate()}
      />

      <Sheet
        open={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        title={dayDetail?.label ?? 'Resets'}
      >
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {dayDetail?.entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-(--fill-4) p-3.5">
              <div className="text-[0.875rem] font-semibold">
                {formatDateTime(new Date(entry.timestamp))}
              </div>
              {entry.trigger ? (
                <div
                  className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold"
                  style={{ background: tint(color, 13), color: labelColor(color) }}
                >
                  {entry.trigger}
                </div>
              ) : null}
              {entry.note ? (
                <p className="mt-1.5 mb-0 text-[0.8125rem] leading-snug text-(--text-2)">
                  {entry.note}
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
          removeReset.clearError()
        }}
        onConfirm={() => {
          if (resetToDelete) void removeReset.run(resetToDelete)
        }}
        title="Remove this reset?"
        message="Use this if it was logged by mistake. Your streaks will be recalculated as if it never happened."
        confirmLabel="Remove reset"
        danger
        busy={removeReset.busy}
        error={removeReset.error}
      />

      <ConfirmSheet
        open={confirmDeleteHabit}
        onClose={() => {
          setConfirmDeleteHabit(false)
          removeHabit.clearError()
        }}
        onConfirm={() => void removeHabit.run()}
        title={`Stop tracking ${habit.name}?`}
        message="This deletes the habit and all its resets. You cannot undo this."
        confirmLabel="Delete habit"
        danger
        busy={removeHabit.busy}
        error={removeHabit.error}
      />

      <Celebration
        trigger={celebration}
        color={color}
        onDone={celebrationDone}
      />
    </div>
  )
}
