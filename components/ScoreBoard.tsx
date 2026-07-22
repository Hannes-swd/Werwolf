'use client'
import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useT } from '@/lib/i18n'
import { UiIcon } from './icons'

export interface PlayerScore {
  playerId: string
  playerName: string
  score: number
}

interface Props {
  scores: PlayerScore[]
  myId: string
}

export default function ScoreBoard({ scores, myId }: Props) {
  const t = useT()
  const sorted = [...scores].sort((a, b) => b.score - a.score)
  const listRef = useRef<HTMLUListElement>(null)
  const previousOrderRef = useRef<string[]>([])
  const orderKey = sorted.map(player => player.playerId).join('|')

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) {
      previousOrderRef.current = []
      return
    }

    const previousOrder = previousOrderRef.current
    const currentOrder = orderKey ? orderKey.split('|') : []
    previousOrderRef.current = currentOrder

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-score-row]')
        const entering: HTMLElement[] = []

        rows.forEach((row, index) => {
          const playerId = row.dataset.playerId
          const previousIndex = playerId ? previousOrder.indexOf(playerId) : -1

          if (previousIndex === -1) {
            entering.push(row)
            return
          }

          if (previousIndex !== index) {
            const rowStep = row.getBoundingClientRect().height + 6
            gsap.fromTo(
              row,
              { y: (previousIndex - index) * rowStep },
              { y: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' },
            )
          }
        })

        if (entering.length > 0) {
          gsap.fromTo(
            entering,
            { autoAlpha: 0, x: -16 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.38,
              stagger: 0.06,
              ease: 'power3.out',
              clearProps: 'transform,opacity,visibility',
            },
          )
        }
      })
    }, list)

    return () => {
      media.revert()
      context.revert()
    }
  }, [orderKey])

  if (sorted.length === 0) return null

  const medalColors = ['text-amber-300', 'text-slate-300', 'text-orange-400']

  return (
    <div className="ww-scoreboard space-y-2">
      <p className="ww-section-label text-gray-400 text-xs uppercase tracking-wider">{t('components.scoreBoard.title')}</p>
      <ul ref={listRef} className="space-y-1.5" aria-label={t('components.scoreBoard.ariaLabel')}>
        {sorted.map((p, i) => (
          <li
            key={p.playerId}
            data-score-row
            data-player-id={p.playerId}
            className={`ww-score-row flex items-center gap-3 px-4 py-3 rounded-xl border
              ${p.playerId === myId ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'}`}
          >
            <span className={`flex w-6 items-center justify-center text-sm font-semibold ${medalColors[i] ?? 'text-gray-500'}`}>
              {i < 3 ? (
                <UiIcon name="medal" size={20} strokeWidth={1.8} label={t('components.scoreBoard.place', { place: i + 1 })} />
              ) : (
                <span aria-label={t('components.scoreBoard.place', { place: i + 1 })}>{i + 1}.</span>
              )}
            </span>
            <span className="flex-1 text-white font-medium">{p.playerName}</span>
            <span
              className={`ww-status-chip flex items-center gap-1.5 font-bold text-sm ${p.score > 0 ? 'text-yellow-400' : 'text-gray-500'}`}
              aria-label={t('components.scoreBoard.points', { count: p.score })}
            >
              <UiIcon name="coins" size={15} strokeWidth={1.8} />
              {p.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
