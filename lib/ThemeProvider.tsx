'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME,
  THEME_COLOR,
  THEME_STORAGE_KEY,
  resolveInitialTheme,
  type Theme,
} from './theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The choice still applies for this session when storage is blocked.
  }
}

function syncDocumentTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setActiveTheme] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    // The bootstrap script already painted the right theme; this just catches React up.
    const initializationTimer = setTimeout(() => {
      setActiveTheme(resolveInitialTheme(readStoredTheme()))
    }, 0)

    return () => clearTimeout(initializationTimer)
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => {
    setActiveTheme(nextTheme)
    persistTheme(nextTheme)
    syncDocumentTheme(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setActiveTheme(current => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      persistTheme(next)
      syncDocumentTheme(next)
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
