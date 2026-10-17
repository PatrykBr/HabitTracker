import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { restoreGlobals, stubGlobal } from '../../tests/globals'
import { applyTheme, THEME_INIT_SCRIPT, watchSystemTheme } from './theme'

let mode: string | undefined
let dark = true
const classes = new Set<string>()
let onChange: () => void
beforeEach(() => {
  mode = undefined
  dark = true
  classes.clear()
  stubGlobal('document', {
    documentElement: {
      classList: {
        remove: (...names: string[]) =>
          names.forEach((name) => classes.delete(name)),
        add: (name: string) => classes.add(name),
      },
      setAttribute: (_: string, value: string) => {
        mode = value
      },
      removeAttribute: () => {
        mode = undefined
      },
      hasAttribute: () => mode !== undefined,
      style: {},
    },
  })
  stubGlobal('window', {
    localStorage: {
      getItem: () => {
        throw new Error('storage disabled')
      },
    },
    matchMedia: () => ({
      matches: dark,
      addEventListener: (_: string, handler: () => void) => {
        onChange = handler
      },
      removeEventListener: mock(),
    }),
  })
})
afterEach(restoreGlobals)

describe('theme with unavailable storage', () => {
  it('still applies the OS theme before first paint', () => {
    Function(THEME_INIT_SCRIPT)()
    expect(classes.has('dark')).toBe(true)
  })
  it('keeps an explicit visit-only choice when the OS changes', () => {
    applyTheme('light')
    const stop = watchSystemTheme()
    onChange()
    expect(classes.has('light')).toBe(true)
    stop()
  })
  it('follows OS changes in auto mode', () => {
    applyTheme('auto')
    const stop = watchSystemTheme()
    dark = false
    onChange()
    expect(classes.has('light')).toBe(true)
    stop()
  })
})
