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
  const [shared, setShared] = useState(false)

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
        saveGameState(msg.payload)
        window.location.href = `/game/${code}`
      }
      if (msg.type === 'request_sync' && me.isAdmin) {
        const l = loadLobby(code)
        if (!l) return
        const jp = msg.payload?.joiningPlayer
        if (jp && !l.players.some(p => p.id === jp.id)) {
          const updated: LobbyState = { ...l, players: [...l.players, { id: jp.id, name: jp.name, isAdmin: false }] }
          saveLobby(updated)
          setLobby(updated)
          broadcastLobby(code, updated)
        } else {
          broadcastLobby(code, l)
        }
      }
      if (msg.type === 'player_joined' && me.isAdmin) {
        const { id, name } = msg.payload
        const l = loadLobby(code)
        if (!l || l.players.some(p => p.id === id)) return
        const updated: LobbyState = { ...l, players: [...l.players, { id, name, isAdmin: false }] }
        saveLobby(updated)
        setLobby(updated)
        broadcastLobby(code, updated)
      }
      if (msg.type === 'kicked' && msg.payload.playerId === me.id) {
        router.push('/?kicked=1')
      }
      if (msg.type === 'lobby_closed') {
        router.push('/?closed=1')
      }
    })

    // Non-admin: announce arrival so admin can add us to the lobby
    if (!me.isAdmin) {
      setTimeout(() => {
        supabase.channel(`werwolf:${code}`).send({
          type: 'broadcast', event: 'msg',
          payload: { type: 'player_joined', payload: { id: me.id, name: me.name } },
        })
      }, 400)
    }

    return () => { supabase.removeChannel(channel) }
  }, [code, router, refreshLobby])


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
    window.location.href = `/game/${code}`
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareInvite() {
    const url = `${window.location.origin}/?join=${code}`
    if (navigator.share) {
      await navigator.share({ title: 'Werwolf', text: `Tritt meiner Lobby bei! Code: ${code}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  function kickPlayer(playerId: string) {
    if (!lobby || !isAdmin) return
    const updated: LobbyState = { ...lobby, players: lobby.players.filter(p => p.id !== playerId) }
    saveLobby(updated)
    setLobby(updated)
    broadcastLobby(code, updated)
    supabase.channel(`werwolf:${code}`).send({
      type: 'broadcast', event: 'msg',
      payload: { type: 'kicked', payload: { playerId } },
    })
  }

  function closeLobby() {
    supabase.channel(`werwolf:${code}`).send({
      type: 'broadcast', event: 'msg',
      payload: { type: 'lobby_closed' },
    })
    router.push('/')
  }

  if (!lobby) {
    return <main className="flex items-center justify-center min-h-dvh"><p className="text-gray-500">Lade...</p></main>
  }

  return (
    <main className="min-h-dvh px-4 py-6 max-w-sm mx-auto space-y-5">

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Lobby-Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-white">{code}</span>
          <button onClick={copyCode} className="text-gray-400 hover:text-white transition-colors text-sm">
            {copied ? '✓' : '📋'}
          </button>
        </div>
        <button
          onClick={shareInvite}
          className="w-full py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium active:scale-95 transition-all"
        >
          {shared ? '✓ Link kopiert' : '🔗 Einladungslink teilen'}
        </button>
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
              {isAdmin && !p.isAdmin && p.id !== myId && (
                <button
                  onClick={() => kickPlayer(p.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-xs px-1"
                  title="Kicken"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isAdmin ? (
        <>
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
          <button
            onClick={closeLobby}
            className="w-full py-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-400 text-sm font-medium active:scale-95 transition-all"
          >
            Lobby schließen
          </button>
        </>
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
