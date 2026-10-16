export type ThemeMode = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Applies a theme mode to <html>. Self-contained on purpose: `THEME_INIT_SCRIPT`
 * below inlines this function's source into <head> so the first paint has the
 * right theme, so it must not reference anything outside its own body.
 */
export function applyTheme(mode: ThemeMode): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  if (mode === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
  root.style.colorScheme = resolved
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark'
}

export function readStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isThemeMode(stored) ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

export function setTheme(mode: ThemeMode): void {
  applyTheme(mode)
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Private mode / storage disabled - the theme still applies for this visit.
  }
}

/** Re-applies the theme when the OS setting changes while in "auto" mode. */
export function watchSystemTheme(): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (!document.documentElement.hasAttribute('data-theme')) applyTheme('auto')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * Inline <head> script: reads the stored mode and applies it before first
 * paint. Derived from `applyTheme` so the two can't drift.
 */
export const THEME_INIT_SCRIPT = `(function(){var m='auto';try{var s=window.localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});m=(s==='light'||s==='dark'||s==='auto')?s:'auto';}catch(e){}(${applyTheme.toString()})(m);})();`
