'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LobbyState, loadLobby, saveLobby, loadMyPlayer } from '@/lib/storage'
import { broadcastLobby, subscribeToLobby, BroadcastMsg } from '@/lib/broadcast'
import { startGame } from '@/lib/gameEngine'
import { loadGameState, saveGameState, makeEmptyRound } from '@/lib/storage'
import { broadcastGame } from '@/lib/broadcast'
import AdminPanel from '@/components/AdminPanel'
import { RoleConfig } from '@/types/game'
import { getAutoConfig } from '@/lib/autoConfig'

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [lobby, setLobby] = useState<LobbyState | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)

  const refreshLobby = useCallback(() => {
    const l = loadLobby(code)
    if (l) setLobby(l)
  }, [code])

  useEffect(() => {
    const me = loadMyPlayer(code)
    if (!me) { router.push('/'); return }
    setMyId(me.id)
    setIsAdmin(me.isAdmin)
    refreshLobby()

    const channel = subscribeToLobby(code, (msg: BroadcastMsg) => {
      if (msg.type === 'lobby_state') {
        const incoming = msg.payload
        // Merge: keep local player entry, add others
        const l = loadLobby(code)
        if (!l) return
        const myEntry = l.players.find(p => p.id === me.id)
        const others = incoming.players.filter(p => p.id !== me.id)
        const merged: LobbyState = {
          ...incoming,
          players: myEntry ? [myEntry, ...others.filter(p => p.id !== myEntry.id)] : incoming.players,
        }
        saveLobby(merged)
        setLobby(merged)
      }
      if (msg.type === 'game_state') {
        // Admin started the game
        router.push(`/game/${code}`)
      }
      if (msg.type === 'request_sync' && me.isAdmin) {
        // New player joined – broadcast current lobby
        const l = loadLobby(code)
        if (l) broadcastLobby(code, l)
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [code, router, refreshLobby])

  // Admin: when a new player joins, update lobby and broadcast
  useEffect(() => {
    if (!isAdmin || !lobby) return
    broadcastLobby(code, lobby)
  }, [lobby?.players.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateLobbyConfig(config: RoleConfig, settings: LobbyState['settings']) {
    if (!lobby) return
    const updated: LobbyState = { ...lobby, config, settings }
    saveLobby(updated)
    setLobby(updated)
    broadcastLobby(code, updated)
  }

  async function handleStart() {
    if (!lobby || !myId) return
    // Build initial game state
    const gs = {
      code,
      status: 'waiting' as const,
      phase: null,
      round: 0,
      config: lobby.config,
      settings: lobby.settings,
      players: lobby.players.map(p => ({
        id: p.id, name: p.name, role: null, isAlive: true,
        isAdmin: p.isAdmin, isMayor: false, canVote: true,
        loverId: null, priestBlessed: false,
      })),
      witchHealUsed: false, witchPoisonUsed: false, priestUsed: false,
      currentRound: makeEmptyRound(code, 0),
      winner: null,
    }
    const started = startGame(gs)
    saveGameState(started)
    broadcastGame(code, started)
    router.push(`/game/${code}`)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!lobby) {
    return <main className="flex items-center justify-center min-h-dvh"><p className="text-gray-500">Lade...</p></main>
  }

  return (
    <main className="min-h-dvh px-4 py-6 max-w-sm mx-auto space-y-5">

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Lobby-Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-white">{code}</span>
          <button onClick={copyCode} className="text-gray-400 hover:text-white transition-colors text-sm">
            {copied ? '✓ Kopiert' : '📋'}
          </button>
        </div>
        <p className="text-gray-500 text-xs">Gib diesen Code deinen Mitspielern</p>
      </div>

      <div className="space-y-2">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Spieler ({lobby.players.length})</p>
        <ul className="space-y-1.5">
          {lobby.players.map(p => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                {p.name[0].toUpperCase()}
              </div>
              <span className="text-white flex-1">{p.name}</span>
              {p.id === myId && <span className="text-gray-500 text-xs">Du</span>}
              {p.isAdmin && <span className="text-yellow-400 text-sm">👑</span>}
            </li>
          ))}
        </ul>
      </div>

      {isAdmin ? (
        <AdminPanel
          config={lobby.config}
          playerCount={lobby.players.length}
          votesVisible={lobby.settings.votesVisible}
          mayorEnabled={lobby.settings.mayorEnabled}
          autoConfig={lobby.settings.autoConfig}
          onUpdate={async (config, settings) => updateLobbyConfig(config, settings)}
          onStart={handleStart}
          canStart={lobby.players.length >= 5}
        />
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">Warte auf den Admin...</p>
          <div className="flex justify-center gap-1 mt-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
        </div>
      )}

    </main>
  )
}
