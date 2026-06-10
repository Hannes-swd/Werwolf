'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player, Lobby, GameEvent, Vote, NightAction, ROLE_LABELS, ROLE_ICONS } from '@/types/game'
import RoleCard from '@/components/RoleCard'
import PlayerList from '@/components/PlayerList'
import NightPhase from '@/components/NightPhase'
import VotePanel from '@/components/VotePanel'
import GameLog from '@/components/GameLog'
import { exportGameTxt, exportGameJson } from '@/lib/exportGame'
import { getAutoConfig } from '@/lib/autoConfig'
import { motion, AnimatePresence } from 'framer-motion'

type GameData = {
  lobby: Lobby
  players: Player[]
  me: Player
  events: GameEvent[]
  votes: Vote[]
  nightActions: NightAction[]
  witchHealUsed: boolean
  witchPoisonUsed: boolean
  priestUsed: boolean
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [data, setData] = useState<GameData | null>(null)
  const [roleRevealed, setRoleRevealed] = useState(false)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [girlPeeked, setGirlPeeked] = useState(false)
  const [hunterPending, setHunterPending] = useState(false)
  const [mayorPending, setMayorPending] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  function notify(msg: string, duration = 3000) {
    setNotification(msg)
    setTimeout(() => setNotification(null), duration)
  }

  const loadAll = useCallback(async () => {
    const myId = localStorage.getItem('werwolf_player_id')
    if (!myId) { router.push('/'); return }

    const [{ data: lobbyData }, { data: playersData }, { data: eventsData }, { data: votesData }, { data: actionsData }] =
      await Promise.all([
        supabase.from('lobbies').select('*').eq('code', code).single(),
        supabase.from('players').select('*').eq('lobby_code', code).order('joined_at'),
        supabase.from('game_events').select('*').eq('lobby_code', code).order('created_at'),
        supabase.from('votes').select('*').eq('lobby_code', code),
        supabase.from('night_actions').select('*').eq('lobby_code', code),
      ])

    if (!lobbyData || !playersData) return

    const me = playersData.find(p => p.id === myId)
    if (!me) { router.push('/'); return }

    let witchHealUsed = false
    let witchPoisonUsed = false
    if (me.role === 'witch') {
      const { data: ws } = await supabase.from('witch_status').select('*').eq('player_id', me.id).single()
      witchHealUsed = ws?.heal_used ?? false
      witchPoisonUsed = ws?.poison_used ?? false
    }

    const priestUsed = me.role === 'priest'
      ? (actionsData ?? []).some(a => a.actor_id === me.id && a.action === 'bless')
      : false

    if (lobbyData.status === 'ended') {
      setWinner((eventsData ?? []).findLast(e => e.event_type === 'win')?.description ?? 'Spiel beendet')
    }

    const currentVotes = (votesData ?? []).filter(
      v => v.round === lobbyData.round &&
        v.vote_type === (lobbyData.status === 'mayor_election' ? 'mayor_election' : 'day_elimination')
    )
    setMyVote(currentVotes.find(v => v.voter_id === myId)?.target_id ?? null)

    setData({
      lobby: mapLobby(lobbyData),
      players: playersData.map(mapPlayer),
      me: mapPlayer(me),
      events: (eventsData ?? []).map(mapEvent),
      votes: currentVotes.map(mapVote),
      nightActions: (actionsData ?? [])
        .filter(a => a.round === lobbyData.round)
        .map(mapAction),
      witchHealUsed,
      witchPoisonUsed,
      priestUsed,
    })
  }, [code, router])

  useEffect(() => {
    loadAll()

    const channel = supabase
      .channel(`game:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies', filter: `code=eq.${code}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `lobby_code=eq.${code}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `lobby_code=eq.${code}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'night_actions', filter: `lobby_code=eq.${code}` }, loadAll)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: `lobby_code=eq.${code}` }, ({ new: ev }) => {
        if (ev.event_type === 'win') setWinner(ev.description)
        if (ev.event_type === 'death') notify(`💀 ${ev.description}`)
        if (ev.event_type === 'fool_revealed') notify(`🃏 ${ev.description}`)
        if (ev.event_type === 'mayor_passed') notify(`👑 ${ev.description}`)
        loadAll()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [code, loadAll])

  async function submitAction(action: string, targetId?: string) {
    if (!data?.me) return
    const res = await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        actorId: data.me.id,
        targetId,
        action,
        phase: data.lobby.phase,
      }),
    })
    const result = await res.json()
    if (action === 'peek') return result
    if (result.caught) notify('⚠️ Du wurdest fast erwischt!')
    return result
  }

  async function submitVote(targetId: string) {
    if (!data?.me) return
    const voteType = data.lobby.status === 'mayor_election' ? 'mayor_election' : 'day_elimination'
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, voterId: data.me.id, targetId, voteType }),
    })
    const result = await res.json()
    setMyVote(targetId)
    if (result.winner) setWinner(result.winner)
    if (result.foolRevealed) notify('🃏 Dorfdepp aufgedeckt!')
    if (result.hunterPending) setHunterPending(true)
    if (result.mayorPending) setMayorPending(true)
    if (result.mayorId) notify('👑 Bürgermeister gewählt!')
  }

  async function startVoting() {
    await fetch('/api/game/mayor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, action: 'start_vote' }),
    })
  }

  async function hunterShoot(targetId: string) {
    await fetch('/api/game/mayor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, action: 'hunter_shoot', hunterTargetId: targetId }),
    })
    setHunterPending(false)
  }

  async function mayorPassTitle(successorId: string) {
    if (!data?.me) return
    await fetch('/api/game/mayor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, action: 'pass_title', mayorId: data.me.id, successorId }),
    })
    setMayorPending(false)
  }

  async function tiebreakerVote(targetId: string) {
    if (!data?.me) return
    await fetch('/api/game/mayor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, action: 'tiebreak', mayorId: data.me.id, successorId: targetId }),
    })
  }

  if (!data) {
    return (
      <main className="flex items-center justify-center min-h-dvh">
        <p className="text-gray-500">Lade Spiel...</p>
      </main>
    )
  }

  const { lobby, players, me, events, votes, nightActions, witchHealUsed, witchPoisonUsed, priestUsed } = data
  const alivePlayers = players.filter(p => p.isAlive)
  const mayor = players.find(p => p.isMayor)

  // ---- WINNER SCREEN ----
  if (winner !== null || lobby.status === 'ended') {
    const winnerLabel = winner === 'village' || winner?.includes('Dorf') ? 'DORF' : winner === 'wolves' || winner?.includes('Wolf') ? 'WERWÖLFE' : 'LIEBESPAAR'
    const winnerEmoji = winnerLabel === 'WERWÖLFE' ? '🐺' : winnerLabel === 'LIEBESPAAR' ? '💘' : '🏡'
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center space-y-3">
          <div className="text-7xl">{winnerEmoji}</div>
          <h1 className="text-3xl font-bold text-white">{winnerLabel} GEWINNT!</h1>
        </motion.div>

        <div className="space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Alle Rollen</p>
          <PlayerList players={players} myId={me.id} showRoles />
        </div>

        <GameLog events={events} />

        <div className="space-y-2">
          <button
            onClick={() => exportGameTxt(code, players, events, winner, lobby.round, mayor?.displayName ?? null, lobby.settings.votesVisible)}
            className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold active:scale-95"
          >
            📄 Als .txt exportieren
          </button>
          <button
            onClick={() => exportGameJson(code, players, events, winner, lobby.round)}
            className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold active:scale-95"
          >
            📋 Als .json exportieren
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold active:scale-95"
          >
            Neues Spiel
          </button>
        </div>
      </main>
    )
  }

  // ---- ROLE REVEAL ----
  if (!roleRevealed) {
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto flex flex-col items-center justify-center space-y-6">
        <RoleCard role={me.role!} playerName={me.displayName} isMayor={me.isMayor} />
        <button
          onClick={() => setRoleRevealed(true)}
          className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-base active:scale-95 transition-all"
        >
          Verstanden →
        </button>
      </main>
    )
  }

  // ---- HUNTER PENDING ----
  if (hunterPending && me.role === 'hunter') {
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="text-5xl">🔫</div>
          <h2 className="text-2xl font-bold text-white">Du stirbst!</h2>
          <p className="text-gray-400 text-sm">Aber du schießt noch – wen nimmst du mit?</p>
        </div>
        <PlayerList
          players={alivePlayers.filter(p => p.id !== me.id)}
          myId={me.id}
          selectable
          onSelect={hunterShoot}
        />
      </main>
    )
  }

  // ---- MAYOR PASSING TITLE ----
  if (mayorPending && me.isMayor) {
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="text-5xl">👑</div>
          <h2 className="text-2xl font-bold text-white">Übergib den Titel</h2>
          <p className="text-gray-400 text-sm">Wähle deinen Nachfolger als Bürgermeister</p>
        </div>
        <PlayerList
          players={alivePlayers.filter(p => p.id !== me.id)}
          myId={me.id}
          selectable
          onSelect={mayorPassTitle}
        />
      </main>
    )
  }

  return (
    <main className="min-h-dvh px-4 py-5 max-w-sm mx-auto space-y-4">

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 max-w-sm mx-auto bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm text-center z-50 shadow-xl"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">
            {lobby.status === 'night' ? '🌙 Nacht' :
             lobby.status === 'day_discussion' ? '☀️ Tag – Diskussion' :
             lobby.status === 'day_vote' ? '🗳️ Abstimmung' :
             lobby.status === 'mayor_election' ? '👑 Bürgermeisterwahl' :
             lobby.status === 'tiebreaker' ? '⚖️ Gleichstand' : ''}
          </p>
          <p className="text-gray-400 text-xs">Runde {lobby.round}</p>
        </div>
        <div className="text-right">
          <p className="text-white text-sm font-medium flex items-center gap-1 justify-end">
            {me.isMayor && '👑'}
            {ROLE_ICONS[me.role!]} {ROLE_LABELS[me.role!]}
          </p>
          <p className="text-gray-500 text-xs">{alivePlayers.length} am Leben</p>
        </div>
      </div>

      {/* Mayor election */}
      {lobby.status === 'mayor_election' && (
        <VotePanel
          players={players}
          myId={me.id}
          votes={votes}
          votesVisible
          voteType="mayor_election"
          onVote={submitVote}
          myVote={myVote}
        />
      )}

      {/* Night */}
      {lobby.status === 'night' && lobby.phase && (
        <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-4">
          <NightPhase
            phase={lobby.phase}
            myRole={me.role!}
            myId={me.id}
            players={players}
            wolfTarget={null}
            witchHealUsed={witchHealUsed}
            witchPoisonUsed={witchPoisonUsed}
            priestUsed={priestUsed}
            girlPeeked={girlPeeked}
            nightActions={nightActions}
            onAction={async (action, targetId) => {
              if (action === 'peek') setGirlPeeked(true)
              return submitAction(action, targetId)
            }}
          />
        </div>
      )}

      {/* Day discussion */}
      {lobby.status === 'day_discussion' && (
        <div className="space-y-4">
          <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-2xl p-4 text-center space-y-2">
            <p className="text-yellow-300 font-semibold">Diskutiert!</p>
            <p className="text-gray-400 text-sm">Redet über die letzte Nacht...</p>
          </div>
          {me.isAdmin && (
            <button
              onClick={startVoting}
              className="w-full py-4 bg-orange-600 rounded-2xl text-white font-bold active:scale-95 transition-all"
            >
              🗳️ Abstimmung starten
            </button>
          )}
          {!me.isAdmin && (
            <p className="text-center text-gray-500 text-sm">Warte auf den Admin...</p>
          )}
        </div>
      )}

      {/* Day vote */}
      {lobby.status === 'day_vote' && (
        <VotePanel
          players={players}
          myId={me.id}
          votes={votes}
          votesVisible={lobby.settings.votesVisible}
          voteType="day_elimination"
          onVote={submitVote}
          myVote={myVote}
        />
      )}

      {/* Tiebreaker */}
      {lobby.status === 'tiebreaker' && (
        <div className="space-y-4">
          <div className="bg-orange-950/30 border border-orange-800/50 rounded-2xl p-4 text-center">
            <p className="text-orange-300 font-semibold">⚖️ Gleichstand!</p>
            <p className="text-gray-400 text-sm mt-1">
              {me.isMayor ? 'Du entscheidest als Bürgermeister.' : `${mayor?.displayName ?? 'Bürgermeister'} entscheidet...`}
            </p>
          </div>
          {me.isMayor && (
            <PlayerList
              players={alivePlayers.filter(p => p.id !== me.id)}
              myId={me.id}
              selectable
              onSelect={tiebreakerVote}
            />
          )}
        </div>
      )}

      {/* Player overview (always shown) */}
      <div className="space-y-2">
        <p className="text-gray-500 text-xs uppercase tracking-wider">Spieler</p>
        <PlayerList players={players} myId={me.id} />
      </div>

      {/* Log */}
      {events.length > 0 && <GameLog events={events} />}

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
      votesVisible: (d.votes_visible as boolean) ?? true,
      mayorEnabled: (d.mayor_enabled as boolean) ?? true,
      autoConfig: (d.auto_config as boolean) ?? false,
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

function mapEvent(d: Record<string, unknown>): GameEvent {
  return {
    id: d.id as string,
    lobbyCode: d.lobby_code as string,
    round: d.round as number,
    phase: d.phase as string,
    eventType: d.event_type as GameEvent['eventType'],
    description: d.description as string,
    createdAt: d.created_at as string,
  }
}

function mapVote(d: Record<string, unknown>): Vote {
  return {
    id: d.id as string,
    lobbyCode: d.lobby_code as string,
    round: d.round as number,
    voteType: d.vote_type as Vote['voteType'],
    voterId: d.voter_id as string,
    targetId: d.target_id as string,
    createdAt: d.created_at as string,
  }
}

function mapAction(d: Record<string, unknown>): NightAction {
  return {
    id: d.id as string,
    lobbyCode: d.lobby_code as string,
    round: d.round as number,
    phase: d.phase as string,
    actorId: d.actor_id as string,
    targetId: d.target_id as string,
    action: d.action as NightAction['action'],
    createdAt: d.created_at as string,
  }
}
