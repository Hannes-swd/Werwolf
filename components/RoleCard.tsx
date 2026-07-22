'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Eye, Sparkles } from 'lucide-react'
import type { Role } from '@/types/game'
import { useT } from '@/lib/i18n'
import { RoleIcon, UiIcon, WolfMark } from './icons'

interface Props {
  role: Role
  playerName: string
  isMayor?: boolean
  revealed?: boolean
  onReveal?: () => void
}

export default function RoleCard({ role, playerName, isMayor, revealed = true, onReveal }: Props) {
  const t = useT()
  const sceneRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!revealed) return
    const focusFrame = window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(focusFrame)
  }, [revealed])

  useLayoutEffect(() => {
    const scene = sceneRef.current
    const inner = innerRef.current
    if (!scene || !inner) return

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(inner, { rotateY: revealed ? 180 : 0 })
        gsap.set('[data-role-detail], [data-role-icon]', { clearProps: 'all' })
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        if (!revealed) {
          gsap.set(inner, { rotateY: 0 })
          gsap.fromTo(
            scene,
            { autoAlpha: 0, y: 24, scale: 0.96 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.62, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
          )
          return
        }

        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .to(inner, { rotateY: 180, duration: 0.72, ease: 'power3.inOut' })
          .fromTo(
            '[data-role-icon]',
            { autoAlpha: 0, rotate: -7, scale: 0.72 },
            { autoAlpha: 1, rotate: 0, scale: 1, duration: 0.48, ease: 'back.out(1.6)', clearProps: 'transform,opacity,visibility' },
            '-=0.28',
          )
          .fromTo(
            '[data-role-detail]',
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.05, clearProps: 'transform,opacity,visibility' },
            '-=0.3',
          )
      })
    }, scene)

    return () => {
      media.revert()
      context.revert()
    }
  }, [revealed])

  return (
    <div ref={sceneRef} className="ww-card-scene mx-auto w-full max-w-sm">
      <div ref={innerRef} className="ww-card-inner">
        <button
          type="button"
          className="ww-role-card-back ww-panel"
          onClick={() => !revealed && onReveal?.()}
          disabled={revealed || !onReveal}
          aria-label={t('components.roleCard.revealLabel')}
          aria-hidden={revealed}
          tabIndex={revealed ? -1 : 0}
        >
          <span className="ww-role-seal" aria-hidden="true">
            <WolfMark size={54} strokeWidth={1.25} />
          </span>
          <span className="ww-section-label">{t('components.roleCard.private')}</span>
          <strong className="font-display text-2xl text-[var(--ww-text)]">{t('components.roleCard.secretRole')}</strong>
          <span className="flex items-center gap-2 text-sm text-[var(--ww-text-muted)]">
            <Eye aria-hidden="true" size={16} />
            {t('components.roleCard.tapToReveal')}
          </span>
        </button>

        <article
          data-role={role}
          className="ww-role-card ww-panel"
          aria-hidden={!revealed}
        >
          <Sparkles className="ww-card-ornament" aria-hidden="true" size={18} />
          <p data-role-detail className="ww-section-label">{t('components.roleCard.youAre')}</p>
          <div data-role-icon className="ww-role-icon mx-auto mt-4" data-role={role} aria-hidden="true">
            <RoleIcon role={role} size={58} strokeWidth={1.35} />
          </div>
          <h2
            ref={titleRef}
            data-role-detail
            tabIndex={-1}
            className="mt-4 font-display text-4xl text-[var(--ww-text)]"
          >
            {t(`roles.${role}`)}
          </h2>
          {isMayor && (
            <div data-role-detail className="ww-status-chip is-gold mx-auto mt-2 flex w-fit items-center gap-1.5">
              <UiIcon name="crown" size={15} strokeWidth={1.9} />
              <span>{t('components.roleCard.mayor')}</span>
            </div>
          )}
          <p data-role-detail className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-[var(--ww-text-muted)]">{t(`components.roleCard.descriptions.${role}`)}</p>
          <div data-role-detail className="ww-surface-strong mt-5 p-3">
            <p className="ww-section-label">{t('components.roleCard.player')}</p>
            <p className="mt-1 font-semibold text-[var(--ww-text)]">{playerName}</p>
          </div>
        </article>
      </div>
    </div>
  )
}
