import { Link } from '@tanstack/react-router'

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5" />
    </svg>
  )
}

const tabClass =
  'press flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[0.6875rem] font-semibold text-[var(--text-3)] no-underline'
const activeTabClass = 'text-[var(--accent)]'

/** Floating liquid-glass bottom tab bar — the primary navigation. */
export default function TabBar() {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 safe-x"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
    >
      <div className="glass pointer-events-auto flex w-full max-w-xs gap-1 rounded-[1.5rem] p-1.5">
        <Link
          to="/"
          className={tabClass}
          activeProps={{ className: `${tabClass} ${activeTabClass}` }}
          activeOptions={{ exact: true }}
        >
          <HouseIcon className="h-6 w-6" />
          Habits
        </Link>
        <Link
          to="/you"
          className={tabClass}
          activeProps={{ className: `${tabClass} ${activeTabClass}` }}
        >
          <PersonIcon className="h-6 w-6" />
          You
        </Link>
      </div>
    </nav>
  )
}
