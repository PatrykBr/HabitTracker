/** Data shared by server functions and the UI. Dates are UTC ISO strings. */
import { SYSTEM_COLORS, SYSTEM_COLOR_NAMES } from './color'

export interface HabitSummary {
  id: string
  name: string
  icon: string
  color: string
  startDate: string
  costPerUnit: number | null
  unitsPerDay: number | null
  createdAt: string
  lastResetAt: string | null
  totalResets: number
}

export interface ResetEntry {
  id: string
  timestamp: string
  trigger: string | null
  note: string | null
  createdAt: string
}

export interface HabitDetail extends HabitSummary {
  /** Reverse-chronological (newest first). */
  resets: ResetEntry[]
}

/** Suggested trigger tags. The server also accepts text up to 32 characters. */
export const TRIGGER_SUGGESTIONS = [
  'Stress',
  'Social',
  'Boredom',
  'Craving',
  'Celebration',
  'Fatigue',
  'Routine',
] as const

/**
 * Store the light hex values of the 12 iOS system colors.
 * habitColor() selects the theme variant through CSS variables.
 */
export const HABIT_COLORS = SYSTEM_COLOR_NAMES.map(
  (name) => SYSTEM_COLORS[name].light,
)

export const HABIT_ICONS = [
  '🚬',
  '🍺',
  '🍷',
  '📱',
  '🎮',
  '🍬',
  '🍔',
  '☕',
  '🛒',
  '🎰',
  '💅',
  '😬',
  '🌿',
  '💊',
  '🥤',
  '🍩',
  '📺',
  '💸',
] as const
