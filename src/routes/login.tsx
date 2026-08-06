import { useState } from 'react'
import {
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { authClient, internalEmailFor } from '../lib/auth-client'
import { getSessionUser } from '../lib/auth.functions'
import { haptic } from '../lib/hooks'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/

function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const u = username.trim()
    if (!USERNAME_RE.test(u)) {
      setError(
        'Usernames are 3–30 characters: letters, numbers, dots or underscores.',
      )
      return
    }
    if (password.length < 8) {
      setError('Your password needs at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      const result =
        mode === 'signup'
          ? await authClient.signUp.email({
              email: internalEmailFor(u),
              name: u,
              username: u,
              password,
            })
          : await authClient.signIn.username({ username: u, password })

      if (result.error) {
        setError(
          result.error.message ??
            'That didn’t work — check your details and try again.',
        )
        return
      }
      haptic(10)
      await router.invalidate()
      await router.navigate({ to: '/' })
    } catch {
      setError('We couldn’t reach the server — check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10 safe-top safe-bottom">
      <div className="anim-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-3xl"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--card-border)',
            }}
          >
            ↺
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Reset</h1>
          <p className="mt-1.5 max-w-[16rem] text-[0.9375rem] leading-relaxed text-[var(--text-2)]">
            Quit hard things, one streak at a time.
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex rounded-2xl bg-[var(--field-bg)] p-1">
            {(
              [
                ['signin', 'Sign in'],
                ['signup', 'Create account'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value)
                  setError(null)
                }}
                className="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
                style={
                  mode === value
                    ? { background: 'var(--card)', color: 'var(--text)' }
                    : { color: 'var(--text-3)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              className="field"
              placeholder="Username"
              aria-label="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="field"
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--danger)]"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="press mt-1 w-full rounded-2xl bg-[var(--accent)] py-3.5 text-[0.9375rem] font-bold text-white disabled:opacity-50"
            >
              {busy
                ? 'One moment…'
                : mode === 'signup'
                  ? 'Start fresh'
                  : 'Welcome back'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[0.75rem] leading-relaxed text-[var(--text-3)]">
          No email needed — just a username and password.
          <br />
          Your data stays yours.
        </p>
      </div>
    </main>
  )
}
