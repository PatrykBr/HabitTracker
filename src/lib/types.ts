/** Client-safe DTOs shared between server functions and UI. Dates are ISO strings (UTC). */

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

/** Curated palette — every color reads well on both themes. */
export const HABIT_COLORS = [
  '#2FD6A7',
  '#4EA8FF',
  '#A78BFA',
  '#F472B6',
  '#FF7A6B',
  '#FFB020',
  '#A3E635',
  '#22D3EE',
] as const

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
