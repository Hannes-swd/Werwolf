'use client'
import { GameEvent } from '@/types/game'

interface Props {
  events: GameEvent[]
}

const EVENT_ICONS: Record<string, string> = {
  death: '💀',
  heal: '💚',
  poison: '☠️',
  vote: '🗳️',
  bless: '✨',
  peek_caught: '👁️',
  win: '🏆',
  mayor_elected: '👑',
  mayor_passed: '👑',
  fool_revealed: '🃏',
}

export default function GameLog({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div className="bg-black/40 rounded-2xl p-4 space-y-2">
      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Ereignisse</h3>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {[...events].reverse().map(e => (
          <li key={e.id} className="flex gap-2 text-sm">
            <span className="flex-shrink-0">{EVENT_ICONS[e.eventType] ?? '•'}</span>
            <span className="text-gray-300">{e.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
