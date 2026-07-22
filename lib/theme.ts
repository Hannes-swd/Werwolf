export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'werwolf_theme'

// Matches the page background so the browser chrome does not flash a stale colour.
export const THEME_COLOR: Record<Theme, string> = {
  dark: '#14100d',
  light: '#f5f0e8',
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function resolveInitialTheme(stored: string | null | undefined): Theme {
  return isTheme(stored) ? stored : DEFAULT_THEME
}

/*
 * Runs before first paint so a saved light theme never flashes dark. Kept as a
 * string because it has to be inlined into the document head.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!==${JSON.stringify('light')}&&t!==${JSON.stringify('dark')})t=${JSON.stringify(DEFAULT_THEME)};document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t===${JSON.stringify('light')}?${JSON.stringify(THEME_COLOR.light)}:${JSON.stringify(THEME_COLOR.dark)});}catch(e){document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_THEME)};}})();`
