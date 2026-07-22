'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bomb, Coins, Gamepad2, Star, type LucideIcon } from 'lucide-react'
import { useT } from '@/lib/i18n'

type TileType = 'coin' | 'bomb' | 'star'

interface Tile {
  id: number
  cell: number
  type: TileType
}

interface TileConfig {
  icon: LucideIcon
  points: number
  tone: string
}

const TILE_CONFIG: Record<TileType, TileConfig> = {
  coin: { icon: Coins, points: 1, tone: 'is-coin' },
  bomb: { icon: Bomb, points: -2, tone: 'is-bomb' },
  star: { icon: Star, points: 3, tone: 'is-star' },
}

const GRID_SIZE = 12

function randomType(): TileType {
  const value = Math.random()
  if (value < 0.08) return 'star'
  if (value < 0.38) return 'bomb'
  return 'coin'
}

interface Props {
  score: number
  onScore: (delta: number) => void
  active: boolean
}

export default function MiniGame({ score, onScore, active }: Props) {
  const t = useT()
  const [tile, setTile] = useState<Tile | null>(null)
  const [feedback, setFeedback] = useState<{ id: number; text: string; positive: boolean } | null>(null)
  const [missedCell, setMissedCell] = useState<number | null>(null)
  const tileIdRef = useRef(0)
  const feedbackIdRef = useRef(0)
  const tileRef = useRef<Tile | null>(null)
  const tileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const missedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTileTimeout = useCallback(() => {
    if (tileTimeoutRef.current) clearTimeout(tileTimeoutRef.current)
    tileTimeoutRef.current = null
  }, [])

  const spawnTile = useCallback(() => {
    if (!active) return
    const nextTile: Tile = {
      id: ++tileIdRef.current,
      cell: Math.floor(Math.random() * GRID_SIZE),
      type: randomType(),
    }
    tileRef.current = nextTile
    setTile(nextTile)
    setMissedCell(null)
    clearTileTimeout()

    tileTimeoutRef.current = setTimeout(() => {
      if (tileRef.current?.id !== nextTile.id) return
      tileRef.current = null
      setTile(null)
      setMissedCell(nextTile.cell)
      if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)
      missedTimeoutRef.current = setTimeout(() => setMissedCell(null), 600)
    }, 1500)
  }, [active, clearTileTimeout])

  useEffect(() => {
    if (!active) {
      const resetTimeout = setTimeout(() => {
        tileRef.current = null
        setTile(null)
        setMissedCell(null)
      }, 0)
      return () => clearTimeout(resetTimeout)
    }
    let cancelled = false

    function scheduleNext() {
      const delay = 2000 + Math.random() * 1000
      scheduleTimeoutRef.current = setTimeout(() => {
        if (cancelled) return
        spawnTile()
        scheduleNext()
      }, delay)
    }

    const firstTimeout = setTimeout(() => {
      if (cancelled) return
      spawnTile()
      scheduleNext()
    }, 1000)

    return () => {
      cancelled = true
      clearTimeout(firstTimeout)
      if (scheduleTimeoutRef.current) clearTimeout(scheduleTimeoutRef.current)
      clearTileTimeout()
      tileRef.current = null
    }
  }, [active, clearTileTimeout, spawnTile])

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current)
  }, [])

  function handleClick(clickedTile: Tile) {
    clearTileTimeout()
    tileRef.current = null
    setTile(null)
    const config = TILE_CONFIG[clickedTile.type]
    onScore(config.points)
    const nextFeedback = {
      id: ++feedbackIdRef.current,
      text: config.points > 0 ? `+${config.points}` : `${config.points}`,
      positive: config.points > 0,
    }
    setFeedback(nextFeedback)
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 700)
  }

  const visibleTile = active ? tile : null
  const tileLabels: Record<TileType, string> = {
    coin: t('components.miniGame.tiles.coin'),
    bomb: t('components.miniGame.tiles.bomb'),
    star: t('components.miniGame.tiles.star'),
  }

  return (
    <section className="ww-panel space-y-3" aria-labelledby="watch-game-heading">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-[var(--ww-text-subtle)]" aria-hidden="true" size={16} />
          <h2 id="watch-game-heading" className="ww-section-label">{t('components.miniGame.title')}</h2>
        </div>
        <div className="flex min-h-7 items-center gap-2" aria-label={t('components.miniGame.points', { count: score })}>
          <span className="relative w-8 text-right" aria-live="polite">
            {feedback && (
              <span
                key={feedback.id}
                className={`ww-score-feedback ${feedback.positive ? 'is-positive' : 'is-negative'}`}
              >
                {feedback.text}
              </span>
            )}
          </span>
          <Coins aria-hidden="true" size={16} />
          <strong className="min-w-5 text-sm tabular-nums text-[var(--ww-text)]">{score}</strong>
        </div>
      </div>

      {!active && (
        <p className="rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-center text-xs text-[var(--ww-text-subtle)]" role="status">
          {t('components.miniGame.paused')}
        </p>
      )}

      <div className="grid grid-cols-4 gap-1.5" aria-label={t('components.miniGame.board')}>
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const isActive = visibleTile?.cell === index
          const config = isActive && visibleTile ? TILE_CONFIG[visibleTile.type] : null
          if (isActive && visibleTile && config) {
            const Icon = config.icon
            return (
              <button
                key={visibleTile.id}
                type="button"
                onClick={() => handleClick(visibleTile)}
                className={`ww-rune-tile ${config.tone}`}
                aria-label={t(
                  config.points > 0 ? 'components.miniGame.tileActionGain' : 'components.miniGame.tileActionLose',
                  { label: tileLabels[visibleTile.type], count: Math.abs(config.points) },
                )}
              >
                <Icon aria-hidden="true" size={21} fill={visibleTile.type === 'star' ? 'currentColor' : 'none'} />
              </button>
            )
          }

          return (
            <div
              key={`empty-${index}`}
              aria-hidden="true"
              className={`ww-rune-cell ${missedCell === index ? 'is-missed' : ''}`}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--ww-text-subtle)]" aria-hidden="true">
        {Object.entries(TILE_CONFIG).map(([type, config]) => {
          const Icon = config.icon
          return (
            <span key={type} className="flex items-center gap-1.5">
              <Icon size={13} />
              {config.points > 0 ? '+' : ''}{config.points}
            </span>
          )
        })}
      </div>
    </section>
  )
}
