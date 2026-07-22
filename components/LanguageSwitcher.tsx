'use client'

import { useId } from 'react'
import { ChevronDown, Languages } from 'lucide-react'
import {
  LOCALE_DIRECTION,
  LOCALE_NATIVE_NAMES,
  SUPPORTED_LOCALES,
  isLocale,
  useLanguage,
  useT,
} from '@/lib/i18n'

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const selectId = useId()
  const t = useT()
  const { locale, setLocale, isTransitioning } = useLanguage()

  return (
    <div
      className={`ww-language-switcher relative inline-flex min-h-11 items-center rounded-xl border border-[var(--ww-border)] bg-white/90 shadow-[0_8px_24px_rgb(35_48_74/0.08)] backdrop-blur-xl ${className}`}
      title={t('language.label')}
    >
      <Languages className="pointer-events-none absolute start-3 text-[var(--ww-ember)]" aria-hidden="true" size={16} />
      <label className="sr-only" htmlFor={selectId}>{t('language.groupLabel')}</label>
      <select
        id={selectId}
        value={locale}
        disabled={isTransitioning}
        aria-label={t('language.groupLabel')}
        aria-busy={isTransitioning}
        onChange={event => {
          if (isLocale(event.target.value)) setLocale(event.target.value)
        }}
        className="min-h-11 w-40 appearance-none rounded-xl bg-transparent py-2 pe-9 ps-10 text-sm font-semibold text-[var(--ww-text)] outline-none transition-colors hover:bg-[var(--ww-surface-hover)] disabled:cursor-wait disabled:opacity-60"
      >
        {SUPPORTED_LOCALES.map(option => (
          <option key={option} value={option} dir={LOCALE_DIRECTION[option]} className="bg-white text-[var(--ww-text)]">
            {LOCALE_NATIVE_NAMES[option]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 text-[var(--ww-text-subtle)]" aria-hidden="true" size={15} />
    </div>
  )
}
