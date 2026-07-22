'use client'
import { useState } from 'react'
import type { Player, Vote } from '@/types/game'
import { useT } from '@/lib/i18n'
import { UiIcon } from './icons'
import type { UiIconName } from './icons'

interface Props {
  players: Player[]
  myId: string
  votes: Vote[]
  votesVisible: boolean
  voteType: 'mayor_election' | 'day_elimination' | 'tiebreaker'
  onVote: (targetId: string) => Promise<void>
  myVote?: string | null
}

export default function VotePanel({ players, myId, votes, votesVisible, voteType, onVote, myVote }: Props) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const alivePlayers = players.filter(p => p.isAlive && p.id !== myId)
  const me = players.find(p => p.id === myId)

  const canVote = me?.canVote ?? true
  const alreadyVoted = !!myVote

  const voteCounts = new Map<string, number>()
  if (votesVisible) {
    votes.forEach(v => voteCounts.set(v.targetId, (voteCounts.get(v.targetId) ?? 0) + 1))
  }

  const totalVoters = players.filter(p => p.isAlive && (voteType === 'mayor_election' || p.canVote)).length
  const castVotes = votes.length

  async function handleVote(id: string) {
    if (alreadyVoted || !canVote || loading) return
    setLoading(true)
    try {
      await onVote(id)
    } finally {
      setLoading(false)
    }
  }

  const title: { icon: UiIconName; label: string } = voteType === 'mayor_election'
    ? { icon: 'crown', label: t('components.vote.mayorElection') }
    : voteType === 'tiebreaker'
      ? { icon: 'scale', label: t('components.vote.tiebreaker') }
      : { icon: 'vote', label: t('components.vote.vote') }

  return (
    <div className="ww-vote-panel space-y-4">
      <h3 className="ww-section-label flex items-center justify-center gap-2 text-center font-semibold text-white">
        <UiIcon name={title.icon} size={18} strokeWidth={1.8} />
        <span>{title.label}</span>
      </h3>

      <div className="ww-surface bg-white/5 rounded-xl px-4 py-2 text-center" aria-live="polite">
        <span className="text-gray-400 text-sm">{t('components.vote.cast', { cast: castVotes, total: totalVoters })}</span>
      </div>

      {!canVote && (
        <div className="bg-orange-900/30 border border-orange-700 rounded-xl px-4 py-3 text-center">
          <p className="text-orange-300 text-sm">{t('components.vote.noVote')}</p>
        </div>
      )}

      <ul className="space-y-2">
        {alivePlayers.map(p => {
          const count = voteCounts.get(p.id) ?? 0
          const isSelected = myVote === p.id
          const maxVotes = Math.max(...Array.from(voteCounts.values()), 1)

          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={alreadyVoted || !canVote || loading}
                onClick={() => handleVote(p.id)}
                aria-pressed={isSelected}
                data-state={isSelected ? 'selected' : 'idle'}
                data-selected={isSelected ? '' : undefined}
                className={`ww-player-row w-full px-4 py-3 rounded-xl border transition-all text-left
                  ${isSelected ? 'bg-white/20 border-white' : 'bg-white/5 border-white/15 hover:bg-white/10 active:scale-95'}
                  ${(alreadyVoted && !isSelected) ? 'opacity-60' : ''}
                `}
              >
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 truncate text-white font-medium">{p.displayName}</span>
                    {p.isMayor && (
                      <UiIcon name="crown" size={15} strokeWidth={1.9} label={t('components.vote.mayor')} className="shrink-0 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {votesVisible && count > 0 && (
                      <span className="ww-status-chip text-gray-300 text-sm font-semibold">{count}</span>
                    )}
                    {isSelected && (
                      <UiIcon name="check" size={18} strokeWidth={2.2} label={t('components.vote.yourVote')} className="text-white" />
                    )}
                  </div>
                </div>
                {votesVisible && count > 0 && (
                  <div className="ww-progress-track mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden" aria-hidden="true">
                    <div
                      className="ww-progress-fill h-full origin-left bg-white/60 rounded-full transition-all"
                      style={{ width: `${(count / maxVotes) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {alreadyVoted && (
        <p className="text-center text-gray-400 text-sm">{t('components.vote.waiting')}</p>
      )}
    </div>
  )
}
