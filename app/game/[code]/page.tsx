'use client'

import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import {
  ArrowRight,
  Check,
  CircleAlert,
  Coins,
  Crosshair,
  Crown,
  Heart,
  House,
  LoaderCircle,
  Medal,
  MoonStar,
  RotateCcw,
  Scale,
  Skull,
  Sun,
  UsersRound,
  Vote as VoteIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  type GameState,
  type RoundData,
  loadAllRounds,
  loadGameState,
  loadMyPlayer,
  gameRevision,
  saveGameState,
  saveLobby,
  saveMyPlayer,
  saveRound,
  shouldAcceptGameState,
} from '@/lib/storage'
import {
  broadcastGame,
  sendGameState,
  sendLobbyMessage,
  sendPlayerMessage,
  subscribeToLobby,
  type BroadcastMsg,
} from '@/lib/broadcast'
import {
  advanceToPhase,
  applyNightAction,
  applyVote,
  hunterShoot,
  mayorPassTitle,
  nextNightPhase,
  resolveNight,
  resolveTiebreaker,
  resolveVotes,
} from '@/lib/gameEngine'
import { generateLobbyCode, randomChance } from '@/lib/roleAssignment'
import RoleCard from '@/components/RoleCard'
import PlayerList from '@/components/PlayerList'
import NightPhase from '@/components/NightPhase'
import VotePanel from '@/components/VotePanel'
import GameLog from '@/components/GameLog'
import MiniGame from '@/components/MiniGame'
import ScoreBoard, { type PlayerScore } from '@/components/ScoreBoard'
import { RoleIcon, WolfMark } from '@/components/icons'
import { useT, type TranslationKey, type Translator } from '@/lib/i18n'
import { type GameEvent, type NightAction, type Player, type Vote } from '@/types/game'

type NoticeTone = 'info' | 'danger' | 'success'

interface Notice {
  id: number
  message: string
  tone: NoticeTone
}

function toGameEvents(rounds: RoundData[], t: Translator): GameEvent[] {
  const events: GameEvent[] = []
  rounds.forEach(round => {
    if (round.mayorElectedName) {
      events.push({
        id: `${round.round}-mayor`,
        lobbyCode: round.code,
        round: round.round,
        phase: 'mayor_election',
        eventType: 'mayor_elected',
        description: t('game.events.mayorElected', { name: round.mayorElectedName }),
        createdAt: round.timestamp,
      })
    }
    round.deathNames.forEach((name, index) => {
      events.push({
        id: `${round.round}-death-${index}`,
        lobbyCode: round.code,
        round: round.round,
        phase: 'night',
        eventType: 'death',
        description: t('game.events.diedAtNight', { name }),
        createdAt: round.timestamp,
      })
    })
    if (round.healed && round.wolfTargetName) {
      events.push({
        id: `${round.round}-heal`,
        lobbyCode: round.code,
        round: round.round,
        phase: 'witch',
        eventType: 'heal',
        description: t('game.events.healed', { name: round.wolfTargetName }),
        createdAt: round.timestamp,
      })
    }
    if (round.poisonTargetName) {
      events.push({
        id: `${round.round}-poison`,
        lobbyCode: round.code,
        round: round.round,
        phase: 'witch',
        eventType: 'poison',
        description: t('game.events.poisoned', { name: round.poisonTargetName }),
        createdAt: round.timestamp,
      })
    }
    if (round.eliminatedName) {
      events.push({
        id: `${round.round}-elimination`,
        lobbyCode: round.code,
        round: round.round,
        phase: 'day_vote',
        eventType: round.foolRevealed ? 'fool_revealed' : 'death',
        description: round.foolRevealed
          ? t('game.events.foolRevealed', { name: round.eliminatedName })
          : t('game.events.eliminated', { name: round.eliminatedName }),
        createdAt: round.timestamp,
      })
    }
    if (round.winner) {
      events.push({
        id: `${round.round}-win`,
        lobbyCode: round.code,
        round: round.round,
        phase: 'end',
        eventType: 'win',
        description: t('game.events.decided'),
        createdAt: round.timestamp,
      })
    }
  })
  return events
}

function toNightActions(state: GameState): NightAction[] {
  return state.currentRound.nightActions.map((action, index) => ({
    id: `night-action-${index}`,
    lobbyCode: state.code,
    round: state.round,
    phase: action.phase,
    actorId: action.actorId,
    targetId: action.targetId,
    secondTargetId: action.secondTargetId,
    action: action.action as NightAction['action'],
    createdAt: '',
  }))
}

function toVotes(state: GameState, voteType: string): Vote[] {
  return state.currentRound.votes
    .filter(vote => vote.voteType === voteType)
    .map((vote, index) => ({
      id: `vote-${index}`,
      lobbyCode: state.code,
      round: state.round,
      voteType: vote.voteType as Vote['voteType'],
      voterId: vote.voterId,
      targetId: vote.targetId,
      createdAt: '',
    }))
}

function toPlayers(state: GameState): Player[] {
  return state.players.map(player => ({
    id: player.id,
    lobbyCode: state.code,
    userId: null,
    displayName: player.name,
    role: player.role,
    isAlive: player.isAlive,
    isAdmin: player.isAdmin,
    isMayor: player.isMayor,
    canVote: player.canVote,
    loverId: player.loverId,
    priestBlessed: player.priestBlessed,
    joinedAt: '',
  }))
}

function sendMessage(channel: RealtimeChannel | null, message: BroadcastMsg) {
  if (!channel) return Promise.resolve('error' as const)
  return sendLobbyMessage(channel, message)
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const t = useT()
  const stateRef = useRef<GameState | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const adminMessageHandlerRef = useRef<(message: BroadcastMsg) => void>(() => undefined)
  const broadcastQueueRef = useRef<Promise<boolean>>(Promise.resolve(true))
  const scoreRef = useRef(0)
  const noticeIdRef = useRef(0)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleConfirmed, setRoleConfirmed] = useState(false)
  const [cardRevealed, setCardRevealed] = useState(false)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [girlPeekResult, setGirlPeekResult] = useState<{ round: number; wolves: string[] } | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [scores, setScores] = useState<PlayerScore[]>([])
  const [rematchCode, setRematchCode] = useState<string | null>(null)

  const applyState = useCallback((state: GameState) => {
    stateRef.current = state
    setGameState(state)
  }, [])

  const notify = useCallback((message: string, tone: NoticeTone = 'info') => {
    const nextNotice = { id: ++noticeIdRef.current, message, tone }
    setNotice(nextNotice)
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3600)
  }, [])

  const adminUpdate = useCallback((nextState: GameState) => {
    const revision = Math.max(gameRevision(stateRef.current), gameRevision(nextState)) + 1
    const versionedState = { ...nextState, revision }
    saveGameState(versionedState)
    applyState(versionedState)

    const channel = channelRef.current
    if (!channel) {
      notify(t('lobby.notices.syncFailed'), 'danger')
      return
    }

    const send = () => broadcastGame(channel, versionedState)
    broadcastQueueRef.current = broadcastQueueRef.current.then(send, send).then(success => {
      if (!success) notify(t('lobby.notices.syncFailed'), 'danger')
      return success
    })
  }, [applyState, notify, t])

  useEffect(() => {
    const currentPlayer = loadMyPlayer(code)
    if (!currentPlayer) {
      router.replace('/')
      return
    }

    const saved = loadGameState(code)
    const initializeTimer = setTimeout(() => {
      setMyId(currentPlayer.id)
      setIsAdmin(currentPlayer.isAdmin)
      if (saved) applyState(saved)
    }, 0)

    const channel = subscribeToLobby(code, (message: BroadcastMsg) => {
      if (message.type === 'game_state') {
        if (currentPlayer.isAdmin) return
        const previous = stateRef.current
        if (!shouldAcceptGameState(previous, message.payload)) return
        if (previous && (message.payload.round !== previous.round || message.payload.status === 'ended')) {
          saveRound(previous.currentRound)
        }
        saveGameState(message.payload)
        applyState(message.payload)

        const ownVote = message.payload.currentRound.votes.find(vote => (
          vote.voterId === currentPlayer.id &&
          (vote.voteType === 'day_elimination' || vote.voteType === 'mayor_election')
        ))
        if (ownVote) setMyVote(ownVote.targetId)
        else if (message.payload.round !== previous?.round) setMyVote(null)
      }

      if (message.type === 'request_sync' && currentPlayer.isAdmin) {
        const current = stateRef.current
        if (!current) return
        const requesterId = message.payload?.requesterId
        if (requesterId && current.players.some(player => player.id === requesterId)) {
          void sendGameState(channel, current, requesterId)
        } else {
          void broadcastGame(channel, current)
        }
      }

      if (message.type === 'score_update') {
        const entry = message.payload
        setScores(previous => [
          ...previous.filter(score => score.playerId !== entry.playerId),
          entry,
        ])
      }

      if (message.type === 'rematch') {
        const current = loadMyPlayer(code)
        if (current) {
          saveMyPlayer(message.payload.newCode, { id: current.id, name: current.name, isAdmin: false })
          saveLobby({
            code: message.payload.newCode,
            config: message.payload.config,
            settings: message.payload.settings,
            players: [],
          })
        }
        setRematchCode(message.payload.newCode)
      }

      if (message.type === 'girl_peek_result' && message.payload.requesterId === currentPlayer.id) {
        setGirlPeekResult({ round: stateRef.current?.round ?? 0, wolves: message.payload.wolves })
      }

      if (message.type === 'wolf_warning' && message.payload.round === stateRef.current?.round) {
        notify(t('game.notices.wolfObserved'), 'danger')
      }

      if (message.type === 'kicked' && message.payload.playerId === currentPlayer.id) {
        router.replace('/?kicked=1')
      }
      if (message.type === 'lobby_closed') router.replace('/?closed=1')

      if (currentPlayer.isAdmin) adminMessageHandlerRef.current(message)
    }, currentPlayer.id)
    channelRef.current = channel

    let syncTimer: ReturnType<typeof setTimeout> | null = null
    let syncInterval: ReturnType<typeof setInterval> | null = null
    if (!currentPlayer.isAdmin) {
      const requestSync = () => {
        void sendMessage(channel, {
          type: 'request_sync',
          payload: { requesterId: currentPlayer.id },
        })
      }
      syncTimer = setTimeout(requestSync, 700)
      syncInterval = setInterval(requestSync, 15_000)
    }

    return () => {
      clearTimeout(initializeTimer)
      if (syncTimer) clearTimeout(syncTimer)
      if (syncInterval) clearInterval(syncInterval)
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
      supabase.removeChannel(channel)
      if (channelRef.current === channel) channelRef.current = null
    }
  }, [applyState, code, notify, router, t])

  const submitNightAction = useCallback((
    actorId: string,
    targetId: string | null,
    action: string,
    secondTargetId: string | null = null,
  ) => {
    const current = stateRef.current
    if (!current) return
    const updated = applyNightAction(
      current,
      actorId,
      targetId,
      action,
      current.phase ?? '',
      secondTargetId,
    )
    if (updated === current) {
      notify(t('game.notices.invalidAction'), 'danger')
      return
    }

    if (action === 'peek') {
      adminUpdate(updated)
      return
    }

    if (current.phase === 'wolf' && action === 'kill') {
      const wolves = updated.players.filter(player => player.role === 'werewolf' && player.isAlive)
      const votes = updated.currentRound.nightActions.filter(entry => entry.phase === 'wolf' && entry.action === 'kill')
      const allWolvesVoted = wolves.every(wolf => votes.some(vote => vote.actorId === wolf.id))
      const agreedTargets = new Set(votes.map(vote => vote.targetId))
      if (!allWolvesVoted || agreedTargets.size !== 1) {
        adminUpdate(updated)
        return
      }
    }

    if (current.phase === 'witch' && (action === 'heal' || action === 'poison')) {
      adminUpdate(updated)
      return
    }

    const nextPhase = nextNightPhase(updated)
    if (nextPhase) {
      adminUpdate(advanceToPhase(updated, nextPhase))
      return
    }

    const resolved = resolveNight(updated)
    if (resolved.currentRound.deathNames.length > 0) {
      notify(t('game.notices.nightDeaths', { names: resolved.currentRound.deathNames.join(', ') }), 'danger')
    }
    adminUpdate(resolved)
  }, [adminUpdate, notify, t])

  const submitVote = useCallback((voterId: string, targetId: string, voteType: string) => {
    const current = stateRef.current
    if (!current) return
    const updated = applyVote(current, voterId, targetId, voteType)
    if (updated === current) {
      notify(t('game.notices.invalidVote'), 'danger')
      return
    }

    const eligible = updated.players.filter(player => (
      player.isAlive && (voteType === 'mayor_election' || player.canVote)
    ))
    const castVotes = updated.currentRound.votes.filter(vote => vote.voteType === voteType)
    adminUpdate(castVotes.length >= eligible.length ? resolveVotes(updated, voteType) : updated)
  }, [adminUpdate, notify, t])

  useEffect(() => {
    if (!isAdmin) {
      adminMessageHandlerRef.current = () => undefined
      return
    }

    const handleAdminMessage = (message: BroadcastMsg) => {
      if (message.type === 'night_action') {
        const current = stateRef.current
        if (!current || current.phase !== message.payload.phase) return
        submitNightAction(
          message.payload.actorId,
          message.payload.targetId,
          message.payload.action,
          message.payload.secondTargetId ?? null,
        )
      }

      if (message.type === 'vote') {
        submitVote(message.payload.voterId, message.payload.targetId, message.payload.voteType)
      }

      if (message.type === 'girl_peek_request') {
        const current = stateRef.current
        if (!current) return
        const updated = applyNightAction(
          current,
          message.payload.requesterId,
          null,
          'peek',
          'wolf',
        )
        if (updated === current) return
        adminUpdate(updated)

        const wolves = updated.players
          .filter(player => player.role === 'werewolf' && player.isAlive)
          .map(player => player.name)
        if (channelRef.current) {
          void sendPlayerMessage(channelRef.current, message.payload.requesterId, {
            type: 'girl_peek_result',
            payload: { requesterId: message.payload.requesterId, wolves },
          })
        }

        if (randomChance(0.4)) {
          updated.players
            .filter(player => player.role === 'werewolf' && player.isAlive)
            .forEach(wolf => {
              if (channelRef.current) {
                void sendPlayerMessage(channelRef.current, wolf.id, {
                  type: 'wolf_warning',
                  payload: { round: updated.round },
                })
              }
            })
        }
      }

      if (message.type === 'hunter_shoot') {
        const current = stateRef.current
        if (current) adminUpdate(hunterShoot(current, message.payload.targetId, message.payload.hunterId))
      }

      if (message.type === 'mayor_pass') {
        const current = stateRef.current
        if (current) adminUpdate(mayorPassTitle(current, message.payload.successorId, message.payload.mayorId))
      }

      if (message.type === 'tiebreaker_pick') {
        const current = stateRef.current
        if (current) adminUpdate(resolveTiebreaker(current, message.payload.targetId, message.payload.resolverId))
      }
    }

    adminMessageHandlerRef.current = handleAdminMessage

    return () => {
      if (adminMessageHandlerRef.current === handleAdminMessage) {
        adminMessageHandlerRef.current = () => undefined
      }
    }
  }, [adminUpdate, isAdmin, submitNightAction, submitVote])

  function handleScore(delta: number) {
    const nextScore = scoreRef.current + delta
    scoreRef.current = nextScore
    setMyScore(nextScore)
    if (!myId) return
    const me = stateRef.current?.players.find(player => player.id === myId)
    const entry: PlayerScore = {
      playerId: myId,
      playerName: me?.name ?? t('game.unknownPlayer'),
      score: nextScore,
    }
    setScores(previous => [...previous.filter(score => score.playerId !== myId), entry])
    void sendMessage(channelRef.current, { type: 'score_update', payload: entry })
  }

  function handleRematch() {
    const current = stateRef.current
    if (!isAdmin || !current) return
    const ownPlayer = loadMyPlayer(code)
    if (!ownPlayer) return
    const nextCode = generateLobbyCode()
    saveMyPlayer(nextCode, { id: ownPlayer.id, name: ownPlayer.name, isAdmin: true })
    saveLobby({
      code: nextCode,
      config: current.config,
      settings: current.settings,
      players: [{ id: ownPlayer.id, name: ownPlayer.name, isAdmin: true }],
    })
    void sendMessage(channelRef.current, {
      type: 'rematch',
      payload: { newCode: nextCode, config: current.config, settings: current.settings },
    })
    window.location.assign(`/lobby/${nextCode}`)
  }

  async function playerSubmitAction(action: string, targetId?: string, secondTargetId?: string) {
    const current = stateRef.current
    if (!myId || !current) return
    if (isAdmin) {
      submitNightAction(myId, targetId ?? null, action, secondTargetId ?? null)
      return
    }

    const result = await sendMessage(channelRef.current, {
      type: 'night_action',
      payload: {
        phase: current.phase ?? '',
        actorId: myId,
        targetId: targetId ?? null,
        secondTargetId: secondTargetId ?? null,
        action,
      },
    })
    if (result !== 'ok') notify(t('game.notices.actionSendFailed'), 'danger')
  }

  async function requestGirlPeek() {
    const current = stateRef.current
    if (!myId || !current) return
    if (isAdmin) {
      const updated = applyNightAction(current, myId, null, 'peek', 'wolf')
      if (updated === current) return
      adminUpdate(updated)
      const wolves = updated.players
        .filter(player => player.role === 'werewolf' && player.isAlive)
        .map(player => player.name)
      setGirlPeekResult({ round: updated.round, wolves })
      if (randomChance(0.4)) {
        updated.players
          .filter(player => player.role === 'werewolf' && player.isAlive)
          .forEach(wolf => {
            if (channelRef.current) {
              void sendPlayerMessage(channelRef.current, wolf.id, { type: 'wolf_warning', payload: { round: updated.round } })
            }
          })
      }
      return
    }

    const result = await sendMessage(channelRef.current, {
      type: 'girl_peek_request',
      payload: { requesterId: myId },
    })
    if (result !== 'ok') notify(t('game.notices.peekSendFailed'), 'danger')
  }

  async function playerSubmitVote(targetId: string) {
    const current = stateRef.current
    if (!myId || !current) return
    const voteType = current.status === 'mayor_election' ? 'mayor_election' : 'day_elimination'
    setMyVote(targetId)

    if (isAdmin) {
      submitVote(myId, targetId, voteType)
      return
    }

    const result = await sendMessage(channelRef.current, {
      type: 'vote',
      payload: { voterId: myId, targetId, voteType },
    })
    if (result !== 'ok') {
      setMyVote(null)
      notify(t('game.notices.voteSendFailed'), 'danger')
    }
  }

  function chooseHunterTarget(targetId: string) {
    const current = stateRef.current
    if (!current || !myId) return
    if (isAdmin) {
      adminUpdate(hunterShoot(current, targetId, myId))
      return
    }
    void sendMessage(channelRef.current, {
      type: 'hunter_shoot',
      payload: { hunterId: myId, targetId },
    })
  }

  function chooseMayorSuccessor(successorId: string) {
    const current = stateRef.current
    if (!current || !myId) return
    if (isAdmin) {
      adminUpdate(mayorPassTitle(current, successorId, myId))
      return
    }
    void sendMessage(channelRef.current, {
      type: 'mayor_pass',
      payload: { mayorId: myId, successorId },
    })
  }

  function chooseTieTarget(targetId: string) {
    const current = stateRef.current
    if (!current || !myId) return
    if (isAdmin) {
      adminUpdate(resolveTiebreaker(current, targetId, myId))
      return
    }
    void sendMessage(channelRef.current, {
      type: 'tiebreaker_pick',
      payload: { resolverId: myId, targetId },
    })
  }

  if (!gameState || !myId) {
    return (
      <main className="ww-app-shell flex min-h-dvh items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-[var(--ww-muted)]" role="status">
          <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
          {t('game.loading')}
        </div>
      </main>
    )
  }

  const me = gameState.players.find(player => player.id === myId)
  if (!me) {
    return (
      <main className="ww-app-shell flex min-h-dvh items-center justify-center px-4">
        <section className="ww-panel max-w-sm text-center">
          <CircleAlert className="mx-auto text-[var(--ww-danger)]" aria-hidden="true" />
          <h1 className="mt-3 font-display text-2xl text-[var(--ww-text)]">{t('game.playerMissing')}</h1>
          <button type="button" onClick={() => router.replace('/')} className="ww-button ww-button-secondary mt-5 w-full">
            <House aria-hidden="true" />
            {t('game.home')}
          </button>
        </section>
      </main>
    )
  }

  const players = toPlayers(gameState)
  const alivePlayers = players.filter(player => player.isAlive)
  const lover = me.loverId ? players.find(player => player.id === me.loverId) : null
  const mayor = players.find(player => player.isMayor)
  const voteType = gameState.status === 'mayor_election' ? 'mayor_election' : 'day_elimination'
  const currentVotes = toVotes(gameState, voteType)
  const nightActions = toNightActions(gameState)
  const rounds = loadAllRounds(code)
  const events = toGameEvents(rounds, t)
  const currentGirlResult = girlPeekResult?.round === gameState.round
    ? { wolves: girlPeekResult.wolves }
    : null
  const girlPeeked = Boolean(currentGirlResult) || nightActions.some(action => (
    action.actorId === myId && action.phase === 'wolf' && action.action === 'peek'
  ))

  if (gameState.winner || gameState.status === 'ended') {
    return (
      <WinnerView
        gameState={gameState}
        players={players}
        scores={scores}
        myId={myId}
        isAdmin={isAdmin}
        rematchCode={rematchCode}
        onRematch={handleRematch}
        onHome={() => router.push('/')}
      />
    )
  }

  if (!roleConfirmed) {
    return (
      <main className="ww-app-shell flex min-h-dvh items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-5">
          <RoleCard
            role={me.role!}
            playerName={me.name}
            isMayor={me.isMayor}
            revealed={cardRevealed}
            onReveal={() => setCardRevealed(true)}
          />
          {cardRevealed && lover && <LoverCallout name={lover.displayName} />}
          <button
            type="button"
            onClick={() => setRoleConfirmed(true)}
            disabled={!cardRevealed}
            className="ww-button ww-button-primary w-full"
          >
            <Check aria-hidden="true" />
            {t('game.roleConfirm')}
          </button>
          <p className="text-center text-xs text-[var(--ww-muted)]">{t('game.roleSecret')}</p>
        </div>
      </main>
    )
  }

  const pendingHunter = gameState.status === 'hunter_pending' && gameState.pendingResolution?.hunterIds.includes(myId)
  const pendingMayor = gameState.status === 'mayor_pending' && gameState.pendingResolution?.mayorId === myId

  if (pendingHunter) {
    return (
      <FocusedActionView
        icon={<Crosshair aria-hidden="true" />}
        eyebrow={t('game.hunter.eyebrow')}
        title={t('game.hunter.title')}
        description={t('game.hunter.description')}
        tone="danger"
      >
        <PlayerList
          players={alivePlayers.filter(player => player.id !== myId)}
          myId={myId}
          selectable
          onSelect={chooseHunterTarget}
        />
      </FocusedActionView>
    )
  }

  if (pendingMayor) {
    return (
      <FocusedActionView
        icon={<Crown aria-hidden="true" />}
        eyebrow={t('game.mayorPass.eyebrow')}
        title={t('game.mayorPass.title')}
        description={t('game.mayorPass.description')}
        tone="gold"
      >
        <PlayerList
          players={alivePlayers.filter(player => player.id !== myId)}
          myId={myId}
          selectable
          onSelect={chooseMayorSuccessor}
        />
      </FocusedActionView>
    )
  }

  const tieCandidateIds = gameState.currentRound.tiedCandidateIds ?? []
  const tieCandidates = alivePlayers.filter(player => tieCandidateIds.includes(player.id))
  const electionTie = gameState.currentRound.tieBreakType === 'mayor_election'
  const canResolveTie = gameState.status === 'tiebreaker' && (
    (electionTie && isAdmin) || (!electionTie && me.isMayor)
  )
  const myTurn = (
    (gameState.status === 'night' && gameState.phase === me.role) ||
    (gameState.status === 'night' && gameState.phase === 'wolf' && (me.role === 'werewolf' || me.role === 'girl')) ||
    (gameState.status === 'day_vote' && me.canVote) ||
    gameState.status === 'mayor_election' ||
    canResolveTie
  )
  const phaseKey = `${gameState.round}:${gameState.status}:${gameState.phase ?? 'none'}`

  return (
    <main className="ww-app-shell min-h-dvh px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      {notice && <GameNotice key={notice.id} notice={notice} />}

      <div className="mx-auto w-full max-w-5xl">
        <header className="ww-game-header">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusIcon status={gameState.status} />
              <p className="ww-section-label">{statusLabel(t, gameState.status, gameState.phase)}</p>
            </div>
            <p className="mt-1 text-xs text-[var(--ww-muted)]">{t('game.round', { round: gameState.round })}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="flex items-center justify-end gap-1.5 truncate text-sm font-semibold text-[var(--ww-text)]">
              {me.isMayor && <Crown className="text-[var(--ww-gold)]" aria-label={t('game.mayor')} size={15} />}
              {me.role && <RoleIcon role={me.role} aria-hidden="true" size={15} />}
              {me.role ? t(`roles.${me.role}`) : t('roles.hidden')}
            </p>
            <p className="mt-1 text-xs text-[var(--ww-muted)]">{t('game.aliveCount', { alive: alivePlayers.length, total: players.length })}</p>
          </div>
        </header>
        {lover && <LoverCallout name={lover.displayName} />}

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(310px,0.8fr)]">
          <AnimatedPanel key={phaseKey} animationKey={phaseKey} className="ww-phase-panel ww-panel" phase={gameState.status}>
            {gameState.status === 'mayor_election' && (
              <VotePanel
                players={players}
                myId={myId}
                votes={currentVotes}
                votesVisible
                voteType="mayor_election"
                onVote={playerSubmitVote}
                myVote={myVote}
              />
            )}

            {gameState.status === 'night' && gameState.phase && (
              <NightPhase
                key={`${gameState.round}:${gameState.phase}`}
                phase={gameState.phase}
                myRole={me.role!}
                myId={myId}
                players={players}
                wolfTarget={gameState.currentRound.wolfTarget}
                witchHealUsed={gameState.witchHealUsed}
                witchPoisonUsed={gameState.witchPoisonUsed}
                priestUsed={gameState.priestUsed}
                girlPeeked={girlPeeked}
                girlPeekResult={currentGirlResult}
                nightActions={nightActions}
                onAction={async (action, targetId, secondTargetId) => {
                  if (action === 'peek') return requestGirlPeek()
                  return playerSubmitAction(action, targetId, secondTargetId)
                }}
              />
            )}

            {gameState.status === 'day_discussion' && (
              <section className="space-y-5 text-center" aria-labelledby="discussion-title">
                <span className="ww-orbit-icon mx-auto is-day"><Sun aria-hidden="true" size={26} /></span>
                <div>
                  <p className="ww-section-label justify-center">{t('game.discussion.eyebrow')}</p>
                  <h1 id="discussion-title" className="mt-2 font-display text-3xl text-[var(--ww-text)]">{t('game.discussion.title')}</h1>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ww-muted-strong)]">
                    {t('game.discussion.description')}
                  </p>
                </div>
                <div className={`ww-callout ${gameState.currentRound.deathNames.length > 0 ? 'is-danger' : 'is-success'}`}>
                  {gameState.currentRound.deathNames.length > 0 ? <Skull aria-hidden="true" /> : <Check aria-hidden="true" />}
                  <span>
                    {gameState.currentRound.deathNames.length > 0
                      ? t('game.discussion.deaths', { names: gameState.currentRound.deathNames.join(', ') })
                      : t('game.discussion.survived')}
                  </span>
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => adminUpdate({ ...gameState, status: 'day_vote' })}
                    className="ww-button ww-button-primary w-full"
                  >
                    <VoteIcon aria-hidden="true" />
                    {t('game.discussion.startVote')}
                  </button>
                ) : (
                  <p className="text-sm text-[var(--ww-muted)]" role="status">{t('game.discussion.waiting')}</p>
                )}
              </section>
            )}

            {gameState.status === 'day_vote' && (
              <VotePanel
                players={players}
                myId={myId}
                votes={currentVotes}
                votesVisible={gameState.settings.votesVisible}
                voteType="day_elimination"
                onVote={playerSubmitVote}
                myVote={myVote}
              />
            )}

            {gameState.status === 'tiebreaker' && (
              <section className="space-y-4 text-center" aria-labelledby="tie-title">
                <span className="ww-orbit-icon mx-auto is-gold"><Scale aria-hidden="true" size={26} /></span>
                <div>
                  <p className="ww-section-label justify-center">{t('game.tie.eyebrow')}</p>
                  <h1 id="tie-title" className="mt-2 font-display text-3xl text-[var(--ww-text)]">
                    {electionTie ? t('game.tie.hostDecides') : t('game.tie.mayorDecides')}
                  </h1>
                  <p className="mt-2 text-sm text-[var(--ww-muted)]">
                    {canResolveTie
                      ? t('game.tie.choose')
                      : electionTie
                        ? t('game.tie.waitingHost')
                        : t('game.tie.waitingMayor', { name: mayor?.displayName ?? t('game.tie.defaultMayor') })}
                  </p>
                </div>
                {canResolveTie ? (
                  <PlayerList players={tieCandidates} myId={myId} selectable onSelect={chooseTieTarget} />
                ) : (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--ww-muted)]" role="status">
                    <LoaderCircle className="animate-spin" aria-hidden="true" size={17} />
                    {t('game.tie.resolving')}
                  </div>
                )}
              </section>
            )}

            {(gameState.status === 'hunter_pending' || gameState.status === 'mayor_pending') && (
              <div className="py-10 text-center" role="status">
                <span className="ww-orbit-icon mx-auto"><LoaderCircle className="animate-spin" aria-hidden="true" size={24} /></span>
                <p className="mt-4 font-display text-xl text-[var(--ww-text)]">{t('game.pending.title')}</p>
                <p className="mt-1 text-sm text-[var(--ww-muted)]">{t('game.pending.description')}</p>
              </div>
            )}
          </AnimatedPanel>

          <aside className="space-y-4">
            <section className="ww-panel" aria-labelledby="roster-title">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UsersRound aria-hidden="true" size={16} />
                  <h2 id="roster-title" className="ww-section-label">{t('game.village')}</h2>
                </div>
                <span className="ww-status-chip">{t('game.activeCount', { count: alivePlayers.length })}</span>
              </div>
              <PlayerList players={players} myId={myId} />
            </section>

            {me.isAlive && (
              <MiniGame score={myScore} onScore={handleScore} active={!myTurn} />
            )}
            {scores.length > 0 && <ScoreBoard scores={scores} myId={myId} />}
            {events.length > 0 && <GameLog events={events} />}
          </aside>
        </div>
      </div>
    </main>
  )
}

function AnimatedPanel({
  animationKey,
  className,
  phase,
  children,
}: {
  animationKey: string
  className: string
  phase: string
  children: ReactNode
}) {
  const panelRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo(panel, { autoAlpha: 0, y: 18, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.48, clearProps: 'transform,opacity,visibility' })
          .fromTo(Array.from(panel.children), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.045, clearProps: 'transform,opacity,visibility' }, '-=0.24')
      })
    }, panel)
    return () => {
      media.revert()
      context.revert()
    }
  }, [animationKey])

  return <section ref={panelRef} className={className} data-phase={phase}>{children}</section>
}

function FocusedActionView({
  icon,
  eyebrow,
  title,
  description,
  tone,
  children,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  description: string
  tone: string
  children: ReactNode
}) {
  return (
    <main className="ww-app-shell flex min-h-dvh items-center justify-center px-4 py-8">
      <AnimatedPanel animationKey={eyebrow} phase={tone} className="ww-panel w-full max-w-md">
        <header className="mb-5 text-center">
          <span className={`ww-orbit-icon mx-auto is-${tone}`}>{icon}</span>
          <p className="ww-section-label mt-4 justify-center">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-[var(--ww-text)]">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--ww-muted)]">{description}</p>
        </header>
        {children}
      </AnimatedPanel>
    </main>
  )
}

function GameNotice({ notice }: { notice: Notice }) {
  return (
    <div className={`ww-game-notice is-${notice.tone}`} role="status" aria-live="polite">
      {notice.tone === 'danger'
        ? <CircleAlert aria-hidden="true" size={18} />
        : <Check aria-hidden="true" size={18} />}
      <span>{notice.message}</span>
    </div>
  )
}

function LoverCallout({ name }: { name: string }) {
  const t = useT()
  return (
    <div className="ww-callout is-love mt-4" role="status" aria-live="polite">
      <Heart aria-hidden="true" fill="currentColor" size={18} />
      <div>
        <p className="font-semibold">{t('game.lover.label')}</p>
        <p className="mt-0.5">{t('game.lover.description', { name })}</p>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  const props = { size: 16, 'aria-hidden': true as const }
  if (status === 'night') return <MoonStar {...props} />
  if (status === 'day_discussion') return <Sun {...props} />
  if (status === 'day_vote') return <VoteIcon {...props} />
  if (status === 'mayor_election') return <Crown {...props} />
  if (status === 'tiebreaker') return <Scale {...props} />
  if (status === 'hunter_pending') return <Crosshair {...props} />
  return <LoaderCircle {...props} />
}

function statusLabel(t: Translator, status: string, phase: string | null) {
  if (status === 'night') {
    const phaseKeys: Record<string, TranslationKey> = {
      amor: 'game.status.amor',
      priest: 'game.status.priest',
      wolf: 'game.status.wolf',
      witch: 'game.status.witch',
      seer: 'game.status.seer',
    }
    const phaseLabel = phaseKeys[phase ?? ''] ? t(phaseKeys[phase ?? '']) : t('game.status.waiting')
    return t('game.status.night', { phase: phaseLabel })
  }
  if (status === 'day_discussion') return t('game.status.discussion')
  if (status === 'day_vote') return t('game.status.vote')
  if (status === 'mayor_election') return t('game.status.election')
  if (status === 'tiebreaker') return t('game.status.tie')
  if (status === 'hunter_pending') return t('game.status.hunter')
  if (status === 'mayor_pending') return t('game.status.mayorPass')
  return t('game.status.active')
}

function WinnerView({
  gameState,
  players,
  scores,
  myId,
  isAdmin,
  rematchCode,
  onRematch,
  onHome,
}: {
  gameState: GameState
  players: Player[]
  scores: PlayerScore[]
  myId: string
  isAdmin: boolean
  rematchCode: string | null
  onRematch: () => void
  onHome: () => void
}) {
  const rootRef = useRef<HTMLElement>(null)
  const t = useT()
  const winner = gameState.winner
  const winnerLabel = winner === 'village'
    ? t('game.winner.village')
    : winner === 'wolves'
      ? t('game.winner.wolves')
      : winner === 'lovers'
        ? t('game.winner.lovers')
        : t('game.winner.ended')
  const sortedPlayers = [...players].sort((left, right) => {
    const leftScore = scores.find(score => score.playerId === left.id)?.score ?? 0
    const rightScore = scores.find(score => score.playerId === right.id)?.score ?? 0
    return rightScore - leftScore
  })

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('[data-winner-mark]', { autoAlpha: 0, scale: 0.62, rotate: -8 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.72, ease: 'back.out(1.45)', clearProps: 'transform,opacity,visibility' })
          .fromTo('[data-winner-copy]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08, clearProps: 'transform,opacity,visibility' }, '-=0.35')
          .fromTo('[data-result-row]', { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.36, stagger: 0.055, clearProps: 'transform,opacity,visibility' }, '-=0.2')
      })
    }, root)
    return () => {
      media.revert()
      context.revert()
    }
  }, [])

  return (
    <main ref={rootRef} className="ww-app-shell min-h-dvh px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <span data-winner-mark className={`ww-winner-mark is-${winner ?? 'ended'}`}>
            {winner === 'wolves'
              ? <WolfMark aria-hidden="true" size={54} />
              : winner === 'lovers'
                ? <Heart aria-hidden="true" size={50} />
                : <House aria-hidden="true" size={50} />}
          </span>
          <p data-winner-copy className="ww-section-label mt-5 justify-center">{t('game.winner.eyebrow')}</p>
          <h1 data-winner-copy className="mt-2 font-display text-4xl text-[var(--ww-text)] sm:text-5xl">{winnerLabel}</h1>
          <p data-winner-copy className="mt-2 text-sm text-[var(--ww-muted)]">{t('game.winner.rounds', { rounds: gameState.round })}</p>
        </header>

        <section className="ww-panel mt-7" aria-labelledby="results-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="results-title" className="ww-section-label">{t('game.winner.results')}</h2>
            <span className="ww-status-chip">{t('game.winner.playerCount', { count: players.length })}</span>
          </div>
          <ul className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const score = scores.find(entry => entry.playerId === player.id)?.score ?? 0
              return (
                <li
                  key={player.id}
                  data-result-row
                  className={`ww-score-row ${player.id === myId ? 'is-me' : ''} ${!player.isAlive ? 'is-dead' : ''}`}
                >
                  <span className="ww-role-icon" data-role={player.role ?? undefined}>
                    {player.role ? <RoleIcon role={player.role} aria-hidden="true" size={19} /> : <CircleAlert aria-hidden="true" size={19} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--ww-text)]">
                      {player.displayName}{player.id === myId ? ` · ${t('game.winner.you')}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ww-muted)]">{player.role ? t(`roles.${player.role}`) : t('roles.unknown')}</p>
                  </div>
                  {index < 3 && score > 0 && <Medal className="text-[var(--ww-gold)]" aria-label={t('game.winner.place', { place: index + 1 })} size={17} />}
                  <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-[var(--ww-gold)]" aria-label={t('game.winner.points', { score })}>
                    <Coins aria-hidden="true" size={15} />
                    {score}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {isAdmin ? (
            <button type="button" onClick={onRematch} className="ww-button ww-button-primary w-full">
              <RotateCcw aria-hidden="true" />
              {t('game.winner.rematch')}
            </button>
          ) : rematchCode ? (
            <button type="button" onClick={() => window.location.assign(`/lobby/${rematchCode}`)} className="ww-button ww-button-primary w-full">
              {t('game.winner.join')}
              <ArrowRight aria-hidden="true" />
            </button>
          ) : (
            <div className="ww-button ww-button-secondary w-full" role="status">
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              {t('game.winner.waiting')}
            </div>
          )}
          <button type="button" onClick={onHome} className="ww-button ww-button-secondary w-full">
            <House aria-hidden="true" />
            {t('game.home')}
          </button>
        </div>
      </div>
    </main>
  )
}
