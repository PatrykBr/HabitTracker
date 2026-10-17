import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Chevron } from '../components/GroupedList'
import { IconPerson } from '../components/Icons'
import NavBar from '../components/NavBar'
import StreakHero from '../components/StreakHero'
import { habitColor, labelColor, tint } from '../lib/color'
import { userMessage } from '../lib/errors'
import { listHabits } from '../lib/habits.functions'
import { useNow } from '../lib/hooks'
import { currentStreakStart, nextMilestone } from '../lib/streaks'
import { dominantUnit } from '../lib/format'
import type { HabitSummary } from '../lib/types'

export const Route = createFileRoute('/_app/')({
  // Live counters, greeting and date formatting depend on the visitor's clock,
  // timezone and locale - render them client-side only so SSR HTML can't
  // disagree with the first client render. The loader still runs on the server.
  ssr: 'data-only',
  loader: () => listHabits(),
  pendingComponent: DashboardPending,
  errorComponent: DashboardError,
  component: Dashboard,
})

function DashboardPending() {
  return (
    <>
      <NavBar title="Habits" />
      <div className="cell h-40 animate-pulse opacity-60" />
    </>
  )
}

function DashboardError({ error }: { error: unknown }) {
  const router = useRouter()
  return (
    <>
      <NavBar title="Habits" />
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <div className="text-4xl">🌧️</div>
        <h2 className="t-title3 m-0">We couldn't load your habits</h2>
        <p className="t-subhead m-0 max-w-xs text-(--text-2)">
          {userMessage(
            error,
            'Try again to load your habits.',
          )}
        </p>
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="btn btn-tinted mt-2 w-auto"
        >
          Try again
        </button>
      </div>
    </>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const habits = Route.useLoaderData()
  // One ticking clock for every row instead of one interval per row.
  const now = useNow(1000)

  return (
    <>
      <NavBar
        title="Habits"
        subtitle={greeting()}
        trailing={
          <Link to="/you" aria-label="Your profile" className="glass glass-press flex h-11 w-11 items-center justify-center rounded-full">
            <IconPerson className="h-5 w-5" />
          </Link>
        }
      />

      {habits.length === 0 ? (
        <EmptyState />
      ) : habits.length === 1 ? (
        <div className="anim-rise-in">
          <HeroHabitCell habit={habits[0]} now={now} />
        </div>
      ) : (
        <div className="habit-list dashboard-habits anim-rise-in">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} now={now} />
          ))}
        </div>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div className="anim-rise-in mt-14 flex flex-col items-center gap-3 px-4 text-center">
      <div className="text-5xl">🌱</div>
      <h2 className="t-title2 m-0">Add a habit</h2>
      <p className="t-subhead m-0 max-w-[18rem] text-(--text-2)">
        Choose a habit you're trying to quit. Reset tracks the time since you
        started or last logged a reset.
      </p>
      <p className="t-footnote m-0 mt-2 text-(--text-3)">
        Tap <span className="font-semibold text-(--accent-text)">+</span> below
        to start.
      </p>
    </div>
  )
}

function IconBadge({
  habit,
  size,
}: {
  habit: HabitSummary
  size: 'sm' | 'lg'
}) {
  return (
    <span
      className={`habit-icon flex shrink-0 items-center justify-center ${
        size === 'lg'
          ? 'h-12 w-12 rounded-[14px] text-2xl'
          : 'h-10 w-10 rounded-[11px] text-xl'
      }`}
      style={{ background: habitColor(habit.color) }}
    >
      {habit.icon}
    </span>
  )
}

/**
 * Show the full streak counter when the user tracks one habit.
 */
function HeroHabitCell({ habit, now }: { habit: HabitSummary; now: Date }) {
  const color = habitColor(habit.color)
  const since = currentStreakStart(
    new Date(habit.startDate),
    habit.lastResetAt ? new Date(habit.lastResetAt) : null,
  )
  const ms = Math.max(0, now.getTime() - since.getTime())

  return (
    <Link
      to="/habits/$habitId"
      params={{ habitId: habit.id }}
      className="cell row-press block p-6 text-(--text) no-underline"
    >
      <span className="flex items-center justify-center gap-3">
        <IconBadge habit={habit} size="sm" />
        <span className="t-headline">{habit.name}</span>
      </span>

      <StreakHero sinceMs={ms} since={since} hadResets={habit.totalResets > 0} color={color} />

      <span className="t-footnote mt-5 flex items-center justify-center gap-1 text-(--text-3)">
        {habit.totalResets > 0
          ? `${habit.totalResets} reset${habit.totalResets > 1 ? 's' : ''} logged · stats and history`
          : 'No resets logged · stats and milestones'}
        <Chevron />
      </span>
    </Link>
  )
}

function HabitRow({ habit, now }: { habit: HabitSummary; now: Date }) {
  const color = habitColor(habit.color)
  const since = currentStreakStart(
    new Date(habit.startDate),
    habit.lastResetAt ? new Date(habit.lastResetAt) : null,
  )
  const ms = Math.max(0, now.getTime() - since.getTime())
  const { value: big, short: unit } = dominantUnit(ms)
  const next = nextMilestone(ms)

  return (
    <Link
      to="/habits/$habitId"
      params={{ habitId: habit.id }}
      className="habit-row cell text-(--text) no-underline"
    >
      <IconBadge habit={habit} size="lg" />
      <span className="habit-copy min-w-0 flex-1">
        <span className="habit-name t-body block">{habit.name}</span>
        <span className="habit-meta t-footnote block text-(--text-2)">
          {habit.totalResets > 0
            ? `${habit.totalResets} reset${habit.totalResets > 1 ? 's' : ''} logged`
            : 'No resets logged'}
        </span>
      </span>
      <span
        className="habit-streak flex shrink-0 items-baseline gap-1 rounded-full px-3 py-1"
        style={{ background: tint(color, 12) }}
      >
        <span
          className="t-rounded tabular text-[1.75rem] leading-none font-semibold"
          style={{ color: labelColor(color) }}
        >
          {big}
        </span>
        <span className="t-footnote font-semibold" style={{ color: labelColor(color) }}>
          {unit}
        </span>
      </span>
      <Chevron />
      <span className="habit-progress">
        <span className="habit-goal-label">
          <span>{next ? 'Next milestone' : 'Every milestone reached'}</span>
          <span className="font-semibold" style={{ color: labelColor(color) }}>
            {next?.label ?? '1 year'}
          </span>
        </span>
        <span className="habit-track">
          <span style={{ background: color, width: `${next ? Math.min(100, (ms / next.ms) * 100) : 100}%` }} />
        </span>
      </span>
    </Link>
  )
}
