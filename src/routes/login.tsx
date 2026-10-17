import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { UserFacingError } from '../lib/errors'
import { haptic, useAsyncAction } from '../lib/hooks'
import {
  credentialsSchema,
  parseForm,
  internalEmailFor,
} from '../lib/schemas'
import { clearSessionCache, fetchSessionUser } from '../lib/session'
import SegmentedControl from '../components/SegmentedControl'
import { ErrorNote } from '../components/ConfirmSheet'
import { onColor } from '../lib/color'
import { IconReset } from '../components/Icons'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    clearSessionCache()
    const user = await fetchSessionUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

type Mode = 'signin' | 'signup'

const MODE_OPTIONS: ReadonlyArray<[Mode, string]> = [
  ['signin', 'Sign in'],
  ['signup', 'Create account'],
]

function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = useAsyncAction(async () => {
    const data = parseForm(credentialsSchema, { username, password })
    const u = data.username
    const result =
      mode === 'signup'
        ? await authClient.signUp.email({
            email: internalEmailFor(u),
            name: u,
            username: u,
            password: data.password,
          })
        : await authClient.signIn.username({
            username: u,
            password: data.password,
          })

    if (result.error) {
      // Better Auth's messages are written for end users ("Invalid username or password").
      throw new UserFacingError(
        result.error.message ??
          'That didn’t work — check your details and try again.',
      )
    }
    haptic(10)
    // Start with an empty router cache when the account changes.
    window.location.replace('/')
  }, 'Something went wrong — check your connection and try again.')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10 safe-top safe-bottom">
      <div className="anim-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="glass flex h-18 w-18 items-center justify-center rounded-3xl"
            style={{
              color: 'var(--accent-text)',
            }}
          >
            <IconReset className="h-9 w-9" />
          </div>
          <h1 className="t-rounded mt-4 text-[2.5rem] font-bold tracking-tight">Reset</h1>
          <p className="mt-1.5 max-w-[16rem] text-[0.9375rem] leading-relaxed text-(--text-2)">
            Quit hard things, one streak at a time.
          </p>
        </div>

        <div className="cell p-5">
          <div className="mb-4">
            <SegmentedControl
              aria-label="Account access"
              options={MODE_OPTIONS}
              value={mode}
              disabled={submit.busy}
              onChange={(value) => {
                setMode(value)
                submit.clearError()
              }}
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit.run()
            }}
            className="flex flex-col gap-3"
          >
            <input
              className="field field-standalone"
              name="username"
              placeholder="Username"
              aria-label="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="field field-standalone"
              name="password"
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {submit.error ? <ErrorNote>{submit.error}</ErrorNote> : null}

            <button
              type="submit"
              disabled={submit.busy}
              className="btn btn-filled mt-1"
              style={{ ['--on-tint' as string]: onColor('var(--accent)') }}
            >
              {submit.busy
                ? 'One moment…'
                : mode === 'signup'
                  ? 'Start fresh'
                  : 'Welcome back'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[0.75rem] leading-relaxed text-(--text-3)">
          No email needed — just a username and password.
          <br />
          Your data stays yours.
        </p>
      </div>
    </main>
  )
}
