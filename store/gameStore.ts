import { create } from 'zustand'
import { Player, Lobby, GameEvent, Vote, NightAction } from '@/types/game'

interface GameStore {
  lobby: Lobby | null
  players: Player[]
  me: Player | null
  events: GameEvent[]
  votes: Vote[]
  nightActions: NightAction[]
  wolfTarget: string | null
  witchHealUsed: boolean
  witchPoisonUsed: boolean
  priestUsed: boolean
  hunterPending: boolean
  mayorPending: boolean
  girlPeeked: boolean

  setLobby: (lobby: Lobby) => void
  setPlayers: (players: Player[]) => void
  setMe: (player: Player) => void
  addEvent: (event: GameEvent) => void
  setVotes: (votes: Vote[]) => void
  addVote: (vote: Vote) => void
  setNightActions: (actions: NightAction[]) => void
  setWolfTarget: (id: string | null) => void
  setWitchStatus: (healUsed: boolean, poisonUsed: boolean) => void
  setPriestUsed: (used: boolean) => void
  setHunterPending: (pending: boolean) => void
  setMayorPending: (pending: boolean) => void
  setGirlPeeked: (peeked: boolean) => void
  reset: () => void
}

const initialState = {
  lobby: null,
  players: [],
  me: null,
  events: [],
  votes: [],
  nightActions: [],
  wolfTarget: null,
  witchHealUsed: false,
  witchPoisonUsed: false,
  priestUsed: false,
  hunterPending: false,
  mayorPending: false,
  girlPeeked: false,
}

export const useGameStore = create<GameStore>(set => ({
  ...initialState,

  setLobby: lobby => set({ lobby }),
  setPlayers: players => set({ players }),
  setMe: me => set({ me }),
  addEvent: event => set(s => ({ events: [...s.events, event] })),
  setVotes: votes => set({ votes }),
  addVote: vote => set(s => ({ votes: [...s.votes, vote] })),
  setNightActions: nightActions => set({ nightActions }),
  setWolfTarget: wolfTarget => set({ wolfTarget }),
  setWitchStatus: (healUsed, poisonUsed) =>
    set({ witchHealUsed: healUsed, witchPoisonUsed: poisonUsed }),
  setPriestUsed: priestUsed => set({ priestUsed }),
  setHunterPending: hunterPending => set({ hunterPending }),
  setMayorPending: mayorPending => set({ mayorPending }),
  setGirlPeeked: girlPeeked => set({ girlPeeked }),
  reset: () => set(initialState),
}))
