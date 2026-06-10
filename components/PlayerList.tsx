'use client'
import { Player, ROLE_LABELS } from '@/types/game'

interface Props {
  players: Player[]
  myId?: string
  showRoles?: boolean
  selectable?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
  disabledIds?: string[]
}

export default function PlayerList({
  players,
  myId,
  showRoles = false,
  selectable = false,
  selectedId,
  onSelect,
  disabledIds = [],
}: Props) {
  return (
    <ul className="space-y-2 w-full">
      {players.map(p => {
        const isMe = p.id === myId
        const isDead = !p.isAlive
        const isDisabled = isDead || disabledIds.includes(p.id)
        const isSelected = selectedId === p.id

        return (
          <li key={p.id}>
            <button
              disabled={!selectable || isDisabled}
              onClick={() => !isDisabled && onSelect?.(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                ${isDead ? 'opacity-40 bg-gray-900 border-gray-800' : ''}
                ${isSelected ? 'bg-white/20 border-white' : ''}
                ${!isDead && !isSelected && selectable ? 'bg-white/5 border-white/20 hover:bg-white/10 active:scale-95' : ''}
                ${!isDead && !isSelected && !selectable ? 'bg-white/5 border-white/10' : ''}
              `}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  ${isDead ? 'bg-gray-700 text-gray-500' : 'bg-white/10 text-white'}`}>
                  {p.displayName[0].toUpperCase()}
                </div>
                {isDead && (
                  <span className="absolute -top-1 -right-1 text-xs">💀</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-medium truncate ${isDead ? 'text-gray-500' : 'text-white'}`}>
                    {p.displayName}
                  </span>
                  {isMe && <span className="text-xs text-gray-400">(Du)</span>}
                  {p.isMayor && <span className="text-yellow-400 text-sm">👑</span>}
                  {!p.canVote && p.isAlive && (
                    <span className="text-xs text-orange-400">kein Stimmrecht</span>
                  )}
                </div>
                {showRoles && p.role && (
                  <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[p.role]}</p>
                )}
              </div>
              {isSelected && <span className="text-white text-lg flex-shrink-0">✓</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
