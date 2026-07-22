import {
  GameState,
  LocalPlayer,
  PendingResolution,
  RoundData,
  makeEmptyRound,
  saveGameState,
  saveRound,
} from '@/lib/storage'
import { assignRoles } from '@/lib/roleAssignment'
import { checkWinCondition } from '@/lib/gameLogic'
import { Player, RoleConfig } from '@/types/game'

type VoteType = 'mayor_election' | 'day_elimination' | 'tiebreaker'
type TieBreakType = 'mayor_election' | 'day_elimination'
type ResolutionOrigin = PendingResolution['origin']

const MAX_PLAYERS = 64

// Convert LocalPlayer -> Player for gameLogic utilities.
function toPlayer(p: LocalPlayer): Player {
  return {
    id: p.id,
    lobbyCode: '',
    userId: null,
    displayName: p.name,
    role: p.role,
    isAlive: p.isAlive,
    isAdmin: p.isAdmin,
    isMayor: p.isMayor,
    canVote: p.canVote,
    loverId: p.loverId,
    priestBlessed: p.priestBlessed,
    joinedAt: '',
  }
}

function persist(state: GameState): GameState {
  saveGameState(state)
  return state
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)]
}

export function isValidRoleSetup(config: RoleConfig, playerCount: number): boolean {
  const counts = Object.values(config)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const villageCount = total - config.werewolf

  return Number.isSafeInteger(playerCount) &&
    playerCount >= 5 &&
    playerCount <= MAX_PLAYERS &&
    counts.every(count => Number.isSafeInteger(count) && count >= 0 && count <= MAX_PLAYERS) &&
    total === playerCount &&
    config.werewolf > 0 &&
    config.werewolf < villageCount
}

function clearTie(round: RoundData): RoundData {
  return { ...round, tiedCandidateIds: [], tieBreakType: null }
}

function playerById(state: GameState, id: string | null | undefined): LocalPlayer | null {
  if (!id) return null
  return state.players.find(player => player.id === id) ?? null
}

function alivePlayerById(state: GameState, id: string | null | undefined): LocalPlayer | null {
  const player = playerById(state, id)
  return player?.isAlive ? player : null
}

function collectDeaths(players: LocalPlayer[], initialIds: string[]): string[] {
  const deaths: string[] = []
  const queue = [...initialIds]

  while (queue.length > 0) {
    const id = queue.shift()!
    if (deaths.includes(id)) continue

    const player = players.find(candidate => candidate.id === id)
    if (!player?.isAlive) continue

    deaths.push(id)
    if (player.loverId && !deaths.includes(player.loverId)) queue.push(player.loverId)
  }

  return deaths
}

function markDead(players: LocalPlayer[], ids: string[]): LocalPlayer[] {
  return players.map(player => (ids.includes(player.id) ? { ...player, isAlive: false } : player))
}

function pendingForDeaths(
  state: GameState,
  origin: ResolutionOrigin,
  deathIds: string[]
): PendingResolution {
  const hunterIds = deathIds.filter(id => state.players.find(player => player.id === id)?.role === 'hunter')
  const mayorId = deathIds.find(id => state.players.find(player => player.id === id)?.isMayor) ?? null

  return {
    origin,
    hunterIds: unique(hunterIds),
    mayorId,
    nextStatus: origin === 'night' ? 'day_discussion' : 'night',
    nextRound: origin === 'night' ? state.round : state.round + 1,
  }
}

function legacyPendingResolution(state: GameState): PendingResolution | null {
  if (state.status !== 'hunter_pending' && state.status !== 'mayor_pending') return null

  const origin: ResolutionOrigin = state.currentRound.eliminated ? 'day' : 'night'
  const eliminated = playerById(state, state.currentRound.eliminated)
  const relevantIds = origin === 'day'
    ? unique([
        ...(eliminated ? [eliminated.id] : []),
        ...(eliminated?.loverId ? [eliminated.loverId] : []),
      ])
    : unique(state.currentRound.deaths)

  const hunterIds = relevantIds.filter(id => {
    const player = playerById(state, id)
    return player?.role === 'hunter' && !player.isAlive
  })
  const mayorId = relevantIds.find(id => {
    const player = playerById(state, id)
    return player?.isMayor && !player.isAlive
  }) ?? null

  return {
    origin,
    hunterIds,
    mayorId,
    nextStatus: origin === 'night' ? 'day_discussion' : 'night',
    nextRound: origin === 'night' ? state.round : state.round + 1,
  }
}

function getPendingResolution(state: GameState): PendingResolution | null {
  const pending = state.pendingResolution
  if (pending) {
    return {
      origin: pending.origin === 'day' ? 'day' : 'night',
      hunterIds: Array.isArray(pending.hunterIds) ? unique(pending.hunterIds) : [],
      mayorId: pending.mayorId ?? null,
      nextStatus: pending.origin === 'day' ? 'night' : 'day_discussion',
      nextRound: pending.origin === 'day' ? state.round + 1 : state.round,
    }
  }
  return legacyPendingResolution(state)
}

function startNextNight(state: GameState, nextRound: number): GameState {
  saveRound(state.currentRound)
  const base: GameState = {
    ...state,
    status: 'night',
    phase: null,
    round: nextRound,
    currentRound: makeEmptyRound(state.code, nextRound),
    pendingResolution: null,
    winner: null,
  }
  return persist({ ...base, phase: nextNightPhase(base) })
}

function completePendingResolution(state: GameState, pending: PendingResolution): GameState {
  if (pending.origin === 'night') {
    const round = { ...state.currentRound, winner: null }
    saveRound(round)
    return persist({
      ...state,
      status: 'day_discussion',
      phase: null,
      currentRound: round,
      pendingResolution: null,
      winner: null,
    })
  }

  return startNextNight(
    { ...state, pendingResolution: null, winner: null },
    pending.nextRound
  )
}

function finalizeDeaths(state: GameState, pending: PendingResolution): GameState {
  const hunterIds = unique(pending.hunterIds).filter(id => {
    const player = playerById(state, id)
    return player?.role === 'hunter' && !player.isAlive
  })
  const mayor = playerById(state, pending.mayorId)
  const mayorId = mayor?.isMayor && !mayor.isAlive ? mayor.id : null
  const normalizedPending: PendingResolution = { ...pending, hunterIds, mayorId }
  const currentRound = { ...state.currentRound, winner: null }

  // Hunter shots are resolved before checking a winner because the shot can
  // reverse an otherwise terminal wolf/village count.
  if (hunterIds.length > 0) {
    saveRound(currentRound)
    return persist({
      ...state,
      status: 'hunter_pending',
      phase: null,
      currentRound,
      pendingResolution: normalizedPending,
      winner: null,
    })
  }

  const winner = checkWinCondition(state.players.map(toPlayer))
  if (winner) {
    const round = { ...currentRound, winner }
    saveRound(round)
    return persist({
      ...state,
      status: 'ended',
      phase: null,
      currentRound: round,
      pendingResolution: null,
      winner,
    })
  }

  if (mayorId) {
    saveRound(currentRound)
    return persist({
      ...state,
      status: 'mayor_pending',
      phase: null,
      currentRound,
      pendingResolution: normalizedPending,
      winner: null,
    })
  }

  return completePendingResolution(
    { ...state, currentRound, pendingResolution: normalizedPending, winner: null },
    normalizedPending
  )
}

function isVoteType(value: string): value is VoteType {
  return value === 'mayor_election' || value === 'day_elimination' || value === 'tiebreaker'
}

function expectedVoteStatus(voteType: VoteType): string {
  if (voteType === 'mayor_election') return 'mayor_election'
  if (voteType === 'day_elimination') return 'day_vote'
  return 'tiebreaker'
}

function getTieBreakType(state: GameState): TieBreakType {
  return state.currentRound.tieBreakType === 'mayor_election'
    ? 'mayor_election'
    : 'day_elimination'
}

function topVoteTargets(state: GameState, voteType: 'mayor_election' | 'day_elimination'): string[] {
  const counts = new Map<string, number>()
  const aliveIds = new Set(state.players.filter(player => player.isAlive).map(player => player.id))

  for (const vote of state.currentRound.votes) {
    if (vote.voteType !== voteType || !aliveIds.has(vote.targetId)) continue
    counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1)
  }

  let maximum = 0
  let targets: string[] = []
  for (const [targetId, count] of counts) {
    if (count > maximum) {
      maximum = count
      targets = [targetId]
    } else if (count === maximum) {
      targets.push(targetId)
    }
  }
  return targets
}

function tiedCandidates(state: GameState, tieBreakType = getTieBreakType(state)): string[] {
  const stored = state.currentRound.tiedCandidateIds
  const candidates = stored && stored.length > 0
    ? stored
    : topVoteTargets(state, tieBreakType)
  return unique(candidates).filter(id => alivePlayerById(state, id))
}

function electMayor(state: GameState, targetId: string): GameState {
  const target = alivePlayerById(state, targetId)
  if (!target) return state

  const players = state.players.map(player => ({ ...player, isMayor: player.id === targetId }))
  const round: RoundData = {
    ...clearTie(state.currentRound),
    mayorElected: targetId,
    mayorElectedName: target.name,
  }
  saveRound(round)

  const base: GameState = {
    ...state,
    players,
    status: 'night',
    phase: null,
    round: 1,
    currentRound: makeEmptyRound(state.code, 1),
    pendingResolution: null,
    winner: null,
  }
  return persist({ ...base, phase: nextNightPhase(base) })
}

export function startGame(state: GameState): GameState {
  const ids = state.players.map(player => player.id)
  const canStart = state.status === 'waiting' &&
    state.round === 0 &&
    new Set(ids).size === ids.length &&
    state.players.every(player => player.isAlive) &&
    isValidRoleSetup(state.config, state.players.length)

  if (!canStart) return state

  const roleMap = assignRoles(ids, state.config)
  const players = state.players.map(player => ({
    ...player,
    role: roleMap.get(player.id) ?? 'villager' as const,
  }))

  if (state.settings.mayorEnabled) {
    return persist({
      ...state,
      players,
      status: 'mayor_election',
      phase: null,
      round: 0,
      currentRound: makeEmptyRound(state.code, 0),
      pendingResolution: null,
      winner: null,
    })
  }

  // Round one starts immediately when mayor mode is disabled. This also keeps
  // Amor's one-time phase on the actual first night.
  const base: GameState = {
    ...state,
    players,
    status: 'night',
    phase: null,
    round: 1,
    currentRound: makeEmptyRound(state.code, 1),
    pendingResolution: null,
    winner: null,
  }
  return persist({ ...base, phase: nextNightPhase(base) })
}

export function applyNightAction(
  state: GameState,
  actorId: string,
  targetId: string | null,
  action: string,
  phase: string,
  secondTargetId: string | null = null
): GameState {
  if (state.status !== 'night' || state.phase !== phase) return state

  const actor = alivePlayerById(state, actorId)
  const target = alivePlayerById(state, targetId)
  const secondTarget = alivePlayerById(state, secondTargetId)
  if (!actor) return state

  const actorActions = state.currentRound.nightActions.filter(
    entry => entry.actorId === actorId && entry.phase === phase
  )

  switch (action) {
    case 'kill':
      if (
        phase !== 'wolf' ||
        actor.role !== 'werewolf' ||
        !target ||
        target.id === actor.id ||
        target.role === 'werewolf'
      ) return state
      break
    case 'peek':
      if (
        phase !== 'wolf' ||
        actor.role !== 'girl' ||
        targetId !== null ||
        actorActions.some(entry => entry.action === 'peek')
      ) return state
      break
    case 'bless':
      if (
        phase !== 'priest' ||
        actor.role !== 'priest' ||
        state.priestUsed ||
        !target ||
        actorActions.some(entry => entry.action === 'bless')
      ) return state
      break
    case 'heal':
      if (
        phase !== 'witch' ||
        actor.role !== 'witch' ||
        state.witchHealUsed ||
        !target ||
        target.id !== state.currentRound.wolfTarget ||
        actorActions.some(entry => entry.action === 'heal')
      ) return state
      break
    case 'poison':
      if (
        phase !== 'witch' ||
        actor.role !== 'witch' ||
        state.witchPoisonUsed ||
        !target ||
        actorActions.some(entry => entry.action === 'poison')
      ) return state
      break
    case 'reveal':
      if (
        phase !== 'seer' ||
        actor.role !== 'seer' ||
        !target ||
        target.id === actor.id ||
        actorActions.some(entry => entry.action === 'reveal')
      ) return state
      break
    case 'link':
      if (
        phase !== 'amor' ||
        actor.role !== 'amor' ||
        !target ||
        !secondTarget ||
        target.id === secondTarget.id ||
        target.id === actor.id ||
        secondTarget.id === actor.id ||
        target.loverId !== null ||
        secondTarget.loverId !== null ||
        actorActions.some(entry => entry.action === 'link')
      ) return state
      break
    case 'skip':
      if (phase !== 'witch' || actor.role !== 'witch' || actorActions.some(entry => entry.action === 'skip')) {
        return state
      }
      break
    default:
      return state
  }

  const record = {
    phase,
    actorId,
    actorName: actor.name,
    targetId,
    targetName: target?.name ?? null,
    secondTargetId,
    secondTargetName: secondTarget?.name ?? null,
    action,
  }

  let players = [...state.players]
  let { witchHealUsed, witchPoisonUsed, priestUsed } = state
  const retainedActions = action === 'kill' && phase === 'wolf'
    ? state.currentRound.nightActions.filter(entry => !(
        entry.actorId === actorId && entry.phase === 'wolf' && entry.action === 'kill'
      ))
    : state.currentRound.nightActions
  let round = {
    ...state.currentRound,
    nightActions: [...retainedActions, record],
  }

  if (action === 'bless' && target) {
    players = players.map(player => (
      player.id === target.id ? { ...player, priestBlessed: true } : player
    ))
    priestUsed = true
  }

  if (action === 'heal') witchHealUsed = true
  if (action === 'poison') witchPoisonUsed = true

  if (action === 'link' && target && secondTarget) {
    players = players.map(player => {
      if (player.id === target.id) return { ...player, loverId: secondTarget.id }
      if (player.id === secondTarget.id) return { ...player, loverId: target.id }
      return player
    })
  }

  if (action === 'kill' && target) {
    round = { ...round, wolfTarget: target.id, wolfTargetName: target.name }
  }

  return persist({
    ...state,
    players,
    witchHealUsed,
    witchPoisonUsed,
    priestUsed,
    currentRound: round,
  })
}

export function resolveNight(state: GameState): GameState {
  if (state.status !== 'night') return state
  if (nextNightPhase(state) !== null) return state

  const aliveWolves = state.players.filter(player => player.isAlive && player.role === 'werewolf')
  const validWolfActions = state.currentRound.nightActions.filter(action => {
    const actor = alivePlayerById(state, action.actorId)
    const target = alivePlayerById(state, action.targetId)
    return action.phase === 'wolf' && action.action === 'kill' &&
      actor?.role === 'werewolf' && !!target && target.role !== 'werewolf'
  })
  const wolfTargetIds = new Set(validWolfActions.map(action => action.targetId))

  // The pack must reach one explicit target before the night can advance.
  if (
    aliveWolves.length > 0 &&
    (
      !aliveWolves.every(wolf => validWolfActions.some(action => action.actorId === wolf.id)) ||
      wolfTargetIds.size !== 1
    )
  ) return state

  let players = [...state.players]
  let round = { ...state.currentRound }
  const agreedWolfTargetId = validWolfActions[0]?.targetId ?? null
  const validWolfTarget = alivePlayerById(state, agreedWolfTargetId)
  const wolfTarget = validWolfTarget?.role !== 'werewolf' ? validWolfTarget : null

  const deaths: string[] = []

  if (wolfTarget) {
    const witchHeal = state.currentRound.nightActions.find(action => {
      const actor = alivePlayerById(state, action.actorId)
      return action.phase === 'witch' && action.action === 'heal' &&
        actor?.role === 'witch' && action.targetId === wolfTarget.id
    })

    if (wolfTarget.priestBlessed) {
      round = { ...round, priestProtected: true }
    } else if (witchHeal) {
      round = { ...round, healed: true }
    } else {
      deaths.push(wolfTarget.id)
    }
  }

  const poison = state.currentRound.nightActions.find(action => {
    const actor = alivePlayerById(state, action.actorId)
    const target = alivePlayerById(state, action.targetId)
    return action.phase === 'witch' && action.action === 'poison' &&
      actor?.role === 'witch' && !!target
  })
  if (poison?.targetId) {
    const target = alivePlayerById(state, poison.targetId)
    if (target) {
      deaths.push(target.id)
      round = { ...round, poisonTarget: target.id, poisonTargetName: target.name }
    }
  }

  const deathIds = collectDeaths(players, unique(deaths))
  const deathNames = deathIds.map(id => players.find(player => player.id === id)?.name ?? '')
  players = markDead(players, deathIds).map(player => ({ ...player, priestBlessed: false }))
  round = { ...round, deaths: deathIds, deathNames, winner: null }

  const base: GameState = {
    ...state,
    players,
    status: 'day_discussion',
    phase: null,
    currentRound: round,
    winner: null,
  }
  return finalizeDeaths(base, pendingForDeaths(base, 'night', deathIds))
}

export function applyVote(
  state: GameState,
  voterId: string,
  targetId: string,
  voteType: string
): GameState {
  if (!isVoteType(voteType) || state.status !== expectedVoteStatus(voteType)) return state

  const voter = alivePlayerById(state, voterId)
  const target = alivePlayerById(state, targetId)
  if (!voter || !target || voter.id === target.id) return state
  if (voteType !== 'mayor_election' && !voter.canVote) return state

  if (voteType === 'tiebreaker') {
    const type = getTieBreakType(state)
    const resolver = type === 'mayor_election'
      ? voter.isAdmin
      : voter.isMayor
    if (!resolver || !tiedCandidates(state, type).includes(targetId)) return state
  }

  if (state.currentRound.votes.some(vote => vote.voterId === voterId && vote.voteType === voteType)) {
    return state
  }

  const record = {
    voterId,
    voterName: voter.name,
    targetId,
    targetName: target.name,
    voteType,
  }
  const round = { ...state.currentRound, votes: [...state.currentRound.votes, record] }
  return persist({ ...state, currentRound: round })
}

export function resolveVotes(state: GameState, voteType: string): GameState {
  if (!isVoteType(voteType) || state.status !== expectedVoteStatus(voteType)) return state

  if (voteType === 'tiebreaker') {
    const vote = state.currentRound.votes.find(entry => entry.voteType === 'tiebreaker')
    return vote ? resolveTiebreaker(state, vote.targetId, vote.voterId) : state
  }

  const eligible = state.players.filter(player => (
    player.isAlive && (voteType === 'mayor_election' || player.canVote)
  ))
  const eligibleIds = new Set(eligible.map(player => player.id))
  const validVotes = new Map<string, (typeof state.currentRound.votes)[number]>()

  for (const vote of state.currentRound.votes) {
    if (vote.voteType !== voteType || validVotes.has(vote.voterId)) continue
    const voter = alivePlayerById(state, vote.voterId)
    const target = alivePlayerById(state, vote.targetId)
    if (!voter || !target || voter.id === target.id || !eligibleIds.has(voter.id)) continue
    validVotes.set(voter.id, vote)
  }

  if (eligible.length === 0 || validVotes.size !== eligible.length) return state

  const counts = new Map<string, number>()
  for (const vote of validVotes.values()) {
    counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1)
  }

  let maxVotes = 0
  let topTargets: string[] = []
  for (const [id, count] of counts) {
    if (count > maxVotes) {
      maxVotes = count
      topTargets = [id]
    } else if (count === maxVotes) {
      topTargets.push(id)
    }
  }
  if (topTargets.length === 0) return state

  if (voteType === 'mayor_election') {
    if (topTargets.length === 1) return electMayor(state, topTargets[0])

    const round: RoundData = {
      ...state.currentRound,
      tiedCandidateIds: topTargets,
      tieBreakType: 'mayor_election',
    }
    return persist({ ...state, status: 'tiebreaker', phase: null, currentRound: round })
  }

  if (topTargets.length > 1) {
    const mayor = state.players.find(player => player.isMayor && player.isAlive)
    const round: RoundData = {
      ...state.currentRound,
      tiedCandidateIds: topTargets,
      tieBreakType: 'day_elimination',
    }

    if (!mayor) {
      saveRound(round)
      return startNextNight(
        { ...state, currentRound: round, pendingResolution: null, winner: null },
        state.round + 1
      )
    }

    return persist({
      ...state,
      status: 'tiebreaker',
      phase: null,
      currentRound: round,
      pendingResolution: null,
    })
  }

  return eliminatePlayer(state, topTargets[0], 'day_vote')
}

export function resolveTiebreaker(
  state: GameState,
  targetId: string,
  resolverId?: string
): GameState {
  if (state.status !== 'tiebreaker') return state

  const type = getTieBreakType(state)
  if (!tiedCandidates(state, type).includes(targetId)) return state

  if (type === 'mayor_election') {
    const resolver = alivePlayerById(state, resolverId)
    if (!resolver?.isAdmin) return state
    return electMayor(state, targetId)
  }

  const mayor = state.players.find(player => player.isAlive && player.isMayor)
  if (!mayor || (resolverId !== undefined && resolverId !== mayor.id)) return state
  return eliminatePlayer(state, targetId, 'tiebreaker', resolverId)
}

export function eliminatePlayer(
  state: GameState,
  targetId: string,
  phase: string,
  resolverId?: string
): GameState {
  const target = alivePlayerById(state, targetId)
  if (!target) return state

  if (phase === 'day_vote') {
    if (state.status !== 'day_vote') return state
  } else if (phase === 'tiebreaker') {
    if (
      state.status !== 'tiebreaker' ||
      getTieBreakType(state) !== 'day_elimination' ||
      !tiedCandidates(state, 'day_elimination').includes(targetId)
    ) return state

    const mayor = state.players.find(player => player.isAlive && player.isMayor)
    if (!mayor || (resolverId !== undefined && resolverId !== mayor.id)) return state
  } else {
    return state
  }

  let round = clearTie(state.currentRound)

  // The fool survives a community elimination but permanently loses the vote.
  if (target.role === 'fool') {
    const players = state.players.map(player => (
      player.id === targetId ? { ...player, canVote: false } : player
    ))
    round = {
      ...round,
      foolRevealed: true,
      eliminated: targetId,
      eliminatedName: target.name,
      eliminatedRole: 'fool',
      winner: null,
    }
    saveRound(round)
    return startNextNight(
      { ...state, players, currentRound: round, pendingResolution: null, winner: null },
      state.round + 1
    )
  }

  const deathIds = collectDeaths(state.players, [targetId])
  const players = markDead(state.players, deathIds)
  const chainedDeaths = deathIds.filter(id => id !== targetId)
  const addedDeathIds = chainedDeaths.filter(id => !round.deaths.includes(id))
  round = {
    ...round,
    deaths: [...round.deaths, ...addedDeathIds],
    deathNames: [
      ...round.deathNames,
      ...addedDeathIds.map(id => state.players.find(player => player.id === id)?.name ?? ''),
    ],
    eliminated: targetId,
    eliminatedName: target.name,
    eliminatedRole: target.role,
    winner: null,
  }

  const base: GameState = {
    ...state,
    players,
    phase: null,
    currentRound: round,
    pendingResolution: null,
    winner: null,
  }
  return finalizeDeaths(base, pendingForDeaths(base, 'day', deathIds))
}

export function hunterShoot(
  state: GameState,
  targetId: string,
  hunterId?: string
): GameState {
  if (state.status !== 'hunter_pending') return state

  const pending = getPendingResolution(state)
  if (!pending || pending.hunterIds.length === 0) return state

  const shooterId = hunterId ?? pending.hunterIds[0]
  const shooter = playerById(state, shooterId)
  const target = alivePlayerById(state, targetId)
  if (
    !pending.hunterIds.includes(shooterId) ||
    shooter?.role !== 'hunter' ||
    shooter.isAlive ||
    !target
  ) return state

  const deathIds = collectDeaths(state.players, [targetId])
  const players = markDead(state.players, deathIds)
  const addedDeathIds = deathIds.filter(id => !state.currentRound.deaths.includes(id))
  const round: RoundData = {
    ...state.currentRound,
    deaths: [...state.currentRound.deaths, ...addedDeathIds],
    deathNames: [
      ...state.currentRound.deathNames,
      ...addedDeathIds.map(id => state.players.find(player => player.id === id)?.name ?? ''),
    ],
    winner: null,
  }

  const newlyPending = pendingForDeaths({ ...state, players }, pending.origin, deathIds)
  const nextPending: PendingResolution = {
    ...pending,
    hunterIds: unique([
      ...pending.hunterIds.filter(id => id !== shooterId),
      ...newlyPending.hunterIds,
    ]),
    mayorId: pending.mayorId ?? newlyPending.mayorId,
  }
  const base: GameState = {
    ...state,
    players,
    phase: null,
    currentRound: round,
    pendingResolution: nextPending,
    winner: null,
  }
  return finalizeDeaths(base, nextPending)
}

export function mayorPassTitle(
  state: GameState,
  successorId: string,
  mayorId?: string
): GameState {
  if (state.status !== 'mayor_pending') return state

  const pending = getPendingResolution(state)
  if (!pending?.mayorId) return state

  const outgoingMayor = playerById(state, pending.mayorId)
  const successor = alivePlayerById(state, successorId)
  if (
    !outgoingMayor?.isMayor ||
    outgoingMayor.isAlive ||
    (mayorId !== undefined && mayorId !== outgoingMayor.id) ||
    !successor ||
    successor.id === outgoingMayor.id
  ) return state

  const players = state.players.map(player => ({
    ...player,
    isMayor: player.id === successor.id,
  }))
  const nextPending: PendingResolution = { ...pending, mayorId: null }
  return completePendingResolution(
    {
      ...state,
      players,
      phase: null,
      pendingResolution: nextPending,
      winner: null,
    },
    nextPending
  )
}

export function advanceToPhase(state: GameState, phase: string): GameState {
  if (state.status !== 'night' || nextNightPhase(state) !== phase) return state
  return persist({ ...state, phase })
}

export function nextNightPhase(state: GameState): string | null {
  const { config, round } = state
  const hasAliveRole = (role: LocalPlayer['role']) => (
    state.players.some(player => player.isAlive && player.role === role)
  )
  const phases: string[] = []

  if (round === 1 && config.amor > 0 && hasAliveRole('amor')) phases.push('amor')
  if (
    config.priest > 0 &&
    (state.phase === 'priest' || !state.priestUsed) &&
    hasAliveRole('priest')
  ) phases.push('priest')
  if (hasAliveRole('werewolf')) phases.push('wolf')
  if (
    config.witch > 0 &&
    (state.phase === 'witch' || !state.witchHealUsed || !state.witchPoisonUsed) &&
    hasAliveRole('witch')
  ) phases.push('witch')
  if (config.seer > 0 && hasAliveRole('seer')) phases.push('seer')

  const current = state.phase
  if (!current) return phases[0] ?? null
  const index = phases.indexOf(current)
  return index >= 0 && index < phases.length - 1 ? phases[index + 1] : null
}
