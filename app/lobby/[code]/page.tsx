'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player, Lobby, RoleConfig } from '@/types/game'
import AdminPanel from '@/components/AdminPanel'
import { getAutoConfig } from '@/lib/autoConfig'

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const pid = localStorage.getItem('werwolf_player_id')
    setMyId(pid)

    async function load() {
      const [{ data: lobbyData }, { data: playerData }] = await Promise.all([
        supabase.from('lobbies').select('*').eq('code', code).single(),
        supabase.from('players').select('*').eq('lobby_code', code).order('joined_at'),
      ])
      if (lobbyData) setLobby(mapLobby(lobbyData))
      if (playerData) setPlayers(playerData.map(mapPlayer))
    }
    load()

    // Realtime
    const channel = supabase
      .channel(`lobby:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `lobby_code=eq.${code}` }, () => {
        supabase.from('players').select('*').eq('lobby_code', code).order('joined_at')
          .then(({ data }) => { if (data) setPlayers(data.map(mapPlayer)) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `code=eq.${code}` }, ({ new: newLobby }) => {
        setLobby(mapLobby(newLobby))
        if (newLobby.status !== 'waiting') {
          router.push(`/game/${code}`)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [code, router])

  const me = players.find(p => p.id === myId)
  const isAdmin = me?.isAdmin ?? false

  async function updateConfig(config: RoleConfig, settings: { votesVisible: boolean; mayorEnabled: boolean; autoConfig: boolean }) {
    await fetch('/api/lobby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_config',
        code,
        config,
        settings: { ...settings, playerCount: players.length },
      }),
    })
  }

  async function startGame() {
    if (!myId) return
    await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, adminPlayerId: myId }),
    })
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!lobby) {
    return (
      <main className="flex items-center justify-center min-h-dvh">
        <p className="text-gray-500">Lade...</p>
      </main>
    )
  }

  return (
    <main className="min-h-dvh px-4 py-6 max-w-sm mx-auto space-y-5">

      {/* Code */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Lobby-Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-white">{code}</span>
          <button
            onClick={copyCode}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            {copied ? '✓ Kopiert' : '📋'}
          </button>
        </div>
        <p className="text-gray-500 text-xs">Gib diesen Code deinen Mitspielern</p>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        <p className="text-gray-400 text-xs uppercase tracking-wider">
          Spieler ({players.length})
        </p>
        <ul className="space-y-1.5">
          {players.map(p => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                {p.displayName[0].toUpperCase()}
              </div>
              <span className="text-white flex-1">{p.displayName}</span>
              {p.id === myId && <span className="text-gray-500 text-xs">Du</span>}
              {p.isAdmin && <span className="text-yellow-400 text-sm">👑</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Admin panel */}
      {isAdmin && lobby && (
        <AdminPanel
          config={lobby.config}
          playerCount={players.length}
          votesVisible={lobby.settings.votesVisible}
          mayorEnabled={lobby.settings.mayorEnabled}
          autoConfig={lobby.settings.autoConfig}
          onUpdate={updateConfig}
          onStart={startGame}
          canStart={players.length >= 5}
        />
      )}

      {!isAdmin && (
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

function mapLobby(d: Record<string, unknown>): Lobby {
  return {
    code: d.code as string,
    adminId: d.admin_id as string,
    status: d.status as Lobby['status'],
    phase: d.phase as Lobby['phase'],
    round: d.round as number,
    config: (d.config as Lobby['config']) ?? getAutoConfig(5),
    settings: {
      votesVisible: d.votes_visible as boolean ?? true,
      mayorEnabled: d.mayor_enabled as boolean ?? true,
      autoConfig: d.auto_config as boolean ?? false,
    },
    createdAt: d.created_at as string,
  }
}

function mapPlayer(d: Record<string, unknown>): Player {
  return {
    id: d.id as string,
    lobbyCode: d.lobby_code as string,
    userId: d.user_id as string | null,
    displayName: d.display_name as string,
    role: d.role as Player['role'],
    isAlive: d.is_alive as boolean,
    isAdmin: d.is_admin as boolean,
    isMayor: d.is_mayor as boolean,
    canVote: d.can_vote as boolean,
    loverId: d.lover_id as string | null,
    priestBlessed: d.priest_blessed as boolean,
    joinedAt: d.joined_at as string,
  }
}
