'use client'
import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GameState, loadGameState, saveRound, loadAllRounds, RoundData } from '@/lib/storage'
import { loadMyPlayer } from '@/lib/storage'
import { broadcastGame, subscribeToLobby, BroadcastMsg } from '@/lib/broadcast'
import {
  applyNightAction, resolveNight, applyVote, resolveVotes,
  eliminatePlayer, hunterShoot, mayorPassTitle, advanceToPhase, nextNightPhase,
} from '@/lib/gameEngine'
import RoleCard from '@/components/RoleCard'
import PlayerList from '@/components/PlayerList'
import NightPhase from '@/components/NightPhase'
import VotePanel from '@/components/VotePanel'
import GameLog from '@/components/GameLog'
import MiniGame from '@/components/MiniGame'
import ScoreBoard, { PlayerScore } from '@/components/ScoreBoard'
import { exportGameTxt, exportGameJson } from '@/lib/exportGame'
import { ROLE_LABELS, ROLE_ICONS, GameEvent, NightAction, Vote, Player } from '@/types/game'
import { motion, AnimatePresence } from 'framer-motion'

function toGameEvents(rounds: RoundData[]): GameEvent[] {
  const events: GameEvent[] = []
  rounds.forEach(r => {
    if (r.mayorElectedName) events.push({ id: `${r.round}-mayor`, lobbyCode: r.code, round: r.round, phase: 'mayor_election', eventType: 'mayor_elected', description: `${r.mayorElectedName} wurde zum Bürgermeister gewählt`, createdAt: r.timestamp })
    r.deathNames.forEach((name, i) => events.push({ id: `${r.round}-death-${i}`, lobbyCode: r.code, round: r.round, phase: r.deaths[i] ? 'night' : 'night', eventType: 'death', description: `${name} starb`, createdAt: r.timestamp }))
    if (r.healed && r.wolfTargetName) events.push({ id: `${r.round}-heal`, lobbyCode: r.code, round: r.round, phase: 'witch', eventType: 'heal', description: `Hexe heilte ${r.wolfTargetName}`, createdAt: r.timestamp })
    if (r.poisonTargetName) events.push({ id: `${r.round}-poison`, lobbyCode: r.code, round: r.round, phase: 'witch', eventType: 'poison', description: `Hexe vergiftete ${r.poisonTargetName}`, createdAt: r.timestamp })
    if (r.eliminatedName) events.push({ id: `${r.round}-elim`, lobbyCode: r.code, round: r.round, phase: 'day_vote', eventType: r.foolRevealed ? 'fool_revealed' : 'death', description: r.foolRevealed ? `${r.eliminatedName} ist der Dorfdepp – überlebt!` : `${r.eliminatedName} wurde eliminiert (${r.eliminatedRole})`, createdAt: r.timestamp })
    if (r.winner) events.push({ id: `${r.round}-win`, lobbyCode: r.code, round: r.round, phase: 'end', eventType: 'win', description: r.winner, createdAt: r.timestamp })
  })
  return events
}

function toNightActions(state: GameState): NightAction[] {
  return state.currentRound.nightActions.map((a, i) => ({
    id: `na-${i}`, lobbyCode: state.code, round: state.round, phase: a.phase,
    actorId: a.actorId, targetId: a.targetId ?? '',
    action: a.action as NightAction['action'], createdAt: '',
  }))
}

function toVotes(state: GameState, voteType: string): Vote[] {
  return state.currentRound.votes
    .filter(v => v.voteType === voteType)
    .map((v, i) => ({
      id: `v-${i}`, lobbyCode: state.code, round: state.round,
      voteType: v.voteType as Vote['voteType'],
      voterId: v.voterId, targetId: v.targetId, createdAt: '',
    }))
}

function toPlayers(state: GameState): Player[] {
  return state.players.map(p => ({
    id: p.id, lobbyCode: state.code, userId: null, displayName: p.name,
    role: p.role, isAlive: p.isAlive, isAdmin: p.isAdmin,
    isMayor: p.isMayor, canVote: p.canVote, loverId: p.loverId,
    priestBlessed: p.priestBlessed, joinedAt: '',
  }))
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [gs, setGs] = useState<GameState | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleRevealed, setRoleRevealed] = useState(false)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [girlPeeked, setGirlPeeked] = useState(false)
  const [peekResult, setPeekResult] = useState<{ wolves: string[]; caught: boolean } | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [scores, setScores] = useState<PlayerScore[]>([])
  const stateRef = useRef<GameState | null>(null)
  const myScoreRef = useRef(0)

  function notify(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  function applyState(state: GameState) {
    stateRef.current = state
    setGs(state)
  }

  useEffect(() => {
    const me = loadMyPlayer(code)
    if (!me) { router.push('/'); return }
    setMyId(me.id)
    setIsAdmin(me.isAdmin)

    const saved = loadGameState(code)
    if (saved) applyState(saved)

    const channel = subscribeToLobby(code, (msg: BroadcastMsg) => {
      if (msg.type === 'game_state') {
        // Admin is source of truth — don't overwrite own state with echo of own broadcast
        if (me.isAdmin) return
        const prevRound = stateRef.current?.round ?? 0
        applyState(msg.payload)
        const myVoteEntry = msg.payload.currentRound.votes.find(
          v => v.voterId === me.id && (v.voteType === 'day_elimination' || v.voteType === 'mayor_election')
        )
        if (myVoteEntry) {
          setMyVote(myVoteEntry.targetId)
        } else if (msg.payload.round !== prevRound) {
          setMyVote(null)
        }
        // else: keep current myVote — vote is still in flight, don't clear the selection
      }
      if (msg.type === 'request_sync' && me.isAdmin) {
        const s = stateRef.current
        if (s) broadcastGame(code, s)
      }
      if (msg.type === 'score_update') {
        const { playerId, playerName, score } = msg.payload
        setScores(prev => {
          const filtered = prev.filter(s => s.playerId !== playerId)
          return [...filtered, { playerId, playerName, score }]
        })
      }
      if (msg.type === 'kicked' && msg.payload.playerId === me.id) {
        router.push('/?kicked=1')
      }
      if (msg.type === 'lobby_closed') {
        router.push('/?closed=1')
      }
    })

    let syncTimer: ReturnType<typeof setTimeout> | null = null
    if (!me.isAdmin && !saved) {
      syncTimer = setTimeout(() => {
        supabase.channel(`werwolf:${code}`).send({
          type: 'broadcast', event: 'msg',
          payload: { type: 'request_sync' },
        })
      }, 800)
    }

    return () => {
      supabase.removeChannel(channel)
      if (syncTimer) clearTimeout(syncTimer)
    }
  }, [code, router])

  // Admin: mutate state, broadcast, persist
  function adminUpdate(newState: GameState) {
    applyState(newState)
    broadcastGame(code, newState)
  }

  // Mini-game score
  function handleScore(delta: number) {
    const next = myScoreRef.current + delta
    myScoreRef.current = next
    setMyScore(next)
    if (!myId) return
    const me = stateRef.current?.players.find(p => p.id === myId)
    const entry: PlayerScore = { playerId: myId, playerName: me?.name ?? '?', score: next }
    setScores(prev => [...prev.filter(s => s.playerId !== myId), entry])
    supabase.channel(`werwolf:${code}`).send({
      type: 'broadcast', event: 'msg',
      payload: { type: 'score_update', payload: entry },
    })
  }

  // ---- Night action (admin processes) ----
  function submitNightAction(actorId: string, targetId: string | null, action: string) {
    const current = stateRef.current
    if (!current || !isAdmin) return
    const s = applyNightAction(current, actorId, targetId, action, current.phase ?? '')

    if (action === 'peek') {
      // Girl peek – handled locally
      return
    }

    // Check if wolf phase is complete
    if (current.phase === 'wolf' && action === 'kill') {
      const wolves = s.players.filter(p => p.role === 'werewolf' && p.isAlive)
      const wolfVotes = s.currentRound.nightActions.filter(a => a.phase === 'wolf' && a.action === 'kill')
      const allDone = wolves.every(w => wolfVotes.some(v => v.actorId === w.id))
      if (!allDone) { adminUpdate(s); return }
    }

    // Single-actor phases: advance after action
    if (['bless', 'heal', 'poison', 'reveal', 'link', 'skip'].includes(action) ||
        (current.phase === 'wolf' && action === 'kill')) {
      const next = nextNightPhase(s)
      if (next) {
        adminUpdate(advanceToPhase(s, next))
      } else {
        // Resolve night
        const resolved = resolveNight(s)
        if (resolved.currentRound.deaths.length > 0) {
          notify(`💀 ${resolved.currentRound.deathNames.join(', ')} gestorben`)
        }
        adminUpdate(resolved)
      }
    } else {
      adminUpdate(s)
    }
  }

  // ---- Vote (admin processes) ----
  function submitVote(voterId: string, targetId: string, voteType: string) {
    const current = stateRef.current
    if (!current || !isAdmin) return
    const s = applyVote(current, voterId, targetId, voteType)
    const eligible = s.players.filter(p => p.isAlive && (voteType === 'mayor_election' || p.canVote))
    const cast = s.currentRound.votes.filter(v => v.voteType === voteType)
    if (cast.length >= eligible.length) {
      const resolved = resolveVotes(s, voteType)
      adminUpdate(resolved)
    } else {
      adminUpdate(s)
    }
  }

  // ---- Non-admin: submit action via broadcast ----
  function playerSubmitAction(action: string, targetId?: string) {
    if (!myId || !gs) return Promise.resolve()
    if (isAdmin) {
      submitNightAction(myId, targetId ?? null, action)
      return Promise.resolve()
    }
    // Non-admin sends to admin via broadcast
    supabase.channel(`werwolf:${code}`).send({
      type: 'broadcast', event: 'msg',
      payload: { type: 'night_action', payload: { phase: gs.phase ?? '', actorId: myId, targetId: targetId ?? null, action } },
    })
    return Promise.resolve()
  }

  function playerSubmitVote(targetId: string) {
    if (!myId || !gs) return Promise.resolve()
    const voteType = gs.status === 'mayor_election' ? 'mayor_election' : 'day_elimination'
    setMyVote(targetId)
    if (isAdmin) {
      submitVote(myId, targetId, voteType)
      return Promise.resolve()
    }
    supabase.channel(`werwolf:${code}`).send({
      type: 'broadcast', event: 'msg',
      payload: { type: 'vote', payload: { voterId: myId, targetId, voteType } },
    })
    return Promise.resolve()
  }

  // Admin handles broadcasts FROM players
  useEffect(() => {
    if (!isAdmin) return
    const channel = subscribeToLobby(code, (msg: BroadcastMsg) => {
      if (msg.type === 'night_action') {
        const { actorId, targetId, action, phase } = msg.payload
        const s = stateRef.current
        if (!s || s.phase !== phase) return
        submitNightAction(actorId, targetId, action)
      }
      if (msg.type === 'vote') {
        const { voterId, targetId, voteType } = msg.payload
        const s = stateRef.current
        if (!s) return
        submitVote(voterId, targetId, voteType)
      }
      if (msg.type === 'hunter_shoot') {
        const s = stateRef.current
        if (!s || s.status !== 'hunter_pending') return
        adminUpdate(hunterShoot(s, msg.payload.targetId))
      }
      if (msg.type === 'mayor_pass') {
        const s = stateRef.current
        if (!s || s.status !== 'mayor_pending') return
        adminUpdate(mayorPassTitle(s, msg.payload.successorId))
      }
      if (msg.type === 'tiebreaker_pick') {
        const s = stateRef.current
        if (!s || s.status !== 'tiebreaker') return
        adminUpdate(eliminatePlayer(s, msg.payload.targetId, 'tiebreaker'))
      }
    })
    return () => { supabase.removeChannel(channel) }
  }, [isAdmin, code]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!gs || !myId) {
    return <main className="flex items-center justify-center min-h-dvh"><p className="text-gray-500">Lade Spiel...</p></main>
  }

  const me = gs.players.find(p => p.id === myId)
  if (!me) return <main className="flex items-center justify-center min-h-dvh"><p className="text-gray-500">Spieler nicht gefunden</p></main>

  const players = toPlayers(gs)
  const alivePlayers = players.filter(p => p.isAlive)
  const mayor = players.find(p => p.isMayor)
  const voteType = gs.status === 'mayor_election' ? 'mayor_election' : 'day_elimination'
  const currentVotes = toVotes(gs, voteType)
  const nightActions = toNightActions(gs)
  const allRounds = loadAllRounds(code)
  const events = toGameEvents(allRounds)

  // ---- WINNER ----
  if (gs.winner || gs.status === 'ended') {
    const w = gs.winner
    const winnerLabel = w === 'village' ? 'DORF' : w === 'wolves' ? 'WERWÖLFE' : 'LIEBESPAAR'
    const winnerEmoji = winnerLabel === 'WERWÖLFE' ? '🐺' : winnerLabel === 'LIEBESPAAR' ? '💘' : '🏡'
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center space-y-3">
          <div className="text-7xl">{winnerEmoji}</div>
          <h1 className="text-3xl font-bold text-white">{winnerLabel} GEWINNT!</h1>
          <p className="text-gray-400 text-sm">nach {gs.round} Runden</p>
        </motion.div>
        <div className="space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Alle Rollen</p>
          <PlayerList players={players} myId={myId} showRoles />
        </div>
        {scores.length > 0 && <ScoreBoard scores={scores} myId={myId} />}
        <GameLog events={events} />
        <div className="space-y-2">
          <button
            onClick={() => exportGameTxt(code, players, events, w, gs.round, mayor?.displayName ?? null, gs.settings.votesVisible)}
            className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold active:scale-95"
          >📄 Als .txt exportieren</button>
          <button
            onClick={() => exportGameJson(code, players, events, w, gs.round)}
            className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold active:scale-95"
          >📋 Als .json exportieren</button>
          <button onClick={() => router.push('/')} className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold active:scale-95">
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
        <RoleCard role={me.role!} playerName={me.name} isMayor={me.isMayor} />
        <button onClick={() => setRoleRevealed(true)} className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-base active:scale-95 transition-all">
          Verstanden →
        </button>
      </main>
    )
  }

  // ---- HUNTER PENDING ----
  if (gs.status === 'hunter_pending' && me.role === 'hunter') {
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="text-5xl">🔫</div>
          <h2 className="text-2xl font-bold text-white">Du stirbst!</h2>
          <p className="text-gray-400 text-sm">Wen nimmst du mit?</p>
        </div>
        <PlayerList
          players={alivePlayers.filter(p => p.id !== myId)}
          myId={myId}
          selectable
          onSelect={id => {
            if (!gs) return
            if (isAdmin) {
              adminUpdate(hunterShoot(gs, id))
            } else {
              supabase.channel(`werwolf:${code}`).send({
                type: 'broadcast', event: 'msg',
                payload: { type: 'hunter_shoot', payload: { targetId: id } },
              })
            }
          }}
        />
      </main>
    )
  }

  // ---- MAYOR PENDING ----
  if (gs.status === 'mayor_pending' && me.isMayor) {
    return (
      <main className="min-h-dvh px-4 py-8 max-w-sm mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="text-5xl">👑</div>
          <h2 className="text-2xl font-bold text-white">Übergib den Titel</h2>
          <p className="text-gray-400 text-sm">Wähle deinen Nachfolger</p>
        </div>
        <PlayerList
          players={alivePlayers.filter(p => p.id !== myId)}
          myId={myId}
          selectable
          onSelect={id => {
            if (!gs) return
            if (isAdmin) {
              adminUpdate(mayorPassTitle(gs, id))
            } else {
              supabase.channel(`werwolf:${code}`).send({
                type: 'broadcast', event: 'msg',
                payload: { type: 'mayor_pass', payload: { successorId: id } },
              })
            }
          }}
        />
      </main>
    )
  }

  return (
    <main className="min-h-dvh px-4 py-5 max-w-sm mx-auto space-y-4">

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
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
            {gs.status === 'night' ? '🌙 Nacht' :
             gs.status === 'day_discussion' ? '☀️ Diskussion' :
             gs.status === 'day_vote' ? '🗳️ Abstimmung' :
             gs.status === 'mayor_election' ? '👑 Bürgermeisterwahl' :
             gs.status === 'tiebreaker' ? '⚖️ Gleichstand' : ''}
          </p>
          <p className="text-gray-400 text-xs">Runde {gs.round}</p>
        </div>
        <div className="text-right">
          <p className="text-white text-sm font-medium flex items-center gap-1 justify-end">
            {me.isMayor && '👑'}
            {me.role && ROLE_ICONS[me.role]} {me.role && ROLE_LABELS[me.role]}
          </p>
          <p className="text-gray-500 text-xs">{alivePlayers.length} am Leben</p>
        </div>
      </div>

      {/* Bürgermeisterwahl */}
      {gs.status === 'mayor_election' && (
        <VotePanel
          players={players} myId={myId} votes={currentVotes} votesVisible
          voteType="mayor_election" onVote={playerSubmitVote} myVote={myVote}
        />
      )}

      {/* Nacht */}
      {gs.status === 'night' && gs.phase && (
        <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-4">
          <NightPhase
            phase={gs.phase} myRole={me.role!} myId={myId}
            players={players}
            wolfTarget={gs.currentRound.wolfTarget}
            witchHealUsed={gs.witchHealUsed}
            witchPoisonUsed={gs.witchPoisonUsed}
            priestUsed={gs.priestUsed}
            girlPeeked={girlPeeked}
            nightActions={nightActions}
            onAction={async (action, targetId) => {
              if (action === 'peek') {
                setGirlPeeked(true)
                const wolves = gs.players.filter(p => p.role === 'werewolf' && p.isAlive).map(p => p.name)
                const caught = Math.random() < 0.4
                const result = { wolves, caught }
                setPeekResult(result)
                if (caught && isAdmin) {
                  notify('⚠️ Das Mädchen wurde erwischt! Wölfe können Ziel wechseln.')
                }
                return result
              }
              playerSubmitAction(action, targetId)
            }}
          />
          {peekResult && me.role === 'girl' && (
            <div className="mt-3 bg-teal-950/50 border border-teal-700 rounded-xl p-3 text-center space-y-1">
              <p className="text-teal-300 text-sm font-semibold">Die Wölfe sind:</p>
              {peekResult.wolves.map(n => <p key={n} className="text-white font-bold">{n}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Tag – Diskussion */}
      {gs.status === 'day_discussion' && (
        <div className="space-y-4">
          <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-2xl p-4 text-center space-y-2">
            <p className="text-yellow-300 font-semibold">Diskutiert!</p>
            {gs.currentRound.deathNames.length > 0 && (
              <p className="text-gray-400 text-sm">Letzte Nacht gestorben: {gs.currentRound.deathNames.join(', ')}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => adminUpdate({ ...gs, status: 'day_vote' })}
              className="w-full py-4 bg-orange-600 rounded-2xl text-white font-bold active:scale-95 transition-all"
            >
              🗳️ Abstimmung starten
            </button>
          )}
          {!isAdmin && <p className="text-center text-gray-500 text-sm">Warte auf den Admin...</p>}
        </div>
      )}

      {/* Abstimmung */}
      {gs.status === 'day_vote' && (
        <VotePanel
          players={players} myId={myId} votes={currentVotes}
          votesVisible={gs.settings.votesVisible}
          voteType="day_elimination" onVote={playerSubmitVote} myVote={myVote}
        />
      )}

      {/* Tiebreaker */}
      {gs.status === 'tiebreaker' && (
        <div className="space-y-4">
          <div className="bg-orange-950/30 border border-orange-800/50 rounded-2xl p-4 text-center">
            <p className="text-orange-300 font-semibold">⚖️ Gleichstand!</p>
            <p className="text-gray-400 text-sm mt-1">
              {me.isMayor ? 'Du entscheidest als Bürgermeister.' : `${mayor?.displayName ?? 'Bürgermeister'} entscheidet...`}
            </p>
          </div>
          {me.isMayor && (
            <PlayerList
              players={alivePlayers.filter(p => p.id !== myId)}
              myId={myId} selectable
              onSelect={id => {
                if (isAdmin) {
                  adminUpdate(eliminatePlayer(gs, id, 'tiebreaker'))
                } else {
                  supabase.channel(`werwolf:${code}`).send({
                    type: 'broadcast', event: 'msg',
                    payload: { type: 'tiebreaker_pick', payload: { targetId: id } },
                  })
                }
              }}
            />
          )}
        </div>
      )}

      {/* Spielerliste */}
      <div className="space-y-2">
        <p className="text-gray-500 text-xs uppercase tracking-wider">Spieler</p>
        <PlayerList players={players} myId={myId} />
      </div>

      {/* Mini-game: aktiv wenn Spieler wartet (nicht sein Turn) */}
      {me.isAlive && roleRevealed && (
        <MiniGame
          score={myScore}
          onScore={handleScore}
          active={!(
            (gs.status === 'night' && gs.phase === me.role) ||
            (gs.status === 'night' && gs.phase === 'wolf' && me.role === 'werewolf') ||
            (gs.status === 'night' && gs.phase === 'witch' && me.role === 'witch') ||
            (gs.status === 'day_vote') ||
            (gs.status === 'mayor_election') ||
            (gs.status === 'tiebreaker' && me.isMayor)
          )}
        />
      )}

      {events.length > 0 && <GameLog events={events} />}

    </main>
  )
}
