/**
 * Habit colors are the 12 iOS system colors. The database stores the light
 * variant's hex (see `HABIT_COLORS`); the UI renders through CSS custom
 * properties (`--c-<name>`) so the dark variant applies automatically.
 * Legacy hexes from the old palette snap to the nearest system color.
 */

export const SYSTEM_COLOR_NAMES = [
  'red',
  'orange',
  'yellow',
  'green',
  'mint',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'pink',
  'brown',
] as const

export type SystemColorName = (typeof SYSTEM_COLOR_NAMES)[number]

export const SYSTEM_COLORS: Record<
  SystemColorName,
  { light: string; dark: string }
> = {
  red: { light: '#FF3B30', dark: '#FF453A' },
  orange: { light: '#FF9500', dark: '#FF9F0A' },
  yellow: { light: '#FFCC00', dark: '#FFD60A' },
  green: { light: '#34C759', dark: '#30D158' },
  mint: { light: '#00C7BE', dark: '#63E6E2' },
  teal: { light: '#30B0C7', dark: '#40CBE0' },
  cyan: { light: '#32ADE6', dark: '#64D2FF' },
  blue: { light: '#007AFF', dark: '#0A84FF' },
  indigo: { light: '#5856D6', dark: '#5E5CE6' },
  purple: { light: '#AF52DE', dark: '#BF5AF2' },
  pink: { light: '#FF2D55', dark: '#FF375F' },
  brown: { light: '#A2845E', dark: '#AC8E68' },
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/** Nearest system color (by RGB distance) to any stored hex. Unparseable → green. */
export function systemColorName(hex: string): SystemColorName {
  const rgb = parseHex(hex)
  if (!rgb) return 'green'
  let best: SystemColorName = 'green'
  let bestDistance = Infinity
  for (const name of SYSTEM_COLOR_NAMES) {
    const [r, g, b] = parseHex(SYSTEM_COLORS[name].light)!
    const d = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2
    if (d < bestDistance) {
      bestDistance = d
      best = name
    }
  }
  return best
}

/** Theme-aware CSS color for a habit, e.g. `var(--c-mint)`. */
export function habitColor(hex: string): string {
  return `var(--c-${systemColorName(hex)})`
}

/** Readable habit-colored labels on grouped surfaces in either appearance. */
export function labelColor(color: string): string {
  return `color-mix(in srgb, ${color} 50%, var(--text))`
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex)!.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Choose the stronger worst-case contrast across both theme variants. */
export function onColor(color: string): string {
  const name =
    color === 'var(--accent)'
      ? 'green'
      : color === 'var(--danger)'
        ? 'red'
        : SYSTEM_COLOR_NAMES.find((name) => color === `var(--c-${name})`)
  if (!name) return '#ffffff'
  const levels = Object.values(SYSTEM_COLORS[name]).map(luminance)
  const blackContrast = (Math.min(...levels) + 0.05) / 0.05
  const whiteContrast = 1.05 / (Math.max(...levels) + 0.05)
  return blackContrast >= whiteContrast ? '#000000' : '#ffffff'
}

/** `color` at `percent` opacity — works with CSS variables, unlike hex+alpha. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}
