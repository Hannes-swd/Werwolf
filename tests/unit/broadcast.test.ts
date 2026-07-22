import { describe, expect, it } from 'vitest'
import { parseBroadcastMessage, sanitizeGameStateForPlayer } from '@/lib/broadcast'
import type { GameState, LocalPlayer, NightActionRecord, VoteRecord } from '@/lib/storage'

const players: LocalPlayer[] = [
  { id: 'admin', name: 'Admin', role: 'witch', isAlive: true, isAdmin: true, isMayor: false, canVote: true, loverId: null, priestBlessed: false },
  { id: 'guest', name: 'Guest', role: 'villager', isAlive: true, isAdmin: false, isMayor: false, canVote: true, loverId: null, priestBlessed: true },
  { id: 'wolf-1', name: 'Wolf One', role: 'werewolf', isAlive: true, isAdmin: false, isMayor: false, canVote: true, loverId: null, priestBlessed: false },
  { id: 'wolf-2', name: 'Wolf Two', role: 'werewolf', isAlive: true, isAdmin: false, isMayor: false, canVote: true, loverId: null, priestBlessed: false },
  { id: 'seer', name: 'Seer', role: 'seer', isAlive: true, isAdmin: false, isMayor: false, canVote: true, loverId: null, priestBlessed: false },
  { id: 'priest', name: 'Priest', role: 'priest', isAlive: true, isAdmin: false, isMayor: false, canVote: true, loverId: null, priestBlessed: false },
  { id: 'amor', name: 'Amor', role: 'amor', isAlive: true, isAdmin: false, isMayor: false, canVote: true, loverId: null, priestBlessed: false },
]

const nightActions: NightActionRecord[] = [
  { phase: 'wolf', actorId: 'wolf-1', actorName: 'Wolf One', targetId: 'guest', targetName: 'Guest', action: 'kill' },
  { phase: 'wolf', actorId: 'wolf-2', actorName: 'Wolf Two', targetId: 'guest', targetName: 'Guest', action: 'kill' },
  { phase: 'seer', actorId: 'seer', actorName: 'Seer', targetId: 'wolf-1', targetName: 'Wolf One', action: 'reveal' },
  { phase: 'priest', actorId: 'priest', actorName: 'Priest', targetId: 'guest', targetName: 'Guest', action: 'bless' },
  { phase: 'amor', actorId: 'amor', actorName: 'Amor', targetId: 'guest', targetName: 'Guest', secondTargetId: 'seer', secondTargetName: 'Seer', action: 'link' },
]

const votes: VoteRecord[] = [
  { voterId: 'guest', voterName: 'Guest', targetId: 'wolf-1', targetName: 'Wolf One', voteType: 'day_elimination' },
  { voterId: 'seer', voterName: 'Seer', targetId: 'wolf-2', targetName: 'Wolf Two', voteType: 'day_elimination' },
]

describe('parseBroadcastMessage', () => {
  it('rejects malformed and oversized client payloads', () => {
    expect(parseBroadcastMessage(null)).toBeNull()
    expect(parseBroadcastMessage({ type: 'unknown', payload: {} })).toBeNull()
    expect(parseBroadcastMessage({
      type: 'vote',
      payload: { voterId: '../host', targetId: 'player-2', voteType: 'day_elimination' },
    })).toBeNull()
    expect(parseBroadcastMessage({
      type: 'score_update',
      payload: { playerId: 'player-1', playerName: 'A', score: Number.MAX_SAFE_INTEGER },
    })).toBeNull()
  })

  it('accepts a valid player vote', () => {
    expect(parseBroadcastMessage({
      type: 'vote',
      payload: { voterId: 'player-1', targetId: 'player-2', voteType: 'day_elimination' },
    })).toEqual({
      type: 'vote',
      payload: { voterId: 'player-1', targetId: 'player-2', voteType: 'day_elimination' },
    })
  })

  it('rejects a full state with malformed nested settings', () => {
    const state = makeState()
    expect(parseBroadcastMessage({
      type: 'game_state',
      payload: { ...state, settings: { ...state.settings, votesVisible: 'yes' } },
    })).toBeNull()
  })

  it('accepts a structurally complete player-specific game state', () => {
    const state = sanitizeGameStateForPlayer(makeState(), 'guest')
    expect(parseBroadcastMessage({ type: 'game_state', payload: state })).toEqual({
      type: 'game_state',
      payload: state,
    })
  })
})

function makeState(): GameState {
  return {
    code: 'SECRET',
    status: 'night',
    phase: 'seer',
    round: 2,
    config: {
      werewolf: 2,
      witch: 1,
      seer: 1,
      hunter: 0,
      amor: 1,
      fool: 0,
      girl: 0,
      priest: 1,
      villager: 1,
    },
    settings: { votesVisible: false, mayorEnabled: true, autoConfig: false },
    players: players.map(player => ({ ...player })),
    witchHealUsed: true,
    witchPoisonUsed: false,
    priestUsed: true,
    currentRound: {
      code: 'SECRET',
      round: 2,
      timestamp: '2026-07-22T00:00:00.000Z',
      nightActions: nightActions.map(action => ({ ...action })),
      votes: votes.map(vote => ({ ...vote })),
      wolfTarget: 'guest',
      wolfTargetName: 'Guest',
      priestProtected: true,
      deaths: [],
      deathNames: [],
      healed: true,
      poisonTarget: 'priest',
      poisonTargetName: 'Priest',
      eliminated: null,
      eliminatedName: null,
      eliminatedRole: null,
      foolRevealed: false,
      mayorElected: null,
      mayorElectedName: null,
      tiedCandidateIds: [],
      tieBreakType: null,
      winner: null,
    },
    winner: null,
    pendingResolution: {
      origin: 'night',
      hunterIds: ['guest'],
      mayorId: null,
      nextStatus: 'day_discussion',
      nextRound: 2,
    },
  }
}

function rolesById(state: GameState) {
  return Object.fromEntries(state.players.map(player => [player.id, player.role]))
}

describe('sanitizeGameStateForPlayer', () => {
  it('prevents a guest from seeing unrelated roles, actions, and targets', () => {
    const source = makeState()
    const view = sanitizeGameStateForPlayer(source, 'guest')

    expect(rolesById(view)).toEqual({
      admin: null,
      guest: 'villager',
      'wolf-1': null,
      'wolf-2': null,
      seer: null,
      priest: null,
      amor: null,
    })
    expect(view.currentRound.nightActions).toEqual([])
    expect(view.currentRound.wolfTarget).toBeNull()
    expect(view.currentRound.wolfTargetName).toBeNull()
    expect(view.currentRound.poisonTarget).toBeNull()
    expect(view.currentRound.priestProtected).toBe(false)
    expect(view.pendingResolution).toBeNull()

    expect(source.players.find(player => player.id === 'wolf-1')?.role).toBe('werewolf')
    expect(source.currentRound.nightActions).toHaveLength(5)
  })

  it('lets a werewolf see the pack and pack kill actions only', () => {
    const view = sanitizeGameStateForPlayer(makeState(), 'wolf-1')

    expect(rolesById(view)).toEqual({
      admin: null,
      guest: null,
      'wolf-1': 'werewolf',
      'wolf-2': 'werewolf',
      seer: null,
      priest: null,
      amor: null,
    })
    expect(view.currentRound.nightActions.map(action => action.actorId)).toEqual(['wolf-1', 'wolf-2'])
    expect(view.currentRound.nightActions.every(action => action.action === 'kill')).toBe(true)
    expect(view.currentRound.wolfTarget).toBe('guest')
  })

  it('lets the seer see only their current reveal target', () => {
    const view = sanitizeGameStateForPlayer(makeState(), 'seer')

    expect(rolesById(view)).toEqual({
      admin: null,
      guest: null,
      'wolf-1': 'werewolf',
      'wolf-2': null,
      seer: 'seer',
      priest: null,
      amor: null,
    })
    expect(view.currentRound.nightActions).toEqual([
      expect.objectContaining({ actorId: 'seer', targetId: 'wolf-1', action: 'reveal' }),
    ])
    expect(view.currentRound.wolfTarget).toBeNull()
  })

  it('reveals every role after the game ends', () => {
    const source = makeState()
    const ended: GameState = { ...source, status: 'ended', winner: 'village' }
    const view = sanitizeGameStateForPlayer(ended, 'guest')

    expect(rolesById(view)).toEqual(rolesById(ended))
  })

  it('reveals only a pending actor\'s own follow-up prompt', () => {
    const source = makeState()
    source.status = 'hunter_pending'
    source.players = source.players.map(player => (
      player.id === 'guest' ? { ...player, role: 'hunter', isAlive: false } : player
    ))
    source.pendingResolution = {
      origin: 'night',
      hunterIds: ['guest', 'admin'],
      mayorId: 'seer',
      nextStatus: 'day_discussion',
      nextRound: 2,
    }

    const hunterView = sanitizeGameStateForPlayer(source, 'guest')
    const unrelatedView = sanitizeGameStateForPlayer(source, 'wolf-1')

    expect(hunterView.pendingResolution).toEqual({
      origin: 'night',
      hunterIds: ['guest'],
      mayorId: null,
      nextStatus: 'day_discussion',
      nextRound: 2,
    })
    expect(unrelatedView.pendingResolution).toBeNull()
  })

  it('keeps Amor\'s second target private to Amor and the admin', () => {
    const source = makeState()
    const amorView = sanitizeGameStateForPlayer(source, 'amor')
    const guestView = sanitizeGameStateForPlayer(source, 'guest')
    const adminView = sanitizeGameStateForPlayer(source, 'admin')

    expect(amorView.currentRound.nightActions).toEqual([
      expect.objectContaining({
        actorId: 'amor',
        targetId: 'guest',
        secondTargetId: 'seer',
        action: 'link',
      }),
    ])
    expect(guestView.currentRound.nightActions).toEqual([])
    expect(adminView.currentRound.nightActions.find(action => action.actorId === 'amor')?.secondTargetId).toBe('seer')
  })

  it('shows each lover only their own reciprocal partner link', () => {
    const source = makeState()
    source.players = source.players.map(player => {
      if (player.id === 'guest') return { ...player, loverId: 'seer' }
      if (player.id === 'seer') return { ...player, loverId: 'guest' }
      return player
    })

    const guestView = sanitizeGameStateForPlayer(source, 'guest')
    const wolfView = sanitizeGameStateForPlayer(source, 'wolf-1')

    expect(guestView.players.find(player => player.id === 'guest')?.loverId).toBe('seer')
    expect(guestView.players.find(player => player.id === 'seer')?.loverId).toBeNull()
    expect(wolfView.players.every(player => player.loverId === null)).toBe(true)
  })

  it('keeps hidden vote progress without exposing another voter or target', () => {
    const view = sanitizeGameStateForPlayer(makeState(), 'guest')

    expect(view.currentRound.votes).toHaveLength(2)
    expect(view.currentRound.votes[0]).toEqual(votes[0])
    expect(view.currentRound.votes[1]).toMatchObject({
      voterId: '',
      voterName: '',
      targetId: '',
      targetName: '',
      voteType: 'day_elimination',
    })
  })

  it('returns a complete cloned state for the admin', () => {
    const source = makeState()
    const view = sanitizeGameStateForPlayer(source, 'admin')

    expect(view).toEqual(source)
    expect(view).not.toBe(source)
    expect(view.players).not.toBe(source.players)
    expect(view.currentRound.nightActions).not.toBe(source.currentRound.nightActions)
  })
})
