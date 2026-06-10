'use client'
import { motion } from 'framer-motion'

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
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  if (sorted.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-2">
      <p className="text-gray-400 text-xs uppercase tracking-wider">Wartespiel – Bestenliste</p>
      <ul className="space-y-1.5">
        {sorted.map((p, i) => (
          <motion.li
            key={p.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border
              ${p.playerId === myId ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'}`}
          >
            <span className="text-lg w-6 text-center">{medals[i] ?? `${i + 1}.`}</span>
            <span className="flex-1 text-white font-medium">{p.playerName}</span>
            <span className={`font-bold text-sm ${p.score > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
              🪙 {p.score}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
