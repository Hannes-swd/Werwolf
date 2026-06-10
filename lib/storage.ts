import { RoleConfig, LobbySettings, Role } from '@/types/game'

export interface LocalPlayer {
  id: string
  name: string
  role: Role | null
  isAlive: boolean
  isAdmin: boolean
  isMayor: boolean
  canVote: boolean
  loverId: string | null
  priestBlessed: boolean
}

export interface NightActionRecord {
  phase: string
  actorId: string
  actorName: string
  targetId: string | null
  targetName: string | null
  action: string
}

export interface VoteRecord {
  voterId: string
  voterName: string
  targetId: string
  targetName: string
  voteType: string
}

export interface RoundData {
  code: string
  round: number
  timestamp: string
  nightActions: NightActionRecord[]
  votes: VoteRecord[]
  wolfTarget: string | null
  wolfTargetName: string | null
  priestProtected: boolean
  deaths: string[]
  deathNames: string[]
  healed: boolean
  poisonTarget: string | null
  poisonTargetName: string | null
  eliminated: string | null
  eliminatedName: string | null
  eliminatedRole: string | null
  foolRevealed: boolean
  mayorElected: string | null
  mayorElectedName: string | null
  winner: string | null
}

export interface GameState {
  code: string
  status: string
  phase: string | null
  round: number
  config: RoleConfig
  settings: LobbySettings
  players: LocalPlayer[]
  witchHealUsed: boolean
  witchPoisonUsed: boolean
  priestUsed: boolean
  currentRound: RoundData
  winner: string | null
}

export interface LobbyState {
  code: string
  config: RoleConfig
  settings: LobbySettings
  players: { id: string; name: string; isAdmin: boolean }[]
}

function roundKey(code: string, round: number) {
  return `werwolf_round_${code}_${round}`
}

function gameKey(code: string) {
  return `werwolf_game_${code}`
}

function lobbyKey(code: string) {
  return `werwolf_lobby_${code}`
}

export function saveName(name: string) {
  localStorage.setItem('werwolf_name', name)
}

export function loadName(): string {
  return localStorage.getItem('werwolf_name') ?? ''
}

export function saveMyPlayer(code: string, player: { id: string; name: string; isAdmin: boolean }) {
  localStorage.setItem(`werwolf_player_${code}`, JSON.stringify(player))
}

export function loadMyPlayer(code: string): { id: string; name: string; isAdmin: boolean } | null {
  const raw = localStorage.getItem(`werwolf_player_${code}`)
  return raw ? JSON.parse(raw) : null
}

export function saveLobby(state: LobbyState) {
  localStorage.setItem(lobbyKey(state.code), JSON.stringify(state))
}

export function loadLobby(code: string): LobbyState | null {
  const raw = localStorage.getItem(lobbyKey(code))
  return raw ? JSON.parse(raw) : null
}

export function saveGameState(state: GameState) {
  localStorage.setItem(gameKey(state.code), JSON.stringify(state))
}

export function loadGameState(code: string): GameState | null {
  const raw = localStorage.getItem(gameKey(code))
  return raw ? JSON.parse(raw) : null
}

// Called at end of each round to permanently save round data
export function saveRound(data: RoundData) {
  localStorage.setItem(roundKey(data.code, data.round), JSON.stringify(data))
}

export function loadRound(code: string, round: number): RoundData | null {
  const raw = localStorage.getItem(roundKey(code, round))
  return raw ? JSON.parse(raw) : null
}

export function loadAllRounds(code: string): RoundData[] {
  const rounds: RoundData[] = []
  for (let i = 0; i <= 99; i++) {
    const r = loadRound(code, i)
    if (r) rounds.push(r)
    else if (i > 5) break
  }
  return rounds
}

export function makeEmptyRound(code: string, round: number): RoundData {
  return {
    code,
    round,
    timestamp: new Date().toISOString(),
    nightActions: [],
    votes: [],
    wolfTarget: null,
    wolfTargetName: null,
    priestProtected: false,
    deaths: [],
    deathNames: [],
    healed: false,
    poisonTarget: null,
    poisonTargetName: null,
    eliminated: null,
    eliminatedName: null,
    eliminatedRole: null,
    foolRevealed: false,
    mayorElected: null,
    mayorElectedName: null,
    winner: null,
  }
}
