import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { ErrorNote } from './ConfirmSheet'
import { Group, Row } from './GroupedList'
import SegmentedControl from './SegmentedControl'
import Sheet, { SHEET_CLOSE_MS } from './Sheet'
import { onColor } from '../lib/color'
import { UserFacingError } from '../lib/errors'
import { logReset } from '../lib/habits.functions'
import { haptic, useAsyncAction, useOnline } from '../lib/hooks'
import {
  formatDateTime,
  formatDurationHuman,
  toDatetimeLocalValue,
} from '../lib/format'
import { TRIGGER_SUGGESTIONS } from '../lib/types'
import { firstIssueMessage, logResetSchema } from '../lib/schemas'

interface ResetSheetProps {
  open: boolean
  onClose: () => void
  habitId: string
  habitName: string
  /** Resolved CSS color (see `habitColor`). */
  color: string
  /** When the current streak began (habit start or the latest reset). */
  streakStart: Date
  onLogged: () => void | Promise<void>
}

type When = 'now' | 'earlier'

const WHEN_OPTIONS: ReadonlyArray<readonly [When, string]> = [
  ['now', 'Just now'],
  ['earlier', 'Earlier'],
]

interface FormState {
  step: 'form' | 'confirm'
  when: When
  earlierValue: string
  trigger: string | null
  note: string
}

const initialForm = (): FormState => ({
  step: 'form',
  when: 'now',
  earlierValue: toDatetimeLocalValue(new Date()),
  trigger: null,
  note: '',
})

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
  const logResetFn = useServerFn(logReset)
  const [form, setForm] = useState<FormState>(initialForm)
  /** Validation problems caught before the confirm step (bad or too-early time). */
  const [stepError, setStepError] = useState<string | null>(null)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  /** The moment being logged: now, or the backdated time (null if unparsable). */
  const chosenTime = (): Date | null => {
    if (form.when === 'now') return new Date()
    const d = new Date(form.earlierValue)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const submit = useAsyncAction(async () => {
    const timestamp = chosenTime()
    if (!timestamp) {
      throw new UserFacingError(
        'That date and time doesn’t look right — try again.',
      )
    }
    const parsed = logResetSchema.safeParse({
      habitId,
      timestamp: timestamp.toISOString(),
      trigger: form.trigger,
      note: form.note,
    })
    if (!parsed.success)
      throw new UserFacingError(firstIssueMessage(parsed.error))
    try {
      await logResetFn({
        data: parsed.data,
      })
    } catch (err) {
      // Whatever went wrong, the form is where the user can fix it.
      set('step', 'form')
      throw err
    }
    haptic([12, 60, 12])
    onClose()
    await onLogged()
  }, 'Something went wrong — mind trying again?')

  // Reset once the close animation has finished; re-opening cancels the reset.
  const { clearError } = submit
  useEffect(() => {
    if (open) {
      setForm(initialForm())
      return
    }
    const t = window.setTimeout(() => {
      setForm(initialForm())
      setStepError(null)
      clearError()
    }, SHEET_CLOSE_MS)
    return () => window.clearTimeout(t)
  }, [open, clearError])

  const goToConfirm = () => {
    setStepError(null)
    submit.clearError()
    const ts = chosenTime()
    if (!ts) {
      setStepError('That date and time doesn’t look right — try again.')
      return
    }
    if (form.when === 'earlier' && ts.getTime() <= streakStart.getTime()) {
      setStepError(
        `That’s before this streak started (${formatDateTime(streakStart)}) — pick a later time.`,
      )
      return
    }
    if (ts.getTime() > Date.now()) {
      setStepError('A reset can’t be in the future.')
      return
    }
    set('step', 'confirm')
  }

  const error = stepError ?? submit.error

  const confirmTime = chosenTime()
  const endedMs = confirmTime
    ? Math.max(0, confirmTime.getTime() - streakStart.getTime())
    : 0
  const tintVars = {
    ['--tint' as string]: color,
    ['--on-tint' as string]: onColor(color),
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={form.step === 'form' ? 'Log a Reset' : 'Ready?'}
      dismissible={!submit.busy}
    >
      {form.step === 'form' ? (
        <div className="flex flex-col gap-5">
          <p className="t-footnote mx-2 -mt-1 mb-0 text-center text-(--text-2)">
            A reset is part of quitting — logging it honestly is the win here.
          </p>

          <SegmentedControl
            aria-label="When did it happen?"
            options={WHEN_OPTIONS}
            value={form.when}
            onChange={(when) => {
              setStepError(null)
              set('when', when)
            }}
          />

          {form.when === 'earlier' ? (
            <Group
              footer={`Any time after this streak began (${formatDateTime(streakStart)}).`}
            >
              <Row className="adaptive-form-row flex-col items-stretch gap-1 min-[380px]:flex-row min-[380px]:items-center min-[380px]:gap-3">
                <label htmlFor="reset-when" className="flex-1">
                  When
                </label>
                <input
                  id="reset-when"
                  type="datetime-local"
                  className="field min-w-0 text-right text-(--text-2) min-[380px]:w-auto"
                  name="timestamp"
                  value={form.earlierValue}
                  min={toDatetimeLocalValue(streakStart)}
                  max={toDatetimeLocalValue(new Date())}
                  onChange={(e) => {
                    setStepError(null)
                    set('earlierValue', e.target.value)
                  }}
                />
              </Row>
            </Group>
          ) : null}

          <Group
            title="Trigger"
            footer="Optional. Spotting patterns is half the battle."
          >
            <div className="flex flex-wrap gap-2 p-3">
              {TRIGGER_SUGGESTIONS.map((t) => {
                const active = form.trigger === t
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set('trigger', active ? null : t)}
                    className="chip"
                    style={tintVars}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </Group>

          <Group title="Note">
            <Row className="items-start">
              <textarea
                className="field resize-none"
                name="note"
                aria-label="Note"
                rows={2}
                maxLength={500}
                placeholder="Anything worth remembering about this one? (optional)"
                value={form.note}
                onChange={(e) => set('note', e.target.value)}
              />
            </Row>
          </Group>

          <div>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            {!online ? (
              <p className="t-footnote mb-3 text-center text-(--text-2)">
                You’re offline — reconnect to log this reset.
              </p>
            ) : null}
            <button
              type="button"
              disabled={!online}
              onClick={goToConfirm}
              className="btn btn-filled"
              style={tintVars}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="t-subhead mx-2 mt-0 mb-4 text-center text-(--text-2)">
            This closes a {formatDurationHuman(endedMs)} streak on{' '}
            <span className="font-semibold text-(--text)">
              {habitName}
            </span>
            {form.when === 'earlier' && confirmTime ? (
              <>
                {' '}
                as of{' '}
                <span className="font-semibold text-(--text)">
                  {formatDateTime(confirmTime)}
                </span>
              </>
            ) : null}{' '}
            and starts a fresh one. No failure here — just honest tracking.
          </p>
          <button
            type="button"
            disabled={submit.busy || !online}
            onClick={() => void submit.run()}
            className="btn btn-filled"
            style={tintVars}
          >
            {submit.busy ? 'Logging…' : 'Restart My Streak'}
          </button>
          <button
            type="button"
            disabled={submit.busy}
            onClick={() => set('step', 'form')}
            className="btn btn-gray"
          >
            Back
          </button>
        </div>
      )}
    </Sheet>
  )
}
