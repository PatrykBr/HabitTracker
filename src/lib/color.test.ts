import { describe, expect, it } from 'bun:test'
import {
  SYSTEM_COLORS,
  SYSTEM_COLOR_NAMES,
  habitColor,
  onColor,
  systemColorName,
  tint,
} from './color'
import { HABIT_COLORS } from './types'

describe('systemColorName', () => {
  it('maps every palette hex to its own system color', () => {
    for (const name of SYSTEM_COLOR_NAMES) {
      expect(systemColorName(SYSTEM_COLORS[name].light)).toBe(name)
    }
  })
  it('snaps legacy palette hexes to the nearest system color', () => {
    expect(systemColorName('#2FD6A7')).toBe('teal')
    expect(systemColorName('#4EA8FF')).toBe('cyan')
    expect(systemColorName('#A78BFA')).toBe('purple')
    expect(systemColorName('#FF7A6B')).toBe('pink')
  })
  it('accepts a missing # and is case-insensitive', () => {
    expect(systemColorName('ff3b30')).toBe('red')
  })
  it('falls back to green for unparseable input', () => {
    expect(systemColorName('red')).toBe('green')
  })
})

describe('HABIT_COLORS', () => {
  it('is exactly the light system palette, in order', () => {
    expect([...HABIT_COLORS]).toEqual(
      SYSTEM_COLOR_NAMES.map((n) => SYSTEM_COLORS[n].light),
    )
  })
})

describe('habitColor / onColor / tint', () => {
  it('renders through theme-aware CSS variables', () => {
    expect(habitColor('#007AFF')).toBe('var(--c-blue)')
  })
  it('provides WCAG AA contrast for text on every solid palette fill in both themes', () => {
    for (const name of SYSTEM_COLOR_NAMES) {
      const black = onColor(habitColor(SYSTEM_COLORS[name].light)) === '#000000'
      for (const hex of Object.values(SYSTEM_COLORS[name])) {
        const channels = hex
          .slice(1)
          .match(/../g)!
          .map((part) => {
            const v = parseInt(part, 16) / 255
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
          })
        const l =
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        expect(
          black ? (l + 0.05) / 0.05 : 1.05 / (l + 0.05),
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
  it('builds a color-mix expression', () => {
    expect(tint('var(--c-red)', 15)).toBe(
      'color-mix(in srgb, var(--c-red) 15%, transparent)',
    )
  })
})
