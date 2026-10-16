/** Client-safe DTOs shared between server functions and UI. Dates are ISO strings (UTC). */
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

/** Suggested trigger tags (free text up to 32 chars is also accepted). */
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
 * The 12 iOS system colors (light variants — the stored value). Rendering goes
 * through `habitColor()` in `color.ts`, which swaps in the dark variant via CSS.
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
