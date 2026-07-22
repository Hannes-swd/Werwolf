'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/ThemeProvider'
import { useT } from '@/lib/i18n'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useT()
  const { theme, toggleTheme } = useTheme()
  const rootRef = useRef<HTMLButtonElement>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const incoming = root.querySelector(isDark ? '[data-theme-icon="moon"]' : '[data-theme-icon="sun"]')
        const outgoing = root.querySelector(isDark ? '[data-theme-icon="sun"]' : '[data-theme-icon="moon"]')

        gsap.timeline({ defaults: { duration: 0.32, ease: 'power3.out' } })
          .fromTo(incoming, { autoAlpha: 0, rotate: -70, scale: 0.6 }, { autoAlpha: 1, rotate: 0, scale: 1 }, 0)
          .fromTo(outgoing, { autoAlpha: 1, rotate: 0, scale: 1 }, { autoAlpha: 0, rotate: 70, scale: 0.6 }, 0)
          .fromTo(
            root.querySelector('[data-theme-knob]'),
            { scale: 0.82 },
            { scale: 1, duration: 0.42, ease: 'back.out(2.4)' },
            0,
          )
      }, root)

      return () => context.revert()
    })

    return () => media.revert()
  }, [isDark])

  return (
    <button
      ref={rootRef}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
      title={t('theme.label')}
      onClick={toggleTheme}
      className={`ww-theme-toggle ${className}`}
    >
      <span className="ww-theme-toggle-track" aria-hidden="true">
        <span className="ww-theme-toggle-knob" data-theme-knob>
          <Moon className="ww-theme-icon" data-theme-icon="moon" aria-hidden="true" size={15} />
          <Sun className="ww-theme-icon" data-theme-icon="sun" aria-hidden="true" size={15} />
        </span>
      </span>
    </button>
  )
}
