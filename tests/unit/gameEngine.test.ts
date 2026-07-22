import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyNightAction,
  applyVote,
  eliminatePlayer,
  hunterShoot,
  mayorPassTitle,
  nextNightPhase,
  resolveNight,
  resolveTiebreaker,
  resolveVotes,
  startGame,
} from '@/lib/gameEngine'
import { GameState, LocalPlayer, makeEmptyRound } from '@/lib/storage'
import { Role, RoleConfig } from '@/types/game'

const DEFAULT_CONFIG: RoleConfig = {
  werewolf: 1,
  witch: 0,
  seer: 0,
  hunter: 0,
  amor: 0,
  fool: 0,
  girl: 0,
  priest: 0,
  villager: 4,
}

function player(
  id: string,
  role: Role,
  overrides: Partial<LocalPlayer> = {}
): LocalPlayer {
  return {
    id,
    name: id.toUpperCase(),
    role,
    isAlive: true,
    isAdmin: false,
    isMayor: false,
    canVote: true,
    loverId: null,
    priestBlessed: false,
    ...overrides,
  }
}

function state(
  players: LocalPlayer[],
  overrides: Partial<GameState> = {}
): GameState {
  const round = overrides.round ?? 1
  return {
    code: 'TEST01',
    status: 'day_vote',
    phase: null,
    round,
    config: DEFAULT_CONFIG,
    settings: { votesVisible: true, mayorEnabled: true, autoConfig: false },
    players,
    witchHealUsed: false,
    witchPoisonUsed: false,
    priestUsed: false,
    currentRound: makeEmptyRound('TEST01', round),
    winner: null,
    pendingResolution: null,
    ...overrides,
  }
}

function wolfNight(players: LocalPlayer[], targetId: string, round = 1): GameState {
  const base = state(players, { status: 'night', phase: 'wolf', round })
  const wolf = players.find(candidate => candidate.role === 'werewolf')!
  return applyNightAction(base, wolf.id, targetId, 'kill', 'wolf')
}

describe('night action validation', () => {
  it('rejects stale, dead, wrong-role, and invalid-target actions', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('other-wolf', 'werewolf'),
      player('dead', 'villager', { isAlive: false }),
      player('villager', 'villager'),
      player('seer', 'seer'),
    ]
    const base = state(players, {
      status: 'night',
      phase: 'wolf',
      config: { ...DEFAULT_CONFIG, werewolf: 2, seer: 1, villager: 1 },
    })

    expect(applyNightAction(base, 'seer', 'villager', 'kill', 'wolf')).toBe(base)
    expect(applyNightAction(base, 'wolf', 'dead', 'kill', 'wolf')).toBe(base)
    expect(applyNightAction(base, 'wolf', 'other-wolf', 'kill', 'wolf')).toBe(base)
    expect(applyNightAction(base, 'wolf', 'villager', 'kill', 'seer')).toBe(base)

    const valid = applyNightAction(base, 'wolf', 'villager', 'kill', 'wolf')
    expect(valid).not.toBe(base)
  })

  it('does not resolve a partial multi-wolf phase', () => {
    const players = [
      player('wolf-1', 'werewolf'),
      player('wolf-2', 'werewolf'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('v3', 'villager'),
    ]
    const partial = applyNightAction(
      state(players, {
        status: 'night',
        phase: 'wolf',
        config: { ...DEFAULT_CONFIG, werewolf: 2, villager: 3 },
      }),
      'wolf-1',
      'v1',
      'kill',
      'wolf'
    )

    expect(resolveNight(partial)).toBe(partial)
  })

  it('waits for pack consensus and lets a wolf revise their target', () => {
    const players = [
      player('wolf-1', 'werewolf'),
      player('wolf-2', 'werewolf'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('v3', 'villager'),
    ]
    const base = state(players, {
      status: 'night',
      phase: 'wolf',
      config: { ...DEFAULT_CONFIG, werewolf: 2, villager: 3 },
    })
    const firstVote = applyNightAction(base, 'wolf-1', 'v1', 'kill', 'wolf')
    const splitVote = applyNightAction(firstVote, 'wolf-2', 'v2', 'kill', 'wolf')

    expect(resolveNight(splitVote)).toBe(splitVote)

    const consensus = applyNightAction(splitVote, 'wolf-1', 'v2', 'kill', 'wolf')
    const wolfVotes = consensus.currentRound.nightActions.filter(action => action.action === 'kill')
    expect(wolfVotes).toHaveLength(2)
    expect(wolfVotes.every(action => action.targetId === 'v2')).toBe(true)

    const resolved = resolveNight(consensus)
    expect(resolved).not.toBe(consensus)
    expect(resolved.players.find(candidate => candidate.id === 'v2')?.isAlive).toBe(false)
  })

  it('does not resolve while a later configured role phase is still pending', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('seer', 'seer'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('v3', 'villager'),
    ]
    const wolfActed = applyNightAction(
      state(players, {
        status: 'night',
        phase: 'wolf',
        config: { ...DEFAULT_CONFIG, seer: 1, villager: 3 },
      }),
      'wolf',
      'v1',
      'kill',
      'wolf'
    )

    expect(resolveNight(wolfActed)).toBe(wolfActed)
  })

  it('keeps the active priest phase in sequence after the one-time blessing is used', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('priest', 'priest'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('v3', 'villager'),
    ]
    const blessed = applyNightAction(
      state(players, {
        status: 'night',
        phase: 'priest',
        config: { ...DEFAULT_CONFIG, priest: 1, villager: 3 },
      }),
      'priest',
      'v1',
      'bless',
      'priest',
    )

    expect(nextNightPhase(blessed)).toBe('wolf')
  })

  it('continues from an active witch phase after both potions are consumed', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('witch', 'witch'),
      player('seer', 'seer'),
      player('v1', 'villager'),
      player('v2', 'villager'),
    ]
    const base = state(players, {
      status: 'night',
      phase: 'witch',
      config: { ...DEFAULT_CONFIG, witch: 1, seer: 1, villager: 2 },
      currentRound: {
        ...makeEmptyRound('TEST01', 1),
        wolfTarget: 'v1',
        wolfTargetName: 'V1',
      },
    })
    const healed = applyNightAction(base, 'witch', 'v1', 'heal', 'witch')
    const poisoned = applyNightAction(healed, 'witch', 'v2', 'poison', 'witch')

    expect(poisoned.witchHealUsed).toBe(true)
    expect(poisoned.witchPoisonUsed).toBe(true)
    expect(nextNightPhase(poisoned)).toBe('seer')
  })
})

describe('Amor', () => {
  it('requires and reciprocally links two explicit, distinct players', () => {
    const players = [
      player('amor', 'amor'),
      player('first', 'villager'),
      player('second', 'werewolf'),
      player('third', 'villager'),
      player('fourth', 'villager'),
    ]
    const base = state(players, {
      status: 'night',
      phase: 'amor',
      config: { ...DEFAULT_CONFIG, amor: 1, villager: 3 },
    })

    expect(applyNightAction(base, 'amor', 'first', 'link', 'amor')).toBe(base)
    expect(applyNightAction(base, 'amor', 'first', 'link', 'amor', 'first')).toBe(base)

    const linked = applyNightAction(base, 'amor', 'first', 'link', 'amor', 'second')
    expect(linked.players.find(candidate => candidate.id === 'first')?.loverId).toBe('second')
    expect(linked.players.find(candidate => candidate.id === 'second')?.loverId).toBe('first')
    expect(linked.players.find(candidate => candidate.id === 'amor')?.loverId).toBeNull()
    expect(linked.currentRound.nightActions[0]).toMatchObject({
      targetId: 'first',
      secondTargetId: 'second',
    })
  })

  it('starts the no-mayor game on round one so Amor is not skipped', () => {
    const players = [
      player('amor', 'amor'),
      player('wolf', 'werewolf'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('v3', 'villager'),
    ]
    const started = startGame(state(players, {
      status: 'waiting',
      round: 0,
      config: { ...DEFAULT_CONFIG, amor: 1, villager: 3 },
      settings: { votesVisible: true, mayorEnabled: false, autoConfig: false },
    }))

    expect(started.round).toBe(1)
    expect(started.phase).toBe('amor')
  })
})

describe('game start validation', () => {
  it('rejects mismatched and already-terminal role setups', () => {
    const players = [
      player('p1', 'villager'),
      player('p2', 'villager'),
      player('p3', 'villager'),
      player('p4', 'villager'),
      player('p5', 'werewolf'),
    ]
    const mismatch = state(players, {
      status: 'waiting',
      round: 0,
      config: { ...DEFAULT_CONFIG, villager: 3 },
    })
    const terminal = state(players, {
      status: 'waiting',
      round: 0,
      config: { ...DEFAULT_CONFIG, werewolf: 3, villager: 2 },
    })

    expect(startGame(mismatch)).toBe(mismatch)
    expect(startGame(terminal)).toBe(terminal)
  })

  it('rejects duplicate players and non-waiting states', () => {
    const duplicatePlayers = [
      player('p1', 'villager'),
      player('p1', 'villager'),
      player('p3', 'villager'),
      player('p4', 'villager'),
      player('p5', 'werewolf'),
    ]
    const duplicate = state(duplicatePlayers, { status: 'waiting', round: 0 })
    const active = state([
      player('p1', 'villager'),
      player('p2', 'villager'),
      player('p3', 'villager'),
      player('p4', 'villager'),
      player('p5', 'werewolf'),
    ])

    expect(startGame(duplicate)).toBe(duplicate)
    expect(startGame(active)).toBe(active)
  })
})

describe('vote and elimination validation', () => {
  it('rejects stale, ineligible, self, dead-target, and repeat votes', () => {
    const players = [
      player('admin', 'villager', { isAdmin: true }),
      player('wolf', 'werewolf'),
      player('fool', 'fool', { canVote: false }),
      player('dead', 'villager', { isAlive: false }),
      player('v1', 'villager'),
    ]
    const base = state(players)

    expect(applyVote(base, 'admin', 'admin', 'day_elimination')).toBe(base)
    expect(applyVote(base, 'dead', 'v1', 'day_elimination')).toBe(base)
    expect(applyVote(base, 'admin', 'dead', 'day_elimination')).toBe(base)
    expect(applyVote(base, 'fool', 'v1', 'day_elimination')).toBe(base)
    expect(applyVote(base, 'admin', 'v1', 'mayor_election')).toBe(base)

    const valid = applyVote(base, 'admin', 'v1', 'day_elimination')
    expect(valid.currentRound.votes).toHaveLength(1)
    expect(applyVote(valid, 'admin', 'wolf', 'day_elimination')).toBe(valid)
  })

  it('returns the original state for invalid elimination and follow-up targets', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('hunter', 'hunter'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('dead', 'villager', { isAlive: false }),
    ]
    const base = state(players)

    expect(eliminatePlayer(base, 'missing', 'day_vote')).toBe(base)
    expect(eliminatePlayer(base, 'dead', 'day_vote')).toBe(base)
    expect(eliminatePlayer({ ...base, status: 'night' }, 'v1', 'day_vote')).toEqual({ ...base, status: 'night' })
    expect(hunterShoot(base, 'v1')).toBe(base)
    expect(mayorPassTitle(base, 'v1')).toBe(base)
  })
})

describe('ties', () => {
  it('turns a mayor-election tie into an admin-resolvable candidate set', () => {
    const players = [
      player('p1', 'villager', { isAdmin: true }),
      player('p2', 'villager'),
      player('p3', 'villager'),
      player('p4', 'villager'),
      player('p5', 'werewolf'),
    ]
    let election = state(players, { status: 'mayor_election', round: 0 })
    const votes = [
      ['p1', 'p2'],
      ['p2', 'p1'],
      ['p3', 'p1'],
      ['p4', 'p2'],
      ['p5', 'p3'],
    ]
    for (const [voter, target] of votes) {
      election = applyVote(election, voter, target, 'mayor_election')
    }

    const tied = resolveVotes(election, 'mayor_election')
    expect(tied.status).toBe('tiebreaker')
    expect(tied.currentRound.tieBreakType).toBe('mayor_election')
    expect(tied.currentRound.tiedCandidateIds).toEqual(expect.arrayContaining(['p1', 'p2']))
    expect(resolveTiebreaker(tied, 'p3', 'p1')).toBe(tied)
    expect(resolveTiebreaker(tied, 'p2', 'p4')).toBe(tied)

    const resolved = resolveTiebreaker(tied, 'p2', 'p1')
    expect(resolved.status).toBe('night')
    expect(resolved.round).toBe(1)
    expect(resolved.players.find(candidate => candidate.id === 'p2')?.isMayor).toBe(true)
  })

  it('lets only the living mayor eliminate one of the tied day candidates', () => {
    const players = [
      player('p1', 'villager', { isAdmin: true, isMayor: true }),
      player('p2', 'villager'),
      player('p3', 'villager'),
      player('p4', 'villager'),
      player('p5', 'werewolf'),
    ]
    let day = state(players)
    const votes = [
      ['p1', 'p2'],
      ['p2', 'p3'],
      ['p3', 'p2'],
      ['p4', 'p3'],
      ['p5', 'p4'],
    ]
    for (const [voter, target] of votes) {
      day = applyVote(day, voter, target, 'day_elimination')
    }

    const tied = resolveVotes(day, 'day_elimination')
    expect(tied.status).toBe('tiebreaker')
    expect(tied.currentRound.tiedCandidateIds).toEqual(expect.arrayContaining(['p2', 'p3']))
    expect(resolveTiebreaker(tied, 'p4', 'p1')).toBe(tied)
    expect(resolveTiebreaker(tied, 'p2', 'p4')).toBe(tied)
    expect(eliminatePlayer(tied, 'p4', 'tiebreaker', 'p1')).toBe(tied)

    const resolved = resolveTiebreaker(tied, 'p2', 'p1')
    expect(resolved.players.find(candidate => candidate.id === 'p2')?.isAlive).toBe(false)
    expect(resolved.status).toBe('night')
    expect(resolved.round).toBe(2)
  })

  it('advances without an elimination when a day tie has no mayor', () => {
    const players = [
      player('p1', 'villager'),
      player('p2', 'villager'),
      player('p3', 'villager'),
      player('p4', 'villager'),
      player('p5', 'werewolf'),
    ]
    let day = state(players)
    const votes = [
      ['p1', 'p2'],
      ['p2', 'p3'],
      ['p3', 'p2'],
      ['p4', 'p3'],
      ['p5', 'p4'],
    ]
    for (const [voter, target] of votes) {
      day = applyVote(day, voter, target, 'day_elimination')
    }

    const resolved = resolveVotes(day, 'day_elimination')
    expect(resolved.status).toBe('night')
    expect(resolved.round).toBe(2)
    expect(resolved.players.every(candidate => candidate.isAlive)).toBe(true)
  })
})

describe('hunter and mayor follow-up sequencing', () => {
  const fivePlayers = (hunterOverrides: Partial<LocalPlayer> = {}) => [
    player('wolf', 'werewolf'),
    player('hunter', 'hunter', hunterOverrides),
    player('v1', 'villager'),
    player('v2', 'villager'),
    player('v3', 'villager'),
  ]

  it('returns to day discussion after a hunter dies at night', () => {
    const night = wolfNight(fivePlayers(), 'hunter')
    const pending = resolveNight(night)

    expect(pending.status).toBe('hunter_pending')
    expect(pending.pendingResolution?.origin).toBe('night')
    expect(hunterShoot(pending, 'missing', 'hunter')).toBe(pending)
    expect(hunterShoot(pending, 'v1', 'v1')).toBe(pending)

    const resolved = hunterShoot(pending, 'v1', 'hunter')
    expect(resolved.status).toBe('day_discussion')
    expect(resolved.round).toBe(1)
  })

  it('starts the next night after a hunter dies by day elimination', () => {
    const pending = eliminatePlayer(state(fivePlayers()), 'hunter', 'day_vote')
    expect(pending.status).toBe('hunter_pending')
    expect(pending.pendingResolution?.origin).toBe('day')

    const resolved = hunterShoot(pending, 'v1', 'hunter')
    expect(resolved.status).toBe('night')
    expect(resolved.round).toBe(2)
  })

  it('queues mayor succession after a hunter-mayor shot, preserving night origin', () => {
    const night = wolfNight(fivePlayers({ isMayor: true }), 'hunter')
    const hunterPending = resolveNight(night)
    const mayorPending = hunterShoot(hunterPending, 'v1', 'hunter')

    expect(mayorPending.status).toBe('mayor_pending')
    expect(mayorPending.pendingResolution).toMatchObject({
      origin: 'night',
      mayorId: 'hunter',
    })
    expect(mayorPassTitle(mayorPending, 'hunter', 'hunter')).toBe(mayorPending)
    expect(mayorPassTitle(mayorPending, 'v2', 'v1')).toBe(mayorPending)

    const resolved = mayorPassTitle(mayorPending, 'v2', 'hunter')
    expect(resolved.status).toBe('day_discussion')
    expect(resolved.round).toBe(1)
    expect(resolved.players.find(candidate => candidate.id === 'v2')?.isMayor).toBe(true)
  })

  it('preserves day origin through hunter-mayor succession', () => {
    const hunterPending = eliminatePlayer(
      state(fivePlayers({ isMayor: true })),
      'hunter',
      'day_vote'
    )
    const mayorPending = hunterShoot(hunterPending, 'v1', 'hunter')
    const resolved = mayorPassTitle(mayorPending, 'v2', 'hunter')

    expect(resolved.status).toBe('night')
    expect(resolved.round).toBe(2)
    expect(resolved.players.find(candidate => candidate.id === 'v2')?.isMayor).toBe(true)
  })

  it('defers a provisional winner until the hunter shot is resolved', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('hunter', 'hunter'),
      player('villager', 'villager'),
    ]
    const pending = resolveNight(wolfNight(players, 'hunter'))

    expect(pending.status).toBe('hunter_pending')
    expect(pending.winner).toBeNull()

    const resolved = hunterShoot(pending, 'wolf', 'hunter')
    expect(resolved.status).toBe('ended')
    expect(resolved.winner).toBe('village')
  })

  it('queues a newly shot hunter before checking the winner', () => {
    const players = [
      player('wolf', 'werewolf'),
      player('hunter-1', 'hunter'),
      player('hunter-2', 'hunter'),
      player('v1', 'villager'),
      player('v2', 'villager'),
      player('v3', 'villager'),
    ]
    const firstPending = eliminatePlayer(state(players), 'hunter-1', 'day_vote')
    const secondPending = hunterShoot(firstPending, 'hunter-2', 'hunter-1')

    expect(secondPending.status).toBe('hunter_pending')
    expect(secondPending.pendingResolution?.hunterIds).toEqual(['hunter-2'])

    const resolved = hunterShoot(secondPending, 'wolf', 'hunter-2')
    expect(resolved.status).toBe('ended')
    expect(resolved.winner).toBe('village')
  })

  it('infers the origin for legacy pending states without pendingResolution', () => {
    const players = fivePlayers().map(candidate => (
      candidate.id === 'hunter' ? { ...candidate, isAlive: false } : candidate
    ))
    const round = {
      ...makeEmptyRound('TEST01', 1),
      deaths: ['hunter'],
      deathNames: ['HUNTER'],
    }
    const legacy = state(players, {
      status: 'hunter_pending',
      phase: null,
      currentRound: round,
    })
    delete legacy.pendingResolution

    const resolved = hunterShoot(legacy, 'v1')
    expect(resolved.status).toBe('day_discussion')
    expect(resolved.round).toBe(1)
  })
})

beforeEach(() => {
  // Engine persistence is intentionally a no-op in the Node test environment.
  Reflect.deleteProperty(globalThis, 'localStorage')
})
