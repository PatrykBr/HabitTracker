import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import NewHabitSheet from '../components/NewHabitSheet'
import { listHabits } from '../lib/habits.functions'
import { useNow } from '../lib/hooks'
import { currentStreakStart, nextMilestone } from '../lib/streaks'
import { durationParts, formatClock, formatDurationShort } from '../lib/format'
import type { HabitSummary } from '../lib/types'

export const Route = createFileRoute('/_app/')({
  loader: () => listHabits(),
  pendingComponent: DashboardPending,
  errorComponent: DashboardError,
  component: Dashboard,
})

function DashboardPending() {
  return (
    <div className="pt-6">
      <h1 className="text-[2rem] font-extrabold tracking-tight">Habits</h1>
      <div className="mt-4 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="card h-24 animate-pulse opacity-60" />
        ))}
      </div>
    </div>
  )
}

function DashboardError({ error }: { error: Error }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center gap-3 pt-24 text-center">
      <div className="text-4xl">🌧️</div>
      <h1 className="text-lg font-bold">We couldn’t load your habits</h1>
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

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still going'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const habits = Route.useLoaderData()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="pt-6">
      <header className="anim-rise-in flex items-start justify-between">
        <div>
          <p className="text-[0.8125rem] font-semibold tracking-wide text-[var(--text-3)] uppercase">
            {greeting()}
          </p>
          <h1 className="text-[2rem] font-extrabold tracking-tight">Habits</h1>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Add a habit"
          className="glass press flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-[var(--accent)]"
        >
          +
        </button>
      </header>

      {habits.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : habits.length === 1 ? (
        <div className="anim-rise-in mt-4">
          <HeroHabitCard habit={habits[0]} />
        </div>
      ) : (
        <ul className="mt-4 flex list-none flex-col gap-3 p-0">
          {habits.map((habit, i) => (
            <li
              key={habit.id}
              className="anim-rise-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <HabitCard habit={habit} />
            </li>
          ))}
        </ul>
      )}

      <NewHabitSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => router.invalidate()}
      />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="anim-rise-in mt-16 flex flex-col items-center gap-3 text-center">
      <div className="text-5xl">🌱</div>
      <h2 className="text-xl font-bold tracking-tight">
        Ready when you are
      </h2>
      <p className="max-w-[17rem] text-[0.9375rem] leading-relaxed text-[var(--text-2)]">
        Pick one thing you want to stop doing. We’ll count every clean minute
        from there — and resets are part of the journey, not the end of it.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="press mt-2 rounded-2xl bg-[var(--accent)] px-6 py-3.5 text-[0.9375rem] font-bold text-white"
      >
        Track your first habit
      </button>
    </div>
  )
}

/**
 * When someone tracks exactly one habit, the dashboard is that habit's
 * moment — a big glanceable hero card instead of a lonely one-row list.
 */
function HeroHabitCard({ habit }: { habit: HabitSummary }) {
  const now = useNow(1000)
  const since = currentStreakStart(
    new Date(habit.startDate),
    habit.lastResetAt ? new Date(habit.lastResetAt) : null,
  )
  const ms = Math.max(0, now.getTime() - since.getTime())
  const p = durationParts(ms)
  const next = nextMilestone(ms)

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
    <Link
      to="/habits/$habitId"
      params={{ habitId: habit.id }}
      className="card press relative block overflow-hidden p-6 no-underline"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44"
        style={{
          background: `radial-gradient(26rem 13rem at 50% -5rem, ${habit.color}30, transparent 70%)`,
        }}
      />

      <span className="relative flex items-center justify-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
          style={{
            background: `${habit.color}1f`,
            border: `1px solid ${habit.color}44`,
          }}
        >
          {habit.icon}
        </span>
        <span className="text-[1.0625rem] font-bold text-[var(--text)]">
          {habit.name}
        </span>
      </span>

      <span className="relative mt-6 block text-center">
        <span
          className="tabular block text-[5.5rem] leading-none font-extrabold tracking-tighter"
          style={{ color: habit.color }}
        >
          {big}
        </span>
        <span className="mt-1 block text-[0.9375rem] font-semibold text-[var(--text-2)]">
          {unit} clean
        </span>
        <span className="tabular mt-2 block font-mono text-[0.8125rem] text-[var(--text-3)]">
          {formatClock(ms)}
        </span>
      </span>

      {next ? (
        <span className="relative mt-7 block">
          <span className="flex items-baseline justify-between text-[0.6875rem] font-semibold tracking-wide text-[var(--text-3)] uppercase">
            <span>next: {next.label}</span>
            <span className="tabular">
              {formatDurationShort(next.ms - ms)} to go
            </span>
          </span>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[var(--field-bg)]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(1.5, (ms / next.ms) * 100))}%`,
                background: habit.color,
                transition: 'width 1s linear',
              }}
            />
          </span>
        </span>
      ) : null}

      <span className="relative mt-5 block text-center text-[0.75rem] text-[var(--text-3)]">
        {habit.totalResets > 0
          ? `${habit.totalResets} reset${habit.totalResets > 1 ? 's' : ''} logged · tap for stats & history`
          : 'clean start · tap for stats & milestones'}
      </span>
    </Link>
  )
}

function HabitCard({ habit }: { habit: HabitSummary }) {
  const now = useNow(1000)
  const since = currentStreakStart(
    new Date(habit.startDate),
    habit.lastResetAt ? new Date(habit.lastResetAt) : null,
  )
  const ms = now.getTime() - since.getTime()
  const p = durationParts(ms)

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
    unit = 'min'
  }

  return (
    <Link
      to="/habits/$habitId"
      params={{ habitId: habit.id }}
      className="card press flex items-center gap-4 p-4 no-underline"
    >
      <span
        className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ background: `${habit.color}1f`, border: `1px solid ${habit.color}44` }}
      >
        {habit.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-semibold text-[var(--text)]">
          {habit.name}
        </span>
        <span className="tabular mt-0.5 block font-mono text-[0.75rem] text-[var(--text-3)]">
          {formatClock(ms)}
          {habit.totalResets > 0
            ? ` · ${habit.totalResets} reset${habit.totalResets > 1 ? 's' : ''}`
            : ' · clean start'}
        </span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className="tabular text-4xl font-extrabold tracking-tight"
          style={{ color: habit.color }}
        >
          {big}
        </span>
        <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
          {unit}
        </span>
      </span>
      <span className="text-[var(--text-3)]">›</span>
    </Link>
  )
}
