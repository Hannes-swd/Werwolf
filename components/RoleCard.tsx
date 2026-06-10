'use client'
import { motion } from 'framer-motion'
import { Role, ROLE_LABELS, ROLE_ICONS } from '@/types/game'

const ROLE_DESC: Record<Role, string> = {
  villager: 'Finde die Werwölfe und stimme sie ab.',
  werewolf: 'Töte jede Nacht einen Dorfbewohner. Bleibe unentdeckt.',
  witch: 'Du hast einen Heil- und einen Gifttrank (je 1×).',
  seer: 'Jede Nacht siehst du die Rolle eines Spielers.',
  hunter: 'Wenn du stirbst, schießt du noch jemanden.',
  amor: 'Verbinde in Runde 1 zwei Spieler als Liebespaar.',
  fool: 'Wirst du abgestimmt, überlebst du – verlierst aber dein Stimmrecht.',
  girl: 'Kannst in der Wolf-Phase riskant spähen.',
  priest: 'Segne 1× einen Spieler – er ist diese Nacht geschützt.',
}

const ROLE_COLORS: Record<Role, string> = {
  villager: 'from-green-900 to-green-800 border-green-600',
  werewolf: 'from-red-950 to-red-900 border-red-600',
  witch: 'from-purple-950 to-purple-900 border-purple-600',
  seer: 'from-blue-950 to-blue-900 border-blue-600',
  hunter: 'from-orange-950 to-orange-900 border-orange-600',
  amor: 'from-pink-950 to-pink-900 border-pink-500',
  fool: 'from-yellow-950 to-yellow-900 border-yellow-600',
  girl: 'from-teal-950 to-teal-900 border-teal-600',
  priest: 'from-indigo-950 to-indigo-900 border-indigo-600',
}

interface Props {
  role: Role
  playerName: string
  isMayor?: boolean
}

export default function RoleCard({ role, playerName, isMayor }: Props) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className={`bg-gradient-to-b ${ROLE_COLORS[role]} border-2 rounded-2xl p-6 text-center shadow-2xl max-w-sm mx-auto`}
    >
      <p className="text-gray-400 text-sm mb-1">Du bist</p>
      <div className="text-6xl mb-3">{ROLE_ICONS[role]}</div>
      <h2 className="text-3xl font-bold text-white mb-1">{ROLE_LABELS[role].toUpperCase()}</h2>
      {isMayor && (
        <div className="flex items-center justify-center gap-1 mt-1 mb-2">
          <span className="text-yellow-400 text-sm font-semibold">👑 Bürgermeister</span>
        </div>
      )}
      <p className="text-gray-300 text-sm mt-3 leading-relaxed">{ROLE_DESC[role]}</p>
      <div className="mt-4 bg-black/30 rounded-xl p-3">
        <p className="text-gray-400 text-xs">Spieler</p>
        <p className="text-white font-semibold">{playerName}</p>
      </div>
    </motion.div>
  )
}
