'use client'
import { useState } from 'react'
import { Player, Vote } from '@/types/game'
import PlayerList from './PlayerList'

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
    await onVote(id)
    setLoading(false)
  }

  const title =
    voteType === 'mayor_election'
      ? '👑 Bürgermeisterwahl'
      : voteType === 'tiebreaker'
      ? '⚖️ Gleichstand – Bürgermeister entscheidet'
      : '🗳️ Abstimmung'

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold text-center">{title}</h3>

      <div className="bg-white/5 rounded-xl px-4 py-2 text-center">
        <span className="text-gray-400 text-sm">Abgestimmt: </span>
        <span className="text-white font-semibold">{castVotes} / {totalVoters}</span>
      </div>

      {!canVote && (
        <div className="bg-orange-900/30 border border-orange-700 rounded-xl px-4 py-3 text-center">
          <p className="text-orange-300 text-sm">Du hast kein Stimmrecht (Dorfdepp)</p>
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
                disabled={alreadyVoted || !canVote || loading}
                onClick={() => handleVote(p.id)}
                className={`w-full px-4 py-3 rounded-xl border transition-all text-left
                  ${isSelected ? 'bg-white/20 border-white' : 'bg-white/5 border-white/15 hover:bg-white/10 active:scale-95'}
                  ${(alreadyVoted && !isSelected) ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{p.displayName}</span>
                    {p.isMayor && <span className="text-yellow-400 text-sm">👑</span>}
                  </div>
                  {votesVisible && count > 0 && (
                    <span className="text-gray-300 text-sm font-semibold">{count}</span>
                  )}
                  {isSelected && <span className="text-white">✓</span>}
                </div>
                {votesVisible && count > 0 && (
                  <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all"
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
        <p className="text-center text-gray-400 text-sm">Warten auf alle Stimmen...</p>
      )}
    </div>
  )
}
