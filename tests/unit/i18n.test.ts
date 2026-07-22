import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALE_DIRECTION,
  SUPPORTED_LOCALES,
  parseLocale,
  resolveInitialLocale,
  translate,
  translations,
} from '@/lib/i18n/translations'

function flattenStrings(value: unknown, prefix = ''): Map<string, string> {
  const result = new Map<string, string>()
  if (!value || typeof value !== 'object') return result

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') result.set(path, child)
    else flattenStrings(child, path).forEach((text, childPath) => result.set(childPath, text))
  }

  return result
}

function placeholders(value: string) {
  return [...value.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort()
}

describe('i18n translations', () => {
  it('supports the complete locale contract in the expected order', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'de', 'es', 'fr', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'])
  })

  it('keeps identical, non-empty key coverage and placeholders in every locale', () => {
    const reference = flattenStrings(translations.en)
    const referenceKeys = [...reference.keys()].sort()

    for (const locale of SUPPORTED_LOCALES) {
      const candidate = flattenStrings(translations[locale])
      expect([...candidate.keys()].sort(), locale).toEqual(referenceKeys)

      for (const key of referenceKeys) {
        const candidateValue = candidate.get(key)
        expect(candidateValue?.trim().length, `${locale}:${key}`).toBeGreaterThan(0)
        expect(placeholders(candidateValue ?? ''), `${locale}:${key}`).toEqual(placeholders(reference.get(key) ?? ''))
      }
    }
  })

  it('interpolates named values and leaves missing values visible', () => {
    expect(translate('de', 'lobby.copyCodeLabel', { code: 'ABC123' })).toBe('Lobby-Code ABC123 kopieren')
    expect(translate('en', 'lobby.kickPlayerLabel', { name: 'Alex' })).toBe('Remove Alex from the lobby')
    expect(translate('en', 'lobby.kickPlayerLabel')).toContain('{{name}}')
  })

  it('uses English on first visit and only accepts a valid stored locale', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    expect(resolveInitialLocale(null)).toBe('en')
    expect(resolveInitialLocale(undefined)).toBe('en')
    expect(resolveInitialLocale('unknown')).toBe('en')
    expect(resolveInitialLocale('ar')).toBe('ar')
    expect(resolveInitialLocale('de-DE')).toBe('de')
    expect(parseLocale('pt-BR')).toBe('pt')
  })

  it('maps Arabic to RTL while every other locale remains LTR', () => {
    expect(HTML_LANG.ar).toBe('ar')
    expect(LOCALE_DIRECTION.ar).toBe('rtl')

    for (const locale of SUPPORTED_LOCALES.filter(locale => locale !== 'ar')) {
      expect(LOCALE_DIRECTION[locale], locale).toBe('ltr')
    }
  })
})
