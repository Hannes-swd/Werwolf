export type Role =
  | 'villager'
  | 'werewolf'
  | 'witch'
  | 'seer'
  | 'hunter'
  | 'amor'
  | 'fool'
  | 'girl'
  | 'priest'

export type GameStatus =
  | 'waiting'
  | 'mayor_election'
  | 'night'
  | 'day_discussion'
  | 'day_vote'
  | 'tiebreaker'
  | 'ended'

export type NightPhase =
  | 'amor'
  | 'priest'
  | 'wolf'
  | 'witch'
  | 'seer'
  | 'resolve'

export type VoteType = 'mayor_election' | 'day_elimination' | 'tiebreaker'

export type EventType =
  | 'death'
  | 'heal'
  | 'poison'
  | 'vote'
  | 'bless'
  | 'peek_caught'
  | 'win'
  | 'mayor_elected'
  | 'mayor_passed'
  | 'fool_revealed'

export interface RoleConfig {
  werewolf: number
  witch: number
  seer: number
  hunter: number
  amor: number
  fool: number
  girl: number
  priest: number
  villager: number
}

export interface LobbySettings {
  votesVisible: boolean
  mayorEnabled: boolean
  autoConfig: boolean
}

export interface Lobby {
  code: string
  adminId: string
  status: GameStatus
  phase: NightPhase | null
  round: number
  config: RoleConfig
  settings: LobbySettings
  createdAt: string
}

export interface Player {
  id: string
  lobbyCode: string
  userId: string | null
  displayName: string
  role: Role | null
  isAlive: boolean
  isAdmin: boolean
  isMayor: boolean
  canVote: boolean
  loverId: string | null
  priestBlessed: boolean
  joinedAt: string
}

export interface NightAction {
  id: string
  lobbyCode: string
  round: number
  phase: string
  actorId: string
  targetId: string | null
  secondTargetId?: string | null
  action: 'kill' | 'heal' | 'poison' | 'reveal' | 'bless' | 'peek' | 'link' | 'skip'
  createdAt: string
}

export interface Vote {
  id: string
  lobbyCode: string
  round: number
  voteType: VoteType
  voterId: string
  targetId: string
  createdAt: string
}

export interface GameEvent {
  id: string
  lobbyCode: string
  round: number
  phase: string
  eventType: EventType
  description: string
  createdAt: string
}

export interface WitchStatus {
  playerId: string
  healUsed: boolean
  poisonUsed: boolean
}

export interface NightResult {
  killed: string[]
  healed: string[]
  poisoned: string[]
  wolfTarget: string | null
  priestProtected: boolean
}
