'use client'
import type { GameEvent } from '@/types/game'
import { useT } from '@/lib/i18n'
import { EventIcon } from './icons'

interface Props {
  events: GameEvent[]
}

export default function GameLog({ events }: Props) {
  const t = useT()
  if (events.length === 0) return null

  return (
    <div className="ww-surface ww-game-log bg-black/40 rounded-2xl p-4 space-y-2">
      <h3 className="ww-section-label text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">{t('components.gameLog.title')}</h3>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto" aria-label={t('components.gameLog.ariaLabel')}>
        {[...events].reverse().map(e => (
          <li key={e.id} className="ww-log-row flex items-start gap-2.5 text-sm">
            <EventIcon eventType={e.eventType} size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <span className="text-gray-300">{e.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
