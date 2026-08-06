import { useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import ConfirmSheet from '../components/ConfirmSheet'
import { authClient } from '../lib/auth-client'
import { formatDate } from '../lib/format'

export const Route = createFileRoute('/_app/you')({
  component: YouPage,
})

type ThemeMode = 'auto' | 'light' | 'dark'

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  if (mode === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
  root.style.colorScheme = resolved
  localStorage.setItem('theme', mode)
}

function YouPage() {
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const [theme, setTheme] = useState<ThemeMode>('auto')
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      setTheme(stored)
    }
  }, [])

  const signOut = async () => {
    setBusy(true)
    setSignOutError(null)
    try {
      await authClient.signOut()
      await router.invalidate()
      await router.navigate({ to: '/login' })
    } catch {
      setSignOutError("Couldn't sign out. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pt-6">
      <h1 className="anim-rise-in text-[2rem] font-extrabold tracking-tight">
        You
      </h1>

      <div className="anim-rise-in card mt-4 flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xl font-bold text-[var(--accent)]">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <span>
          <span className="block text-lg font-bold tracking-tight">
            {user.username}
          </span>
          <span className="block text-[0.8125rem] text-[var(--text-3)]">
            Taking it back since {formatDate(new Date(user.createdAt))}
          </span>
        </span>
      </div>

      <div className="anim-rise-in card mt-3 p-5" style={{ animationDelay: '60ms' }}>
        <h2 className="text-[0.8125rem] font-semibold tracking-wide text-[var(--text-3)] uppercase">
          Appearance
        </h2>
        <div className="mt-3 flex rounded-2xl bg-[var(--field-bg)] p-1">
          {(
            [
              ['auto', 'Auto'],
              ['light', 'Light'],
              ['dark', 'Dark'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => {
                setTheme(value)
                applyTheme(value)
              }}
              className="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
              style={
                theme === value
                  ? { background: 'var(--card)', color: 'var(--text)' }
                  : { color: 'var(--text-3)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[0.75rem] text-[var(--text-3)]">
          Auto follows your system setting. Dark is where Reset feels most at
          home.
        </p>
      </div>

      <div className="anim-rise-in mt-3" style={{ animationDelay: '120ms' }}>
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="card press w-full p-4 text-center text-[0.9375rem] font-semibold text-[var(--danger)]"
        >
          Sign out
        </button>
      </div>

      <p className="mt-8 text-center text-[0.75rem] leading-relaxed text-[var(--text-3)]">
        Reset v1 · quitting is hard, tracking it shouldn’t be
      </p>

      <ConfirmSheet
        open={confirmSignOut}
        onClose={() => {
          setConfirmSignOut(false)
          setSignOutError(null)
        }}
        onConfirm={signOut}
        title="Sign out?"
        message="Your streaks keep counting while you’re away. Come back any time."
        confirmLabel="Sign out"
        busy={busy}
        error={signOutError}
      />
    </div>
  )
}
