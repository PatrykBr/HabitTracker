import { useState } from 'react'
import Sheet from './Sheet'
import { createHabit } from '../lib/habits.functions'
import { haptic, useOnline } from '../lib/hooks'
import { toDatetimeLocalValue } from '../lib/format'
import { HABIT_COLORS, HABIT_ICONS } from '../lib/types'

interface NewHabitSheetProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

/** Add a habit to quit: name, icon, color, start date, optional cost tracking. */
export default function NewHabitSheet({
  open,
  onClose,
  onCreated,
}: NewHabitSheetProps) {
  const online = useOnline()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0])
  const [color, setColor] = useState<string>(HABIT_COLORS[0])
  const [startValue, setStartValue] = useState(() =>
    toDatetimeLocalValue(new Date()),
  )
  const [costPerUnit, setCostPerUnit] = useState('')
  const [unitsPerDay, setUnitsPerDay] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setIcon(HABIT_ICONS[0])
    setColor(HABIT_COLORS[0])
    setStartValue(toDatetimeLocalValue(new Date()))
    setCostPerUnit('')
    setUnitsPerDay('')
    setError(null)
    setBusy(false)
  }

  const close = () => {
    onClose()
    window.setTimeout(resetForm, 250)
  }

  const parseOptionalNumber = (raw: string): number | null | undefined => {
    if (raw.trim() === '') return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }

  const submit = async () => {
    setError(null)
    if (!name.trim()) {
      setError('Give your habit a name.')
      return
    }
    const startDate = new Date(startValue)
    if (Number.isNaN(startDate.getTime())) {
      setError('That start date doesn’t look right.')
      return
    }
    const cost = parseOptionalNumber(costPerUnit)
    const units = parseOptionalNumber(unitsPerDay)
    if (cost === undefined || units === undefined) {
      setError('Cost and units should be positive numbers.')
      return
    }
    // Savings stats need both — a half-filled pair would silently do nothing.
    if ((cost === null) !== (units === null)) {
      setError(
        'To track savings, fill in both cost per unit and units per day — or leave both empty.',
      )
      return
    }
    setBusy(true)
    try {
      await createHabit({
        data: {
          name: name.trim(),
          icon,
          color,
          startDate: startDate.toISOString(),
          costPerUnit: cost,
          unitsPerDay: units,
        },
      })
      haptic(12)
      onCreated()
      close()
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong — mind trying again?',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Quit something new">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
            What are you quitting?
          </span>
          <input
            className="field"
            placeholder="Smoking, doomscrolling, energy drinks…"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
            Icon
          </span>
          <div className="grid grid-cols-9 gap-1">
            {HABIT_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-pressed={icon === emoji}
                onClick={() => setIcon(emoji)}
                className="press flex aspect-square items-center justify-center rounded-xl text-lg"
                style={{
                  background: icon === emoji ? `${color}26` : 'var(--field-bg)',
                  border: `1px solid ${icon === emoji ? `${color}66` : 'transparent'}`,
                }}
                aria-label={`Icon ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
            Color
          </span>
          <div className="flex justify-between">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className="press h-8 w-8 rounded-full"
                style={{
                  background: c,
                  boxShadow:
                    color === c
                      ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}`
                      : undefined,
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
            Clean since
          </span>
          <input
            type="datetime-local"
            className="field"
            value={startValue}
            max={toDatetimeLocalValue(new Date())}
            onChange={(e) => setStartValue(e.target.value)}
          />
          <span className="text-[0.6875rem] text-[var(--text-3)]">
            Defaults to now — set it earlier if you already have a streak going.
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-semibold text-[var(--text-2)]">
            Money &amp; usage <span className="font-normal text-[var(--text-3)]">(optional — powers “saved” stats)</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="field"
              inputMode="decimal"
              placeholder="Cost per unit ($)"
              aria-label="Cost per unit in dollars"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
            />
            <input
              className="field"
              inputMode="decimal"
              placeholder="Units per day"
              aria-label="Units per day"
              value={unitsPerDay}
              onChange={(e) => setUnitsPerDay(e.target.value)}
            />
          </div>
          <span className="text-[0.6875rem] text-[var(--text-3)]">
            e.g. $0.50 per cigarette, 15 per day.
          </span>
        </div>

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
            You’re offline — reconnect to add a habit.
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy || !online}
          onClick={submit}
          className="press w-full rounded-2xl py-3.5 text-[0.9375rem] font-bold text-white disabled:opacity-50"
          style={{ background: color }}
        >
          {busy ? 'Adding…' : 'Start tracking'}
        </button>
      </div>
    </Sheet>
  )
}
