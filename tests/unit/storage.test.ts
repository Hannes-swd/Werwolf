import { afterEach, describe, expect, it } from 'vitest'
import {
  loadGameState,
  loadMyPlayer,
  loadRound,
  makeEmptyRound,
  shouldAcceptGameState,
} from '@/lib/storage'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('localStorage migration defaults', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('adds tie and pending defaults to legacy game and round records', () => {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
    })

    const round = makeEmptyRound('OLD001', 1)
    delete round.tiedCandidateIds
    delete round.tieBreakType
    const legacy = {
      code: 'OLD001',
      status: 'day_vote',
      phase: null,
      round: 1,
      config: {
        werewolf: 1,
        witch: 0,
        seer: 0,
        hunter: 0,
        amor: 0,
        fool: 0,
        girl: 0,
        priest: 0,
        villager: 4,
      },
      settings: { votesVisible: true, mayorEnabled: false, autoConfig: false },
      players: [],
      witchHealUsed: false,
      witchPoisonUsed: false,
      priestUsed: false,
      currentRound: round,
      winner: null,
    }
    storage.setItem('werwolf_game_OLD001', JSON.stringify(legacy))
    storage.setItem('werwolf_round_OLD001_1', JSON.stringify(round))

    const loaded = loadGameState('OLD001')
    expect(loaded).toMatchObject({
      revision: 0,
      pendingResolution: null,
      currentRound: { tiedCandidateIds: [], tieBreakType: null },
    })
    expect(loadRound('OLD001', 1)).toMatchObject({
      tiedCandidateIds: [],
      tieBreakType: null,
    })
    expect(loaded && shouldAcceptGameState(loaded, { ...loaded, revision: 1 })).toBe(true)
    expect(loaded && shouldAcceptGameState({ ...loaded, revision: 2 }, { ...loaded, revision: 1 })).toBe(false)
  })

  it('returns null instead of crashing on malformed JSON', () => {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
    })
    storage.setItem('werwolf_game_BAD001', '{broken')
    storage.setItem('werwolf_round_BAD001_1', '{broken')

    expect(loadGameState('BAD001')).toBeNull()
    expect(loadRound('BAD001', 1)).toBeNull()
  })

  it('rejects malformed records even when their JSON is valid', () => {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
    })
    storage.setItem('werwolf_game_BAD002', JSON.stringify({ status: 'night' }))
    storage.setItem('werwolf_player_BAD002', JSON.stringify({ id: '../host', name: 'Bad', isAdmin: true }))

    expect(loadGameState('BAD002')).toBeNull()
    expect(loadMyPlayer('BAD002')).toBeNull()
  })

  it('rejects records stored under a different lobby key', () => {
    const storage = new MemoryStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
    })

    const round = makeEmptyRound('ROOM01', 1)
    storage.setItem('werwolf_game_OTHER1', JSON.stringify({
      code: 'ROOM01',
      status: 'day_vote',
      phase: null,
      round: 1,
      config: {
        werewolf: 1,
        witch: 0,
        seer: 0,
        hunter: 0,
        amor: 0,
        fool: 0,
        girl: 0,
        priest: 0,
        villager: 4,
      },
      settings: { votesVisible: true, mayorEnabled: false, autoConfig: false },
      players: [],
      witchHealUsed: false,
      witchPoisonUsed: false,
      priestUsed: false,
      currentRound: round,
      winner: null,
    }))

    expect(loadGameState('OTHER1')).toBeNull()
  })
})
