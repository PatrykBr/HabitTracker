import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ConfirmSheet from '../components/ConfirmSheet'
import NavBar from '../components/NavBar'
import SegmentedControl from '../components/SegmentedControl'
import { authClient } from '../lib/auth-client'
import { formatDate } from '../lib/format'
import { useAsyncAction } from '../lib/hooks'
import { readStoredTheme, setTheme } from '../lib/theme'
import type { ThemeMode } from '../lib/theme'

export const Route = createFileRoute('/_app/you')({
  // Reads localStorage and formats a date in the visitor's locale - client-only.
  ssr: 'data-only',
  pendingComponent: YouPending,
  component: YouPage,
})

function YouPending() {
  return (
    <>
      <NavBar title="You" />
      <div className="cell h-24 animate-pulse opacity-60" />
      <div className="cell mt-3 h-32 animate-pulse opacity-60" />
    </>
  )
}

const THEME_OPTIONS: ReadonlyArray<[ThemeMode, string]> = [
  ['auto', 'Auto'],
  ['light', 'Light'],
  ['dark', 'Dark'],
]

function YouPage() {
  const { user } = Route.useRouteContext()
  // Safe to read storage in the initializer: this route never renders on the server.
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const signOut = useAsyncAction(async () => {
    const result = await authClient.signOut()
    if (result.error) throw new Error(result.error.message)
    // Discard private loader data and pending preloads for the signed-out user.
    window.location.replace('/login')
  }, 'Couldn’t sign out. Check your connection and try again.')

  const chooseTheme = (mode: ThemeMode) => {
    setThemeState(mode)
    setTheme(mode)
  }

  return (
    <>
      <NavBar title="You" />

      <div className="anim-rise-in cell flex items-center gap-4 p-5">
        <span className="profile-mark t-rounded flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-semibold">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-bold tracking-tight">
            {user.username}
          </span>
          <span className="block text-[0.8125rem] text-(--text-2)">
            Taking it back since {formatDate(new Date(user.createdAt))}
          </span>
        </span>
      </div>

      <div
        className="anim-rise-in cell mt-3 p-5"
        style={{ animationDelay: '60ms' }}
      >
        <h2 className="t-headline m-0">Appearance</h2>
        <div className="mt-3">
          <SegmentedControl
            aria-label="Appearance"
            options={THEME_OPTIONS}
            value={theme}
            onChange={chooseTheme}
          />
        </div>
        <p className="mt-2 mb-0 text-[0.75rem] text-(--text-2)">
          Auto follows your device’s light or dark appearance.
        </p>
      </div>

      <div className="anim-rise-in mt-3" style={{ animationDelay: '120ms' }}>
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="cell row-press w-full p-4 text-center text-[0.9375rem] font-semibold text-(--danger-text)"
        >
          Sign out
        </button>
      </div>

      <p className="mt-8 text-center text-[0.75rem] leading-relaxed text-(--text-3)">
        Reset v1 · quitting is hard, tracking it shouldn’t be
      </p>

      <ConfirmSheet
        open={confirmSignOut}
        onClose={() => {
          setConfirmSignOut(false)
          signOut.clearError()
        }}
        onConfirm={() => void signOut.run()}
        title="Sign out?"
        message="Your streaks keep counting while you’re away. Come back any time."
        confirmLabel="Sign out"
        busy={signOut.busy}
        error={signOut.error}
      />
    </>
  )
}
