'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { gsap } from 'gsap'
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALE_DIRECTION,
  LOCALE_STORAGE_KEY,
  resolveInitialLocale,
  translate,
  type Locale,
  type TextDirection,
  type Translator,
} from './translations'

interface LanguageContextValue {
  locale: Locale
  direction: TextDirection
  isTransitioning: boolean
  setLocale: (locale: Locale) => void
  t: Translator
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLocale(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // The selected locale still works for this session when storage is unavailable.
  }
}

function syncDocumentLocale(locale: Locale) {
  document.documentElement.lang = HTML_LANG[locale]
  document.documentElement.dir = LOCALE_DIRECTION[locale]
  document.documentElement.dataset.locale = locale
  document.title = translate(locale, 'metadata.title')
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    translate(locale, 'metadata.description'),
  )
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const activeLocaleRef = useRef<Locale>(DEFAULT_LOCALE)
  const pendingLocaleRef = useRef<Locale>(DEFAULT_LOCALE)
  const transitionContextRef = useRef<gsap.Context | null>(null)
  const [locale, setActiveLocale] = useState<Locale>(DEFAULT_LOCALE)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const commitLocale = useCallback((nextLocale: Locale) => {
    activeLocaleRef.current = nextLocale
    pendingLocaleRef.current = nextLocale
    setActiveLocale(nextLocale)
    syncDocumentLocale(nextLocale)
  }, [])

  useEffect(() => {
    // The server and first client render stay English; a saved choice is applied after hydration.
    const initializationTimer = setTimeout(() => {
      commitLocale(resolveInitialLocale(readStoredLocale()))
    }, 0)

    return () => clearTimeout(initializationTimer)
  }, [commitLocale])

  useEffect(() => () => {
    transitionContextRef.current?.revert()
  }, [])

  const setLocale = useCallback((nextLocale: Locale) => {
    persistLocale(nextLocale)
    if (nextLocale === pendingLocaleRef.current) return

    pendingLocaleRef.current = nextLocale
    transitionContextRef.current?.revert()

    const content = contentRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!content || reduceMotion) {
      commitLocale(nextLocale)
      setIsTransitioning(false)
      return
    }

    setIsTransitioning(true)
    transitionContextRef.current = gsap.context(() => {
      gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => setIsTransitioning(false),
      })
        .to(content, { autoAlpha: 0, y: -8, duration: 0.16, ease: 'power2.in' })
        .add(() => commitLocale(nextLocale))
        .set(content, { y: 10 })
        .to(content, {
          autoAlpha: 1,
          y: 0,
          duration: 0.24,
          clearProps: 'opacity,visibility,transform',
        })
    }, content)
  }, [commitLocale])

  const t = useCallback<Translator>(
    (key, params) => translate(locale, key, params),
    [locale],
  )

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    direction: LOCALE_DIRECTION[locale],
    isTransitioning,
    setLocale,
    t,
  }), [isTransitioning, locale, setLocale, t])

  return (
    <LanguageContext.Provider value={value}>
      <div
        ref={contentRef}
        className="flex min-h-dvh flex-1 flex-col"
        data-language-content
        data-locale={locale}
        dir={LOCALE_DIRECTION[locale]}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

export function useT() {
  return useLanguage().t
}
