import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  THEMES,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_COLOR,
  THEME_STORAGE_KEY,
  isTheme,
  resolveInitialTheme,
} from '@/lib/theme'

const projectFile = (pathname: string) => resolve(process.cwd(), pathname)

describe('theme', () => {
  it('ships dark and light, with dark as the default', () => {
    expect(THEMES).toEqual(['dark', 'light'])
    expect(DEFAULT_THEME).toBe('dark')
  })

  it('falls back to dark for anything unrecognised', () => {
    expect(resolveInitialTheme(null)).toBe('dark')
    expect(resolveInitialTheme(undefined)).toBe('dark')
    expect(resolveInitialTheme('')).toBe('dark')
    expect(resolveInitialTheme('sepia')).toBe('dark')
    expect(resolveInitialTheme('light')).toBe('light')
    expect(resolveInitialTheme('dark')).toBe('dark')
  })

  it('only accepts the two supported values', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('light')).toBe(true)
    expect(isTheme('system')).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('keeps the browser chrome colour in step with each theme', () => {
    expect(THEME_COLOR.dark).toBe('#14100d')
    expect(THEME_COLOR.light).toBe('#f5f0e8')

    const css = readFileSync(projectFile('app/globals.css'), 'utf8')
    expect(css).toContain(`--ww-bg: light-dark(${THEME_COLOR.light}, ${THEME_COLOR.dark})`)
  })

  it('reads the saved theme before paint and never throws', () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain(THEME_STORAGE_KEY)
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('document.documentElement.dataset.theme')
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('catch')

    // Storage can be blocked, so the script has to still settle on the default.
    const blocked = {
      localStorage: {
        getItem() { throw new Error('blocked') },
      },
    }
    for (const [stored, expected] of [[null, 'dark'], ['light', 'light'], ['nonsense', 'dark']] as const) {
      const root = { dataset: {} as Record<string, string> }
      const run = new Function('document', 'localStorage', THEME_BOOTSTRAP_SCRIPT)
      run(
        { documentElement: root, querySelector: () => null },
        { getItem: () => stored },
      )
      expect(root.dataset.theme).toBe(expected)
    }

    const root = { dataset: {} as Record<string, string> }
    const run = new Function('document', 'localStorage', THEME_BOOTSTRAP_SCRIPT)
    run({ documentElement: root, querySelector: () => null }, blocked.localStorage)
    expect(root.dataset.theme).toBe(DEFAULT_THEME)
  })

  it('drives both palettes from one color-scheme switch', () => {
    const css = readFileSync(projectFile('app/globals.css'), 'utf8')
    expect(css).toMatch(/:root\s*{\s*color-scheme:\s*dark;\s*}/)
    expect(css).toMatch(/:root\[data-theme="light"\]\s*{\s*color-scheme:\s*light;\s*}/)
    // Every themed colour has to resolve through light-dark(), not a bare literal.
    expect(css.split('light-dark(').length - 1).toBeGreaterThan(100)
  })
})
