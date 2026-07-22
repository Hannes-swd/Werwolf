import { RoleConfig, LobbySettings, Role } from '@/types/game'
import { isPlainObject, isPlayerId, normalizePlayerName } from '@/lib/validation'

const ROLES = new Set<Role>([
  'villager',
  'werewolf',
  'witch',
  'seer',
  'hunter',
  'amor',
  'fool',
  'girl',
  'priest',
])
const ROLE_CONFIG_KEYS = [...ROLES] as const
const GAME_STATUSES = new Set([
  'waiting',
  'mayor_election',
  'night',
  'day_discussion',
  'day_vote',
  'tiebreaker',
  'hunter_pending',
  'mayor_pending',
  'ended',
])
const NIGHT_PHASES = new Set(['amor', 'priest', 'wolf', 'witch', 'seer'])
const NIGHT_ACTIONS = new Set(['kill', 'heal', 'poison', 'reveal', 'bless', 'peek', 'link', 'skip'])
const VOTE_TYPES = new Set(['mayor_election', 'day_elimination', 'tiebreaker'])
const WINNERS = new Set(['village', 'wolves', 'lovers'])
const MAX_PLAYERS = 64
const MAX_ROUND_RECORDS = 256

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
  secondTargetId?: string | null
  secondTargetName?: string | null
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
  tiedCandidateIds?: string[]
  tieBreakType?: 'mayor_election' | 'day_elimination' | null
  winner: string | null
}

export interface PendingResolution {
  origin: 'night' | 'day'
  hunterIds: string[]
  mayorId: string | null
  nextStatus: 'day_discussion' | 'night'
  nextRound: number
}

export interface GameState {
  code: string
  revision?: number
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
  pendingResolution?: PendingResolution | null
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

function hasStorage() {
  return typeof localStorage !== 'undefined'
}

function readValue(key: string): string | null {
  if (!hasStorage()) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeValue(key: string, value: unknown) {
  if (!hasStorage()) return
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {
    // Private browsing and full storage should not crash an active game.
  }
}

function parseJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= max
}

function isStoredName(value: unknown, allowEmpty = false): value is string {
  if (typeof value !== 'string') return false
  if (allowEmpty && value === '') return true
  return value.length > 0 && value.length <= 20 && normalizePlayerName(value) === value
}

function isNullablePlayerId(value: unknown): value is string | null {
  return value === null || isPlayerId(value)
}

function isNullableName(value: unknown): value is string | null {
  return value === null || isStoredName(value, true)
}

function hasUniqueIds(values: Array<{ id: string }>) {
  return new Set(values.map(value => value.id)).size === values.length
}

export function isRoleConfig(value: unknown): value is RoleConfig {
  if (!isPlainObject(value)) return false
  let total = 0

  for (const key of ROLE_CONFIG_KEYS) {
    const count = value[key]
    if (!isBoundedInteger(count, 0, MAX_PLAYERS)) return false
    total += count
  }

  return total <= MAX_PLAYERS
}

export function isLobbySettings(value: unknown): value is LobbySettings {
  return isPlainObject(value) &&
    typeof value.votesVisible === 'boolean' &&
    typeof value.mayorEnabled === 'boolean' &&
    typeof value.autoConfig === 'boolean'
}

function isLocalPlayer(value: unknown): value is LocalPlayer {
  return isPlainObject(value) &&
    isPlayerId(value.id) &&
    isStoredName(value.name) &&
    (value.role === null || (typeof value.role === 'string' && ROLES.has(value.role as Role))) &&
    typeof value.isAlive === 'boolean' &&
    typeof value.isAdmin === 'boolean' &&
    typeof value.isMayor === 'boolean' &&
    typeof value.canVote === 'boolean' &&
    isNullablePlayerId(value.loverId) &&
    typeof value.priestBlessed === 'boolean'
}

function isNightActionRecord(value: unknown): value is NightActionRecord {
  if (!isPlainObject(value)) return false
  return typeof value.phase === 'string' && NIGHT_PHASES.has(value.phase) &&
    typeof value.action === 'string' && NIGHT_ACTIONS.has(value.action) &&
    (value.actorId === '' || isPlayerId(value.actorId)) &&
    isStoredName(value.actorName, true) &&
    isNullablePlayerId(value.targetId) &&
    isNullableName(value.targetName) &&
    (value.secondTargetId === undefined || isNullablePlayerId(value.secondTargetId)) &&
    (value.secondTargetName === undefined || isNullableName(value.secondTargetName))
}

function isVoteRecord(value: unknown): value is VoteRecord {
  if (!isPlainObject(value) || typeof value.voteType !== 'string' || !VOTE_TYPES.has(value.voteType)) {
    return false
  }

  const hidden = value.voterId === '' && value.voterName === '' && value.targetId === '' && value.targetName === ''
  return hidden || (
    isPlayerId(value.voterId) &&
    isStoredName(value.voterName) &&
    isPlayerId(value.targetId) &&
    isStoredName(value.targetName)
  )
}

export function isRoundData(value: unknown): value is RoundData {
  if (!isPlainObject(value)) return false
  if (!Array.isArray(value.nightActions) || value.nightActions.length > MAX_ROUND_RECORDS) return false
  if (!Array.isArray(value.votes) || value.votes.length > MAX_ROUND_RECORDS) return false
  if (!Array.isArray(value.deaths) || value.deaths.length > MAX_PLAYERS) return false
  if (!Array.isArray(value.deathNames) || value.deathNames.length > MAX_PLAYERS) return false
  if (value.tiedCandidateIds !== undefined && (
    !Array.isArray(value.tiedCandidateIds) ||
    value.tiedCandidateIds.length > MAX_PLAYERS ||
    !value.tiedCandidateIds.every(isPlayerId)
  )) return false

  return typeof value.code === 'string' &&
    isBoundedInteger(value.round, 0, 999) &&
    typeof value.timestamp === 'string' && value.timestamp.length > 0 && value.timestamp.length <= 64 &&
    value.nightActions.every(isNightActionRecord) &&
    value.votes.every(isVoteRecord) &&
    isNullablePlayerId(value.wolfTarget) &&
    isNullableName(value.wolfTargetName) &&
    typeof value.priestProtected === 'boolean' &&
    value.deaths.every(isPlayerId) &&
    value.deathNames.every(name => isStoredName(name, true)) &&
    typeof value.healed === 'boolean' &&
    isNullablePlayerId(value.poisonTarget) &&
    isNullableName(value.poisonTargetName) &&
    isNullablePlayerId(value.eliminated) &&
    isNullableName(value.eliminatedName) &&
    (value.eliminatedRole === null || (typeof value.eliminatedRole === 'string' && ROLES.has(value.eliminatedRole as Role))) &&
    typeof value.foolRevealed === 'boolean' &&
    isNullablePlayerId(value.mayorElected) &&
    isNullableName(value.mayorElectedName) &&
    (value.tieBreakType === undefined || value.tieBreakType === null || value.tieBreakType === 'mayor_election' || value.tieBreakType === 'day_elimination') &&
    (value.winner === null || (typeof value.winner === 'string' && WINNERS.has(value.winner)))
}

function isPendingResolution(value: unknown): value is PendingResolution {
  if (!isPlainObject(value) || !Array.isArray(value.hunterIds)) return false
  return (value.origin === 'night' || value.origin === 'day') &&
    value.hunterIds.length <= MAX_PLAYERS &&
    value.hunterIds.every(isPlayerId) &&
    new Set(value.hunterIds).size === value.hunterIds.length &&
    isNullablePlayerId(value.mayorId) &&
    (value.nextStatus === 'day_discussion' || value.nextStatus === 'night') &&
    isBoundedInteger(value.nextRound, 0, 999)
}

export function isGameState(value: unknown): value is GameState {
  if (!isPlainObject(value) || !Array.isArray(value.players)) return false
  if (value.players.length > MAX_PLAYERS || !value.players.every(isLocalPlayer)) return false
  if (!hasUniqueIds(value.players as LocalPlayer[])) return false

  return typeof value.code === 'string' &&
    (value.revision === undefined || isBoundedInteger(value.revision, 0, Number.MAX_SAFE_INTEGER)) &&
    typeof value.status === 'string' && GAME_STATUSES.has(value.status) &&
    (value.phase === null || (typeof value.phase === 'string' && NIGHT_PHASES.has(value.phase))) &&
    isBoundedInteger(value.round, 0, 999) &&
    isRoleConfig(value.config) &&
    isLobbySettings(value.settings) &&
    typeof value.witchHealUsed === 'boolean' &&
    typeof value.witchPoisonUsed === 'boolean' &&
    typeof value.priestUsed === 'boolean' &&
    isRoundData(value.currentRound) &&
    value.currentRound.code === value.code &&
    value.currentRound.round === value.round &&
    (value.winner === null || (typeof value.winner === 'string' && WINNERS.has(value.winner))) &&
    (value.pendingResolution === undefined || value.pendingResolution === null || isPendingResolution(value.pendingResolution))
}

export function isLobbyState(value: unknown): value is LobbyState {
  if (!isPlainObject(value) || !Array.isArray(value.players)) return false
  if (value.players.length > MAX_PLAYERS) return false

  const players = value.players.filter(isPlainObject)
  if (players.length !== value.players.length) return false
  if (!players.every(player => (
    isPlayerId(player.id) &&
    isStoredName(player.name) &&
    typeof player.isAdmin === 'boolean'
  ))) return false

  return typeof value.code === 'string' &&
    hasUniqueIds(players as Array<{ id: string }>) &&
    isRoleConfig(value.config) &&
    isLobbySettings(value.settings)
}

function normalizeRound(data: RoundData): RoundData {
  return {
    ...data,
    tiedCandidateIds: Array.isArray(data.tiedCandidateIds) ? data.tiedCandidateIds : [],
    tieBreakType:
      data.tieBreakType === 'mayor_election' || data.tieBreakType === 'day_elimination'
        ? data.tieBreakType
        : null,
  }
}

function normalizeGameState(state: GameState): GameState {
  return {
    ...state,
    revision: isBoundedInteger(state.revision, 0, Number.MAX_SAFE_INTEGER) ? state.revision : 0,
    currentRound: normalizeRound(state.currentRound),
    pendingResolution: state.pendingResolution ?? null,
  }
}

export function gameRevision(state: GameState | null | undefined): number {
  return state?.revision ?? 0
}

export function shouldAcceptGameState(current: GameState | null, incoming: GameState): boolean {
  return current === null || gameRevision(incoming) >= gameRevision(current)
}

export function saveName(name: string) {
  writeValue('werwolf_name', normalizePlayerName(name))
}

export function loadName(): string {
  return normalizePlayerName(readValue('werwolf_name') ?? '')
}

export function saveMyPlayer(code: string, player: { id: string; name: string; isAdmin: boolean }) {
  writeValue(`werwolf_player_${code}`, {
    ...player,
    name: normalizePlayerName(player.name),
  })
}

export function loadMyPlayer(code: string): { id: string; name: string; isAdmin: boolean } | null {
  const value = parseJson(readValue(`werwolf_player_${code}`))
  if (!isPlainObject(value) || !isPlayerId(value.id) || typeof value.isAdmin !== 'boolean') return null
  const name = typeof value.name === 'string' ? normalizePlayerName(value.name) : ''
  return name ? { id: value.id, name, isAdmin: value.isAdmin } : null
}

export function saveLobby(state: LobbyState) {
  writeValue(lobbyKey(state.code), state)
}

export function loadLobby(code: string): LobbyState | null {
  const value = parseJson(readValue(lobbyKey(code)))
  return isLobbyState(value) && value.code === code ? value : null
}

export function saveGameState(state: GameState) {
  const normalized = normalizeGameState(state)
  writeValue(gameKey(normalized.code), normalized)
}

export function loadGameState(code: string): GameState | null {
  const value = parseJson(readValue(gameKey(code)))
  return isGameState(value) && value.code === code ? normalizeGameState(value) : null
}

// Keep completed rounds separate so the game log survives later state changes.
export function saveRound(data: RoundData) {
  const normalized = normalizeRound(data)
  writeValue(roundKey(normalized.code, normalized.round), normalized)
}

export function loadRound(code: string, round: number): RoundData | null {
  const value = parseJson(readValue(roundKey(code, round)))
  return isRoundData(value) && value.code === code && value.round === round ? normalizeRound(value) : null
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
    tiedCandidateIds: [],
    tieBreakType: null,
    winner: null,
  }
}
