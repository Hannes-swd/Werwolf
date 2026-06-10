import { GameState, LocalPlayer, RoundData, makeEmptyRound, saveGameState, saveRound } from '@/lib/storage'
import { assignRoles } from '@/lib/roleAssignment'
import { checkWinCondition, countVotes } from '@/lib/gameLogic'
import { Player } from '@/types/game'

// Convert LocalPlayer → Player for gameLogic utilities
function toPlayer(p: LocalPlayer): Player {
  return {
    id: p.id, lobbyCode: '', userId: null, displayName: p.name,
    role: p.role, isAlive: p.isAlive, isAdmin: p.isAdmin,
    isMayor: p.isMayor, canVote: p.canVote, loverId: p.loverId,
    priestBlessed: p.priestBlessed, joinedAt: '',
  }
}

export function startGame(state: GameState): GameState {
  const ids = state.players.map(p => p.id)
  const roleMap = assignRoles(ids, state.config)
  const players = state.players.map(p => ({ ...p, role: roleMap.get(p.id) ?? 'villager' as const }))
  if (state.settings.mayorEnabled) {
    const next: GameState = { ...state, players, status: 'mayor_election', phase: null, round: 0, currentRound: makeEmptyRound(state.code, 0) }
    saveGameState(next)
    return next
  }
  const nightBase: GameState = { ...state, players, status: 'night', phase: null, round: 0, currentRound: makeEmptyRound(state.code, 0) }
  const next: GameState = { ...nightBase, phase: nextNightPhase(nightBase) }
  saveGameState(next)
  return next
}

export function applyNightAction(
  state: GameState,
  actorId: string,
  targetId: string | null,
  action: string,
  phase: string
): GameState {
  const actor = state.players.find(p => p.id === actorId)
  const target = targetId ? state.players.find(p => p.id === targetId) : null

  const record = {
    phase, actorId, actorName: actor?.name ?? '',
    targetId, targetName: target?.name ?? null, action,
  }

  let players = [...state.players]
  let { witchHealUsed, witchPoisonUsed, priestUsed } = state
  let round = { ...state.currentRound, nightActions: [...state.currentRound.nightActions, record] }

  if (action === 'bless' && targetId) {
    players = players.map(p => p.id === targetId ? { ...p, priestBlessed: true } : p)
    priestUsed = true
    round = { ...round }
  }

  if (action === 'link' && targetId) {
    players = players.map(p => {
      if (p.id === actorId) return { ...p, loverId: targetId }
      if (p.id === targetId) return { ...p, loverId: actorId }
      return p
    })
  }

  if (phase === 'wolf' && action === 'kill' && targetId) {
    round = { ...round, wolfTarget: targetId, wolfTargetName: target?.name ?? null }
  }

  const next: GameState = { ...state, players, witchHealUsed, witchPoisonUsed, priestUsed, currentRound: round }
  saveGameState(next)
  return next
}

export function resolveNight(state: GameState): GameState {
  let players = [...state.players]
  let round = { ...state.currentRound }
  const { wolfTarget } = round

  const deaths: string[] = []
  const deathNames: string[] = []

  // Wolf kill (check priest protection)
  if (wolfTarget) {
    const target = players.find(p => p.id === wolfTarget)!
    const witchHeal = state.currentRound.nightActions.find(a => a.action === 'heal')
    if (target.priestBlessed) {
      round = { ...round, priestProtected: true }
    } else if (witchHeal?.targetId === wolfTarget) {
      round = { ...round, healed: true }
    } else {
      deaths.push(wolfTarget)
      deathNames.push(target.name)
    }
  }

  // Witch poison
  const poison = state.currentRound.nightActions.find(a => a.action === 'poison')
  if (poison?.targetId) {
    const target = players.find(p => p.id === poison.targetId)!
    if (!deaths.includes(poison.targetId)) {
      deaths.push(poison.targetId)
      deathNames.push(target.name)
    }
    round = { ...round, poisonTarget: poison.targetId, poisonTargetName: target.name }
  }

  // Apply deaths + lover chain
  for (const id of [...deaths]) {
    const dead = players.find(p => p.id === id)!
    if (dead.loverId) {
      const lover = players.find(p => p.id === dead.loverId)
      if (lover && lover.isAlive && !deaths.includes(lover.id)) {
        deaths.push(lover.id)
        deathNames.push(lover.name)
      }
    }
  }

  players = players.map(p => deaths.includes(p.id) ? { ...p, isAlive: false } : p)
  // Reset priest blessings
  players = players.map(p => ({ ...p, priestBlessed: false }))

  round = { ...round, deaths, deathNames }

  const winner = checkWinCondition(players.map(toPlayer))

  let status = winner ? 'ended' : 'day_discussion'
  if (!winner) {
    const hunterDied = deaths.find(id => players.find(p => p.id === id)?.role === 'hunter')
    if (hunterDied) status = 'hunter_pending'
    const mayorDied = deaths.find(id => {
      const p = state.players.find(pl => pl.id === id)
      return p?.isMayor
    })
    if (mayorDied && !hunterDied) status = 'mayor_pending'
  }

  round = { ...round, winner }
  const next: GameState = { ...state, players, status, phase: null, currentRound: round, winner }
  saveGameState(next)
  if (winner || status === 'day_discussion') saveRound(round)
  return next
}

export function applyVote(
  state: GameState,
  voterId: string,
  targetId: string,
  voteType: string
): GameState {
  const voter = state.players.find(p => p.id === voterId)!
  const target = state.players.find(p => p.id === targetId)!
  const record = { voterId, voterName: voter.name, targetId, targetName: target.name, voteType }

  const existing = state.currentRound.votes.filter(
    v => !(v.voterId === voterId && v.voteType === voteType)
  )
  const votes = [...existing, record]
  const round = { ...state.currentRound, votes }
  const next = { ...state, currentRound: round }
  saveGameState(next)
  return next
}

export function resolveVotes(state: GameState, voteType: string): GameState {
  const votes = state.currentRound.votes.filter(v => v.voteType === voteType)
  const counts = new Map<string, number>()
  votes.forEach(v => counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1))

  let maxVotes = 0
  let topTargets: string[] = []
  for (const [id, count] of counts) {
    if (count > maxVotes) { maxVotes = count; topTargets = [id] }
    else if (count === maxVotes) topTargets.push(id)
  }

  if (voteType === 'mayor_election') {
    if (topTargets.length === 1) {
      const elected = topTargets[0]
      const electedName = state.players.find(p => p.id === elected)?.name ?? ''
      const players = state.players.map(p => ({ ...p, isMayor: p.id === elected }))
      const round = { ...state.currentRound, mayorElected: elected, mayorElectedName: electedName }
      saveRound(round)
      const nightBase: GameState = { ...state, players, status: 'night', phase: null, round: 1, currentRound: makeEmptyRound(state.code, 1) }
      const next: GameState = { ...nightBase, phase: nextNightPhase(nightBase) }
      saveGameState(next)
      return next
    }
    // Tie → admin decides (return state unchanged, UI will handle)
    return state
  }

  if (topTargets.length > 1) {
    // Tie → tiebreaker or nobody dies
    const mayor = state.players.find(p => p.isMayor && p.isAlive)
    const next = { ...state, status: mayor ? 'tiebreaker' : 'nobody_dies' }
    if (!mayor) {
      const round = { ...state.currentRound }
      saveRound(round)
      const nightBase: GameState = { ...state, status: 'night', phase: null, round: state.round + 1, currentRound: makeEmptyRound(state.code, state.round + 1) }
      const n2: GameState = { ...nightBase, phase: nextNightPhase(nightBase) }
      saveGameState(n2)
      return n2
    }
    saveGameState(next)
    return next
  }

  return eliminatePlayer(state, topTargets[0], voteType === 'tiebreaker' ? 'tiebreaker' : 'day_vote')
}

export function eliminatePlayer(state: GameState, targetId: string, phase: string): GameState {
  const target = state.players.find(p => p.id === targetId)!
  let players = [...state.players]
  let round = { ...state.currentRound }

  // Dorfdepp überlebt
  if (target.role === 'fool') {
    players = players.map(p => p.id === targetId ? { ...p, canVote: false } : p)
    round = { ...round, foolRevealed: true, eliminated: targetId, eliminatedName: target.name, eliminatedRole: 'fool' }
    saveRound(round)
    const nightBase: GameState = { ...state, players, status: 'night', phase: null, round: state.round + 1, currentRound: makeEmptyRound(state.code, state.round + 1) }
    const next: GameState = { ...nightBase, phase: nextNightPhase(nightBase) }
    saveGameState(next)
    return next
  }

  // Normal death
  players = players.map(p => p.id === targetId ? { ...p, isAlive: false } : p)
  round = { ...round, eliminated: targetId, eliminatedName: target.name, eliminatedRole: target.role }

  // Lover
  if (target.loverId) {
    const lover = players.find(p => p.id === target.loverId)
    if (lover?.isAlive) {
      players = players.map(p => p.id === target.loverId ? { ...p, isAlive: false } : p)
      round = { ...round, deaths: [...round.deaths, lover.id], deathNames: [...round.deathNames, lover.name] }
    }
  }

  const winner = checkWinCondition(players.map(toPlayer))
  round = { ...round, winner }
  saveRound(round)

  if (winner) {
    const next: GameState = { ...state, players, status: 'ended', currentRound: round, winner }
    saveGameState(next)
    return next
  }

  // Jäger or mayor pending?
  if (target.role === 'hunter') {
    const next = { ...state, players, status: 'hunter_pending', currentRound: round }
    saveGameState(next)
    return next
  }
  if (target.isMayor) {
    const next = { ...state, players, status: 'mayor_pending', currentRound: round }
    saveGameState(next)
    return next
  }

  const nightBase: GameState = { ...state, players, status: 'night', phase: null, round: state.round + 1, currentRound: makeEmptyRound(state.code, state.round + 1) }
  const next: GameState = { ...nightBase, phase: nextNightPhase(nightBase) }
  saveGameState(next)
  return next
}

export function hunterShoot(state: GameState, targetId: string): GameState {
  const target = state.players.find(p => p.id === targetId)!
  const players = state.players.map(p => p.id === targetId ? { ...p, isAlive: false } : p)
  const round = { ...state.currentRound, deaths: [...state.currentRound.deaths, targetId], deathNames: [...state.currentRound.deathNames, target.name] }

  const winner = checkWinCondition(players.map(toPlayer))
  const wasNight = state.status === 'hunter_pending' && state.phase !== null
  const newStatus = winner ? 'ended' : wasNight ? 'day_discussion' : 'night'
  const newRound = winner || wasNight ? state.round : state.round + 1
  const newCurrentRound = !winner && !wasNight ? makeEmptyRound(state.code, newRound) : round
  const base: GameState = { ...state, players, status: newStatus, phase: null, round: newRound, currentRound: newCurrentRound, winner: winner ?? null }
  const next: GameState = newStatus === 'night' ? { ...base, phase: nextNightPhase(base) } : base
  saveRound(round)
  saveGameState(next)
  return next
}

export function mayorPassTitle(state: GameState, successorId: string): GameState {
  const successor = state.players.find(p => p.id === successorId)!
  const players = state.players.map(p => ({ ...p, isMayor: p.id === successorId }))
  const wasDayPhase = state.status === 'mayor_pending' || state.status === 'day_vote' || state.status === 'tiebreaker'
  const newRound = wasDayPhase ? state.round + 1 : state.round
  const base: GameState = {
    ...state, players, phase: null,
    status: wasDayPhase ? 'night' : 'day_discussion',
    round: newRound,
    currentRound: wasDayPhase ? makeEmptyRound(state.code, newRound) : state.currentRound,
  }
  const next: GameState = wasDayPhase ? { ...base, phase: nextNightPhase(base) } : base
  saveGameState(next)
  return next
}

export function advanceToPhase(state: GameState, phase: string): GameState {
  const next = { ...state, phase }
  saveGameState(next)
  return next
}

export function nextNightPhase(state: GameState): string | null {
  const { config, round, players } = state
  const phases: string[] = []
  if (round === 1 && config.amor > 0) phases.push('amor')
  if (config.priest > 0 && !state.priestUsed) phases.push('priest')
  phases.push('wolf')
  if (config.witch > 0 && (!state.witchHealUsed || !state.witchPoisonUsed)) phases.push('witch')
  if (config.seer > 0) phases.push('seer')

  const cur = state.phase
  if (!cur) return phases[0]
  const idx = phases.indexOf(cur)
  return idx >= 0 && idx < phases.length - 1 ? phases[idx + 1] : null
}
