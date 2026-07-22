'use client'
import type { Player } from '@/types/game'
import { useT } from '@/lib/i18n'
import { RoleIcon, UiIcon } from './icons'

interface Props {
  players: Player[]
  myId?: string
  showRoles?: boolean
  selectable?: boolean
  selectedId?: string | null
  selectedIds?: string[]
  onSelect?: (id: string) => void
  disabledIds?: string[]
}

export default function PlayerList({
  players,
  myId,
  showRoles = false,
  selectable = false,
  selectedId,
  selectedIds = [],
  onSelect,
  disabledIds = [],
}: Props) {
  const t = useT()
  return (
    <ul className="space-y-2 w-full">
      {players.map(p => {
        const isMe = p.id === myId
        const isDead = !p.isAlive
        const isDisabled = isDead || disabledIds.includes(p.id)
        const isSelected = selectedId === p.id || selectedIds.includes(p.id)

        const content = (
          <>
            <div className="relative flex-shrink-0">
              <div aria-hidden="true" className={`ww-player-avatar w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                ${isDead ? 'bg-gray-700 text-gray-500' : 'bg-white/10 text-white'}`}>
                {p.displayName[0].toUpperCase()}
              </div>
              {isDead && (
                <UiIcon
                  name="skull"
                  size={14}
                  strokeWidth={2}
                  label={t('components.playerList.dead')}
                  className="absolute -top-1 -right-1 text-gray-400"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={`font-medium truncate ${isDead ? 'text-gray-500' : 'text-white'}`}>
                  {p.displayName}
                </span>
                {isMe && <span className="shrink-0 text-xs text-gray-400">({t('components.playerList.you')})</span>}
                {p.isMayor && (
                  <UiIcon name="crown" size={15} strokeWidth={1.9} label={t('components.playerList.mayor')} className="shrink-0 text-yellow-400" />
                )}
                {!p.canVote && p.isAlive && (
                  <span className="ww-status-chip max-w-28 shrink-0 truncate text-xs text-orange-400">{t('components.playerList.noVote')}</span>
                )}
              </div>
              {showRoles && p.role && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                  <RoleIcon role={p.role} size={13} strokeWidth={1.8} />
                  <span>{t(`roles.${p.role}`)}</span>
                </p>
              )}
            </div>
            {isSelected && (
              <UiIcon name="check" size={19} strokeWidth={2.2} label={t('components.playerList.selected')} className="flex-shrink-0 text-white" />
            )}
          </>
        )

        return (
          <li key={p.id}>
            {selectable ? (
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelect?.(p.id)}
                aria-pressed={isSelected}
                data-dead={isDead ? '' : undefined}
                data-selected={isSelected ? '' : undefined}
                className={`ww-player-row w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                  ${isDead ? 'opacity-40 bg-gray-900 border-gray-800' : ''}
                  ${isSelected ? 'bg-white/20 border-white' : ''}
                  ${!isDead && !isSelected ? 'bg-white/5 border-white/20 hover:bg-white/10 active:scale-95' : ''}
                `}
              >
                {content}
              </button>
            ) : (
              <div
                data-dead={isDead ? '' : undefined}
                className={`ww-player-row w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left
                  ${isDead ? 'opacity-50 bg-gray-900 border-gray-800' : 'bg-white/5 border-white/10'}
                `}
              >
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
