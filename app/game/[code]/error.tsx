'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CircleAlert, House, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n'

export default function GameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT()
  useEffect(() => {
    console.error('[GamePage] React error boundary caught:', error.message, error.stack, error.digest)
  }, [error])

  return (
    <main className="app-shell flex min-h-dvh items-center justify-center px-4 py-10 text-center">
      <section className="ww-panel w-full max-w-md p-6" aria-labelledby="game-error-title">
        <span className="ww-orbit-icon mx-auto is-danger">
          <CircleAlert aria-hidden="true" size={26} />
        </span>
        <p className="ww-section-label mt-5">{t('components.error.eyebrow')}</p>
        <h1 id="game-error-title" className="mt-1 font-display text-3xl text-[var(--ww-text)]">{t('components.error.title')}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--ww-text-muted)]">
          {t('components.error.description')}
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={reset} className="ww-button ww-button-primary w-full">
            <RotateCcw aria-hidden="true" />
            {t('components.error.retry')}
          </button>
          <Link href="/" className="ww-button ww-button-secondary w-full">
            <House aria-hidden="true" />
            {t('components.error.home')}
          </Link>
        </div>
      </section>
    </main>
  )
}
