import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { ErrorNote } from './ConfirmSheet'
import { Group, Row } from './GroupedList'
import { IconCheck } from './Icons'
import Sheet, { SHEET_CLOSE_MS } from './Sheet'
import { habitColor, onColor, systemColorName, tint } from '../lib/color'
import { toDatetimeLocalValue } from '../lib/format'
import { createHabit, updateHabit } from '../lib/habits.functions'
import { haptic, useAsyncAction, useOnline } from '../lib/hooks'
import { habitFormSchema, parseForm } from '../lib/schemas'
import { HABIT_COLORS, HABIT_ICONS } from '../lib/types'
import type { HabitSummary } from '../lib/types'

interface HabitSheetProps {
  open: boolean
  onClose: () => void
  /** When set, the sheet edits this habit instead of creating a new one. */
  habit?: HabitSummary
  /** Called after a successful create or update. */
  onSaved: () => void | Promise<void>
}

interface FormState {
  name: string
  icon: string
  color: string
  startValue: string
  costPerUnit: string
  unitsPerDay: string
}

function initialForm(habit: HabitSummary | undefined): FormState {
  if (!habit) {
    return {
      name: '',
      icon: HABIT_ICONS[0],
      color: HABIT_COLORS[3],
      startValue: toDatetimeLocalValue(new Date()),
      costPerUnit: '',
      unitsPerDay: '',
    }
  }
  return {
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    startValue: toDatetimeLocalValue(new Date(habit.startDate)),
    costPerUnit: habit.costPerUnit === null ? '' : String(habit.costPerUnit),
    unitsPerDay: habit.unitsPerDay === null ? '' : String(habit.unitsPerDay),
  }
}

/** Empty → null; otherwise a number (NaN for junk, which the schema rejects). */
function optionalNumber(raw: string): number | null {
  return raw.trim() === '' ? null : Number(raw)
}

/** Create a habit to quit, or edit an existing one: name, icon, color, start date, optional cost tracking. */
export default function HabitSheet({
  open,
  onClose,
  habit,
  onSaved,
}: HabitSheetProps) {
  const online = useOnline()
  const createFn = useServerFn(createHabit)
  const updateFn = useServerFn(updateHabit)
  const [form, setForm] = useState<FormState>(() => initialForm(habit))
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const save = useAsyncAction(async () => {
    const startDate = new Date(form.startValue)
    const data = parseForm(habitFormSchema, {
      name: form.name,
      icon: form.icon,
      color: form.color,
      // A name/color-only edit must preserve the original seconds, milliseconds,
      // and UTC offset (including an ambiguous local time at the DST fallback).
      startDate:
        habit &&
        form.startValue === toDatetimeLocalValue(new Date(habit.startDate))
          ? habit.startDate
          : Number.isNaN(startDate.getTime())
            ? ''
            : startDate.toISOString(),
      costPerUnit: optionalNumber(form.costPerUnit),
      unitsPerDay: optionalNumber(form.unitsPerDay),
    })
    if (habit) {
      await updateFn({ data: { habitId: habit.id, patch: data } })
    } else {
      await createFn({ data })
    }
    haptic(12)
    onClose()
    await onSaved()
  }, 'Something went wrong — mind trying again?')

  // Reset once the close animation has finished; re-opening cancels the reset.
  const { clearError } = save
  useEffect(() => {
    if (open) {
      // Refresh "now" on opening, rather than when the app shell first mounted.
      if (!habit) setForm(initialForm(undefined))
      return
    }
    const t = window.setTimeout(() => {
      setForm(initialForm(habit))
      clearError()
    }, SHEET_CLOSE_MS)
    return () => window.clearTimeout(t)
  }, [open, habit, clearError])

  const editing = habit !== undefined
  const color = habitColor(form.color)
  // The stored hex may be a legacy value; compare by resolved system color.
  const selectedName = systemColorName(form.color)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Habit' : 'New Habit'}
      dismissible={!save.busy}
    >
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (online) void save.run()
        }}
      >
        <Group>
          <Row>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-base"
              style={{ background: color }}
            >
              {form.icon}
            </span>
            <input
              className="field"
              name="name"
              placeholder="What are you quitting?"
              aria-label="Habit name"
              value={form.name}
              maxLength={60}
              autoFocus={!editing}
              onChange={(e) => set('name', e.target.value)}
            />
          </Row>
        </Group>

        <Group title="Icon">
          <div className="habit-picker grid grid-cols-4 gap-1.5 p-3 min-[380px]:grid-cols-6">
            {HABIT_ICONS.map((emoji) => {
              const selected = form.icon === emoji
              return (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set('icon', emoji)}
                  className="flex aspect-square items-center justify-center rounded-(--r-inner) text-2xl transition-[background-color,transform] duration-200 active:scale-95"
                  style={{
                    background: selected ? tint(color, 22) : 'var(--fill-4)',
                    boxShadow: selected
                      ? `inset 0 0 0 2px ${color}`
                      : undefined,
                  }}
                  aria-label={`Icon ${emoji}`}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </Group>

        <Group title="Color">
          <div className="habit-picker grid grid-cols-4 justify-items-center gap-y-2 p-3 min-[380px]:grid-cols-6">
            {HABIT_COLORS.map((hex) => {
              const name = systemColorName(hex)
              const selected = name === selectedName
              const swatch = `var(--c-${name})`
              return (
                <button
                  key={hex}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set('color', hex)}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 active:scale-90"
                  aria-label={`Color ${name}`}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      background: swatch,
                      boxShadow: selected
                        ? `0 0 0 2px var(--bg-2), 0 0 0 4px ${swatch}`
                        : undefined,
                    }}
                  >
                    {selected ? (
                      <IconCheck
                        className="h-4 w-4"
                        style={{ color: onColor(swatch) }}
                      />
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
        </Group>

        <Group
          title="Clean Since"
          footer={
            editing
              ? 'Has to stay on or before your first logged reset.'
              : 'Defaults to now — set it earlier if you already have a streak going.'
          }
        >
          <Row className="adaptive-form-row flex-col items-stretch gap-1 min-[380px]:flex-row min-[380px]:items-center min-[380px]:gap-3">
            <label htmlFor="habit-start" className="flex-1">
              Started
            </label>
            <input
              id="habit-start"
              type="datetime-local"
              className="field min-w-0 text-right text-(--text-2) min-[380px]:w-auto"
              name="startDate"
              value={form.startValue}
              max={toDatetimeLocalValue(new Date())}
              onChange={(e) => set('startValue', e.target.value)}
            />
          </Row>
        </Group>

        <Group
          title="Money & Usage"
          footer="Optional — powers the “saved” stats. e.g. $0.50 per cigarette, 15 per day."
        >
          <Row className="adaptive-form-row">
            <label htmlFor="habit-cost" className="flex-1">
              Cost per unit
            </label>
            <input
              id="habit-cost"
              className="field w-28 text-right"
              name="costPerUnit"
              inputMode="decimal"
              placeholder="$0.00"
              value={form.costPerUnit}
              onChange={(e) => set('costPerUnit', e.target.value)}
            />
          </Row>
          <Row className="adaptive-form-row">
            <label htmlFor="habit-units" className="flex-1">
              Units per day
            </label>
            <input
              id="habit-units"
              className="field w-28 text-right"
              name="unitsPerDay"
              inputMode="decimal"
              placeholder="0"
              value={form.unitsPerDay}
              onChange={(e) => set('unitsPerDay', e.target.value)}
            />
          </Row>
        </Group>

        <div>
          {save.error ? <ErrorNote>{save.error}</ErrorNote> : null}
          {!online ? (
            <p className="t-footnote mb-3 text-center text-(--text-2)">
              You’re offline — reconnect to{' '}
              {editing ? 'save changes' : 'add a habit'}.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={save.busy || !online}
            className="btn btn-filled"
            style={{
              ['--tint' as string]: color,
              ['--on-tint' as string]: onColor(color),
            }}
          >
            {save.busy
              ? 'Saving…'
              : editing
                ? 'Save Changes'
                : 'Start Tracking'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
