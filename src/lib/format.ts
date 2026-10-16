import { DAY_MS, HOUR_MS, MINUTE_MS } from './streaks'

export interface DurationParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function durationParts(ms: number): DurationParts {
  const clamped = Math.max(0, ms)
  return {
    days: Math.floor(clamped / DAY_MS),
    hours: Math.floor((clamped % DAY_MS) / HOUR_MS),
    minutes: Math.floor((clamped % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((clamped % MINUTE_MS) / 1000),
  }
}

export interface DominantUnit {
  /** The number to show big. */
  value: number
  /** Full unit word, pluralized: "day" / "days" / "hour" / "minutes". */
  unit: string
  /** Compact unit for tight layouts: "day(s)" stays, "hours" → "hr", "minutes" → "min". */
  short: string
}

/**
 * The single most meaningful unit for a streak: days once a day has passed,
 * then hours, then minutes. Used by every big streak number so they agree.
 */
export function dominantUnit(ms: number): DominantUnit {
  const p = durationParts(ms)
  if (p.days >= 1) {
    const unit = p.days === 1 ? 'day' : 'days'
    return { value: p.days, unit, short: unit }
  }
  if (p.hours >= 1) {
    return { value: p.hours, unit: p.hours === 1 ? 'hour' : 'hours', short: 'hr' }
  }
  return { value: p.minutes, unit: p.minutes === 1 ? 'minute' : 'minutes', short: 'min' }
}

/** "12d 4h" · "4h 23m" · "23m" · "45s" */
export function formatDurationShort(ms: number): string {
  const p = durationParts(ms)
  if (p.days >= 1) return `${p.days}d ${p.hours}h`
  if (p.hours >= 1) return `${p.hours}h ${p.minutes}m`
  if (p.minutes >= 1) return `${p.minutes}m`
  return `${p.seconds}s`
}

/** Rounded day count for stats, e.g. "18 days" / "1 day" / "6 hours". */
export function formatDurationHuman(ms: number): string {
  const p = durationParts(ms)
  if (p.days >= 1) return p.days === 1 ? '1 day' : `${p.days} days`
  if (p.hours >= 1) return p.hours === 1 ? '1 hour' : `${p.hours} hours`
  if (p.minutes >= 1) return p.minutes === 1 ? '1 minute' : `${p.minutes} minutes`
  return 'moments'
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "04:32:07" — the ticking sub-line under the hero number. */
export function formatClock(ms: number): string {
  const p = durationParts(ms)
  return `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`
}

// Assumption: costs are formatted as USD. Swap the currency here if needed.
const moneyFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const moneyFormatPrecise = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export function formatMoney(amount: number): string {
  return amount >= 100
    ? moneyFormat.format(amount)
    : moneyFormatPrecise.format(amount)
}

export function formatUnits(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

// Hoisted: Intl.DateTimeFormat construction is expensive and these run inside
// components that re-render every second.
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const monthYearFormat = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
})

export function formatDateTime(d: Date): string {
  return dateTimeFormat.format(d)
}

export function formatDate(d: Date): string {
  return dateFormat.format(d)
}

export function formatMonthYear(d: Date): string {
  return monthYearFormat.format(d)
}

/** Local datetime string for <input type="datetime-local"> values. */
export function toDatetimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
