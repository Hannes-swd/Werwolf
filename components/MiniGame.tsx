'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type TileType = 'coin' | 'bomb' | 'star'

interface Tile {
  id: number
  cell: number
  type: TileType
}

const TILE_CONFIG: Record<TileType, { emoji: string; points: number; color: string }> = {
  coin: { emoji: '🪙', points: 1,  color: 'bg-yellow-500/80 border-yellow-400' },
  bomb: { emoji: '💣', points: -2, color: 'bg-red-600/80 border-red-500' },
  star: { emoji: '⭐', points: 3,  color: 'bg-purple-500/80 border-purple-400' },
}

const GRID_SIZE = 12 // 4 columns × 3 rows

function randomType(): TileType {
  const r = Math.random()
  if (r < 0.08) return 'star'
  if (r < 0.38) return 'bomb'
  return 'coin'
}

interface Props {
  score: number
  onScore: (delta: number) => void
  active: boolean // false during player's own turn
}

export default function MiniGame({ score, onScore, active }: Props) {
  const [tile, setTile] = useState<Tile | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null)
  const [missed, setMissed] = useState(false)
  const tileIdRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spawnTile = useCallback(() => {
    if (!active) return
    const cell = Math.floor(Math.random() * GRID_SIZE)
    const type = randomType()
    const id = ++tileIdRef.current
    setTile({ id, cell, type })
    setMissed(false)

    // Tile disappears after 1.5s if not clicked
    timeoutRef.current = setTimeout(() => {
      setTile(prev => (prev?.id === id ? null : prev))
      setMissed(true)
      setTimeout(() => setMissed(false), 600)
    }, 1500)
  }, [active])

  useEffect(() => {
    if (!active) { setTile(null); return }

    function schedule() {
      const delay = 2000 + Math.random() * 1000 // 2–3s
      intervalRef.current = setTimeout(() => {
        spawnTile()
        schedule()
      }, delay)
    }

    // First tile after 1s
    const first = setTimeout(() => { spawnTile(); schedule() }, 1000)

    return () => {
      clearTimeout(first)
      if (intervalRef.current) clearTimeout(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setTile(null)
    }
  }, [active, spawnTile])

  function handleClick(t: Tile) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setTile(null)
    const cfg = TILE_CONFIG[t.type]
    onScore(cfg.points)
    setFeedback({
      text: cfg.points > 0 ? `+${cfg.points}` : `${cfg.points}`,
      color: cfg.points > 0 ? 'text-green-400' : 'text-red-400',
    })
    setTimeout(() => setFeedback(null), 700)
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Wartespiel</p>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {feedback && (
              <motion.span
                key={feedback.text + Date.now()}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -12 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className={`text-sm font-bold ${feedback.color}`}
              >
                {feedback.text}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-white font-bold text-sm">🪙 {score}</span>
        </div>
      </div>

      {!active && (
        <p className="text-gray-600 text-xs text-center py-1">Pausiert – du bist dran</p>
      )}

      {/* 4×3 grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: GRID_SIZE }).map((_, i) => {
          const isActive = tile?.cell === i
          const cfg = tile ? TILE_CONFIG[tile.type] : null
          return (
            <AnimatePresence key={i}>
              {isActive && cfg ? (
                <motion.button
                  key={tile!.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => handleClick(tile!)}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xl ${cfg.color} active:scale-90 transition-transform`}
                >
                  {cfg.emoji}
                </motion.button>
              ) : (
                <div
                  key={`empty-${i}`}
                  className={`aspect-square rounded-xl border ${missed && tile?.cell === i ? 'border-white/20 bg-white/5' : 'border-white/5 bg-white/[0.03]'}`}
                />
              )}
            </AnimatePresence>
          )
        })}
      </div>

      <p className="text-gray-600 text-xs text-center">
        🪙 +1 &nbsp; ⭐ +3 &nbsp; 💣 -2
      </p>
    </div>
  )
}
