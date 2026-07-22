import { supabase } from '@/lib/supabase'
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import {
  isGameState,
  isLobbySettings,
  isLobbyState,
  isRoleConfig,
  type GameState,
  type LobbyState,
  type NightActionRecord,
  type RoundData,
  type VoteRecord,
} from '@/lib/storage'
import { isLobbyCode, isPlainObject, isPlayerId } from '@/lib/validation'

export type BroadcastMsg =
  | { type: 'lobby_state'; payload: LobbyState }
  | { type: 'game_state'; payload: GameState }
  | { type: 'request_sync'; payload?: { joiningPlayer?: { id: string; name: string }; requesterId?: string } }
  | { type: 'player_joined'; payload: { id: string; name: string } }
  | { type: 'night_action'; payload: { phase: string; actorId: string; targetId: string | null; secondTargetId?: string | null; action: string } }
  | { type: 'vote'; payload: { voterId: string; targetId: string; voteType: string } }
  | { type: 'girl_peek_request'; payload: { requesterId: string } }
  | { type: 'girl_peek_result'; payload: { requesterId: string; wolves: string[] } }
  | { type: 'wolf_warning'; payload: { round: number } }
  | { type: 'score_update'; payload: { playerId: string; playerName: string; score: number } }
  | { type: 'rematch'; payload: { newCode: string; config: import('@/types/game').RoleConfig; settings: import('@/lib/storage').LobbyState['settings'] } }
  | { type: 'hunter_shoot'; payload: { hunterId: string; targetId: string } }
  | { type: 'mayor_pass'; payload: { mayorId: string; successorId: string } }
  | { type: 'tiebreaker_pick'; payload: { resolverId: string; targetId: string } }
  | { type: 'kicked'; payload: { playerId: string } }
  | { type: 'lobby_closed' }

const NIGHT_PHASES = new Set(['amor', 'priest', 'wolf', 'witch', 'seer'])
const NIGHT_ACTIONS = new Set(['kill', 'heal', 'poison', 'reveal', 'bless', 'peek', 'link', 'skip'])
const VOTE_TYPES = new Set(['mayor_election', 'day_elimination', 'tiebreaker'])

function isSafeName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 20
}

function isNullablePlayerId(value: unknown): value is string | null {
  return value === null || isPlayerId(value)
}

function isBroadcastLobbyState(value: unknown): value is LobbyState {
  return isLobbyState(value) &&
    isLobbyCode(value.code) &&
    value.players.length > 0 &&
    value.players.filter(player => player.isAdmin).length === 1
}

function isBroadcastGameState(value: unknown): value is GameState {
  return isGameState(value) &&
    isLobbyCode(value.code) &&
    value.players.length > 0 &&
    value.players.filter(player => player.isAdmin).length === 1
}

function hasPlayerPair(payload: Record<string, unknown>, first: string, second: string) {
  return isPlayerId(payload[first]) && isPlayerId(payload[second])
}

export function parseBroadcastMessage(value: unknown): BroadcastMsg | null {
  if (!isPlainObject(value) || typeof value.type !== 'string') return null
  const payload = value.payload

  switch (value.type) {
    case 'lobby_closed':
      return payload === undefined ? { type: 'lobby_closed' } : null
    case 'lobby_state':
      return isBroadcastLobbyState(payload) ? { type: 'lobby_state', payload } : null
    case 'game_state':
      return isBroadcastGameState(payload) ? { type: 'game_state', payload } : null
    case 'request_sync': {
      if (payload === undefined) return { type: 'request_sync' }
      if (!isPlainObject(payload)) return null
      if (payload.requesterId !== undefined && !isPlayerId(payload.requesterId)) return null
      if (payload.joiningPlayer !== undefined) {
        if (!isPlainObject(payload.joiningPlayer)) return null
        if (!isPlayerId(payload.joiningPlayer.id) || !isSafeName(payload.joiningPlayer.name)) return null
      }
      return value as BroadcastMsg
    }
    case 'player_joined':
      if (!isPlainObject(payload) || !isPlayerId(payload.id) || !isSafeName(payload.name)) return null
      return value as BroadcastMsg
    case 'night_action':
      if (!isPlainObject(payload)) return null
      if (!NIGHT_PHASES.has(String(payload.phase)) || !NIGHT_ACTIONS.has(String(payload.action))) return null
      if (!isPlayerId(payload.actorId) || !isNullablePlayerId(payload.targetId)) return null
      if (payload.secondTargetId !== undefined && !isNullablePlayerId(payload.secondTargetId)) return null
      return value as BroadcastMsg
    case 'vote':
      if (!isPlainObject(payload) || !hasPlayerPair(payload, 'voterId', 'targetId')) return null
      if (!VOTE_TYPES.has(String(payload.voteType))) return null
      return value as BroadcastMsg
    case 'girl_peek_request':
      return isPlainObject(payload) && isPlayerId(payload.requesterId) ? value as BroadcastMsg : null
    case 'girl_peek_result':
      if (!isPlainObject(payload) || !isPlayerId(payload.requesterId) || !Array.isArray(payload.wolves)) return null
      if (payload.wolves.length > 64 || !payload.wolves.every(isSafeName)) return null
      return value as BroadcastMsg
    case 'wolf_warning':
      return isPlainObject(payload) && Number.isSafeInteger(payload.round) && Number(payload.round) >= 0
        ? value as BroadcastMsg
        : null
    case 'score_update':
      if (!isPlainObject(payload) || !isPlayerId(payload.playerId) || !isSafeName(payload.playerName)) return null
      if (typeof payload.score !== 'number' || !Number.isSafeInteger(payload.score) || Math.abs(payload.score) > 1_000_000) return null
      return value as BroadcastMsg
    case 'rematch':
      if (!isPlainObject(payload) || !isLobbyCode(payload.newCode)) return null
      if (!isRoleConfig(payload.config) || !isLobbySettings(payload.settings)) return null
      return value as BroadcastMsg
    case 'hunter_shoot':
      return isPlainObject(payload) && hasPlayerPair(payload, 'hunterId', 'targetId') ? value as BroadcastMsg : null
    case 'mayor_pass':
      return isPlainObject(payload) && hasPlayerPair(payload, 'mayorId', 'successorId') ? value as BroadcastMsg : null
    case 'tiebreaker_pick':
      return isPlainObject(payload) && hasPlayerPair(payload, 'resolverId', 'targetId') ? value as BroadcastMsg : null
    case 'kicked':
      return isPlainObject(payload) && isPlayerId(payload.playerId) ? value as BroadcastMsg : null
    default:
      return null
  }
}

function messageMatchesLobby(message: BroadcastMsg, code: string): boolean {
  if (message.type === 'lobby_state' || message.type === 'game_state') {
    return message.payload.code === code
  }
  return true
}

async function sendWithRetry(
  channel: RealtimeChannel,
  event: string,
  payload: BroadcastMsg,
): Promise<RealtimeChannelSendResponse> {
  const deadline = Date.now() + 4_000
  while (channel.state !== 'joined' && Date.now() < deadline) {
    if (channel.state === 'closed' || channel.state === 'errored' || channel.state === 'leaving') {
      return 'error'
    }
    await new Promise(resolve => setTimeout(resolve, 40))
  }
  if (channel.state !== 'joined') return 'error'

  let result: RealtimeChannelSendResponse = 'error'
  for (let attempt = 0; attempt < 2; attempt += 1) {
    result = await channel.send({ type: 'broadcast', event, payload })
    if (result === 'ok') return result
  }
  return result
}

export function sendLobbyMessage(channel: RealtimeChannel, message: BroadcastMsg) {
  return sendWithRetry(channel, 'msg', message)
}

export function broadcastLobby(channel: RealtimeChannel, state: LobbyState) {
  return sendWithRetry(channel, 'msg', {
    type: 'lobby_state',
    payload: state,
  })
}

function cloneRound(round: RoundData): RoundData {
  return {
    ...round,
    nightActions: round.nightActions.map(action => ({ ...action })),
    votes: round.votes.map(vote => ({ ...vote })),
    deaths: [...round.deaths],
    deathNames: [...round.deathNames],
    tiedCandidateIds: round.tiedCandidateIds ? [...round.tiedCandidateIds] : round.tiedCandidateIds,
  }
}

function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    config: { ...state.config },
    settings: { ...state.settings },
    players: state.players.map(player => ({ ...player })),
    currentRound: cloneRound(state.currentRound),
    pendingResolution: state.pendingResolution
      ? { ...state.pendingResolution, hunterIds: [...state.pendingResolution.hunterIds] }
      : state.pendingResolution,
  }
}

function hiddenVote(vote: VoteRecord): VoteRecord {
  return {
    ...vote,
    voterId: '',
    voterName: '',
    targetId: '',
    targetName: '',
  }
}

function seerRevealTarget(state: GameState, viewerId: string): string | null {
  const viewer = state.players.find(player => player.id === viewerId)
  if (viewer?.role !== 'seer') return null

  const reveal = state.currentRound.nightActions.find(action => (
    action.actorId === viewerId &&
    action.phase === 'seer' &&
    action.action === 'reveal'
  ))
  return reveal?.targetId ?? null
}

function visibleNightActions(state: GameState, viewerId: string): NightActionRecord[] {
  const viewer = state.players.find(player => player.id === viewerId)
  if (!viewer) return []

  const visible = state.currentRound.nightActions.filter(action => {
    if (action.actorId === viewerId) return true
    if (viewer.role !== 'werewolf' || action.phase !== 'wolf' || action.action !== 'kill') return false

    const actor = state.players.find(player => player.id === action.actorId)
    return actor?.role === 'werewolf'
  }).map(action => ({ ...action }))

  // The witch needs the selected victim to make a heal decision, but never
  // receives the wolves' identities or their individual action records.
  if (
    viewer.role === 'witch' &&
    state.status === 'night' &&
    state.phase === 'witch' &&
    state.currentRound.wolfTarget
  ) {
    visible.unshift({
      phase: 'wolf',
      actorId: '',
      actorName: 'Wolf pack',
      targetId: state.currentRound.wolfTarget,
      targetName: state.currentRound.wolfTargetName,
      action: 'kill',
    })
  }

  return visible
}

/**
 * Produces the state a single player is allowed to receive. The input is never
 * mutated, so this helper can also be used at persistence or API boundaries.
 */
export function sanitizeGameStateForPlayer(state: GameState, viewerId: string): GameState {
  const viewer = state.players.find(player => player.id === viewerId)
  const isAdmin = viewer?.isAdmin === true
  if (isAdmin) return cloneGameState(state)

  const ended = state.status === 'ended' || state.winner !== null
  const revealTargetId = seerRevealTarget(state, viewerId)
  const viewerIsWolf = viewer?.role === 'werewolf'
  const maySeeWolfTarget = viewerIsWolf || (
    viewer?.role === 'witch' && state.status === 'night' && state.phase === 'witch'
  )

  const players = state.players.map(player => {
    const roleIsVisible = ended ||
      player.id === viewerId ||
      (viewerIsWolf && player.role === 'werewolf') ||
      player.id === revealTargetId

    return {
      ...player,
      role: roleIsVisible ? player.role : null,
      loverId: player.id === viewerId ? player.loverId : null,
      priestBlessed: player.id === viewerId ? player.priestBlessed : false,
    }
  })

  const votes = state.settings.votesVisible
    ? state.currentRound.votes.map(vote => ({ ...vote }))
    : state.currentRound.votes.map(vote => (
        vote.voterId === viewerId ? { ...vote } : hiddenVote(vote)
      ))

  const currentRound: RoundData = {
    ...cloneRound(state.currentRound),
    nightActions: visibleNightActions(state, viewerId),
    votes,
    wolfTarget: maySeeWolfTarget ? state.currentRound.wolfTarget : null,
    wolfTargetName: maySeeWolfTarget ? state.currentRound.wolfTargetName : null,
    priestProtected: false,
    healed: false,
    poisonTarget: null,
    poisonTargetName: null,
    eliminatedRole: ended ? state.currentRound.eliminatedRole : null,
  }

  const pending = state.pendingResolution
  const viewerIsPendingHunter = (
    viewer?.role === 'hunter' && viewer.isAlive === false && (pending?.hunterIds.includes(viewerId) ?? false)
  )
  const viewerIsPendingMayor = (
    viewer?.isMayor === true && viewer.isAlive === false && pending?.mayorId === viewerId
  )
  const pendingResolution = pending && (viewerIsPendingHunter || viewerIsPendingMayor)
    ? {
        ...pending,
        hunterIds: viewerIsPendingHunter ? [viewerId] : [],
        mayorId: viewerIsPendingMayor ? viewerId : null,
      }
    : null

  return {
    ...state,
    config: { ...state.config },
    settings: { ...state.settings },
    players,
    witchHealUsed: viewer?.role === 'witch' ? state.witchHealUsed : false,
    witchPoisonUsed: viewer?.role === 'witch' ? state.witchPoisonUsed : false,
    priestUsed: viewer?.role === 'priest' ? state.priestUsed : false,
    currentRound,
    pendingResolution,
  }
}

export function gameStateEvent(playerId: string) {
  return `game:${playerId}`
}

export function sendGameState(channel: RealtimeChannel, state: GameState, playerId: string) {
  return sendWithRetry(channel, gameStateEvent(playerId), {
    type: 'game_state',
    payload: sanitizeGameStateForPlayer(state, playerId),
  })
}

export async function broadcastGame(channel: RealtimeChannel, state: GameState) {
  const playerIds = new Set(state.players.map(player => player.id))
  const results = await Promise.all([...playerIds].map(playerId => (
    sendGameState(channel, state, playerId)
  )))
  return results.every(result => result === 'ok')
}

export function sendPlayerMessage(channel: RealtimeChannel, playerId: string, message: BroadcastMsg) {
  return sendWithRetry(channel, gameStateEvent(playerId), message)
}

export function subscribeToLobby(
  code: string,
  onMsg: (msg: BroadcastMsg) => void,
  playerId?: string,
) {
  const receive = (payload: unknown) => {
    const message = parseBroadcastMessage(payload)
    if (message && messageMatchesLobby(message, code)) onMsg(message)
  }

  let channel = supabase
    .channel(`werwolf:${code}`, { config: { broadcast: { ack: true } } })
    .on('broadcast', { event: 'msg' }, ({ payload }) => receive(payload))

  if (playerId) {
    channel = channel.on(
      'broadcast',
      { event: gameStateEvent(playerId) },
      ({ payload }) => receive(payload),
    )
  }

  return channel.subscribe()
}
