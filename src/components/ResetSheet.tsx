import { useState } from 'react'
import Sheet from './Sheet'
import { logReset } from '../lib/habits.functions'
import { haptic, useOnline } from '../lib/hooks'
import {
  formatDateTime,
  formatDurationHuman,
  toDatetimeLocalValue,
} from '../lib/format'
import { TRIGGER_SUGGESTIONS } from '../lib/types'

interface ResetSheetProps {
  open: boolean
  onClose: () => void
  habitId: string
  habitName: string
  color: string
  /** When the current streak began (habit start or the latest reset). */
  streakStart: Date
  onLogged: () => void
}

/**
 * Log a reset: defaults to now, supports backdating ("forgot to log this
 * earlier"), optional trigger tag and note, and a supportive confirm step.
 */
export default function ResetSheet({
  open,
  onClose,
  habitId,
  habitName,
  color,
  streakStart,
  onLogged,
}: ResetSheetProps) {
  const online = useOnline()
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [when, setWhen] = useState<'now' | 'earlier'>('now')
  const [earlierValue, setEarlierValue] = useState(() =>
    toDatetimeLocalValue(new Date()),
  )
  const [trigger, setTrigger] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setStep('form')
    setWhen('now')
    setEarlierValue(toDatetimeLocalValue(new Date()))
    setTrigger(null)
    setNote('')
    setError(null)
    setBusy(false)
  }

  const close = () => {
    onClose()
    // Let the close animation finish before wiping state.
    window.setTimeout(reset, 250)
  }

  /** The moment being logged: now, or the backdated time (null if unparsable). */
  const chosenTime = (): Date | null => {
    if (when === 'now') return new Date()
    const d = new Date(earlierValue)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const goToConfirm = () => {
    const ts = chosenTime()
    if (!ts) {
      setError('That date and time doesn’t look right — try again.')
      return
    }
    if (when === 'earlier' && ts.getTime() <= streakStart.getTime()) {
      setError(
        `That’s before this streak started (${formatDateTime(streakStart)}) — pick a later time.`,
      )
      return
    }
    setError(null)
    setStep('confirm')
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    const timestamp = chosenTime()
    if (!timestamp) {
      setError('That date and time doesn’t look right — try again.')
      setBusy(false)
      setStep('form')
      return
    }
    try {
      await logReset({
        data: {
          habitId,
          timestamp: timestamp.toISOString(),
          trigger,
          note: note.trim() || null,
        },
      })
      haptic([12, 60, 12])
      onLogged()
      close()
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong — mind trying again?',
      )
      setStep('form')
    } finally {
      setBusy(false)
    }
  }

  const confirmTime = chosenTime()
  const endedMs = confirmTime
    ? Math.max(0, confirmTime.getTime() - streakStart.getTime())
    : 0

  return (
    <Sheet
      open={open}
      onClose={close}
      title={step === 'form' ? 'Log a reset' : 'Ready?'}
      dismissible={!busy}
    >
      {step === 'form' ? (
        <div className="flex flex-col gap-4">
          <p className="-mt-2 text-center text-[0.8125rem] leading-relaxed text-[var(--text-2)]">
            A reset is part of quitting — logging it honestly is the win here.
          </p>

          <div className="flex rounded-2xl bg-[var(--field-bg)] p-1">
            {(['now', 'earlier'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={when === option}
                onClick={() => setWhen(option)}
                className="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
                style={
                  when === option
                    ? { background: 'var(--card)', color: 'var(--text)' }
                    : { color: 'var(--text-3)' }
                }
              >
                {option === 'now' ? 'Just now' : 'Earlier'}
              </button>
            ))}
          </div>

          {when === 'earlier' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
                When did it happen?
              </span>
              <input
                type="datetime-local"
                className="field"
                value={earlierValue}
                min={toDatetimeLocalValue(streakStart)}
                max={toDatetimeLocalValue(new Date())}
                onChange={(e) => setEarlierValue(e.target.value)}
              />
              <span className="text-[0.6875rem] text-[var(--text-3)]">
                Any time after this streak began ({formatDateTime(streakStart)}).
              </span>
            </label>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
              What triggered it? <span className="font-normal text-[var(--text-3)]">(optional)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TRIGGER_SUGGESTIONS.map((t) => {
                const active = trigger === t
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTrigger(active ? null : t)}
                    className="press rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold"
                    style={
                      active
                        ? { background: `${color}26`, color, border: `1px solid ${color}66` }
                        : {
                            background: 'var(--field-bg)',
                            color: 'var(--text-2)',
                            border: '1px solid transparent',
                          }
                    }
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
              Note <span className="font-normal text-[var(--text-3)]">(optional)</span>
            </span>
            <textarea
              className="field resize-none"
              rows={2}
              maxLength={500}
              placeholder="Anything worth remembering about this one?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--danger)]"
            >
              {error}
            </p>
          ) : null}
          {!online ? (
            <p className="text-center text-[0.8125rem] text-[var(--text-3)]">
              You’re offline — reconnect to log this reset.
            </p>
          ) : null}

          <button
            type="button"
            disabled={!online}
            onClick={goToConfirm}
            className="press w-full rounded-2xl py-3.5 text-[0.9375rem] font-bold text-white disabled:opacity-50"
            style={{ background: color }}
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-center text-[0.9375rem] leading-relaxed text-[var(--text-2)]">
            This closes a {formatDurationHuman(endedMs)} streak on{' '}
            <span className="font-semibold text-[var(--text)]">{habitName}</span>
            {when === 'earlier' && confirmTime ? (
              <>
                {' '}
                as of{' '}
                <span className="font-semibold text-[var(--text)]">
                  {formatDateTime(confirmTime)}
                </span>
              </>
            ) : null}{' '}
            and starts a fresh one. No failure here — just honest tracking.
          </p>
          <button
            type="button"
            disabled={busy || !online}
            onClick={submit}
            className="press w-full rounded-2xl py-3.5 text-[0.9375rem] font-bold text-white disabled:opacity-50"
            style={{ background: color }}
          >
            {busy ? 'Logging…' : 'Restart my streak'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setStep('form')}
            className="press w-full rounded-2xl bg-[var(--field-bg)] py-3.5 text-[0.9375rem] font-semibold"
          >
            Back
          </button>
        </div>
      )}
    </Sheet>
  )
}
