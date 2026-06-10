import { RoleConfig } from '@/types/game'

export function getAutoConfig(playerCount: number): RoleConfig {
  let werewolves: number
  let priest = 0
  let fool = 0
  let girl = 0

  if (playerCount <= 6) {
    werewolves = 1
  } else if (playerCount <= 9) {
    werewolves = 2
  } else if (playerCount <= 12) {
    werewolves = 3
    priest = 1
    fool = 1
  } else if (playerCount <= 15) {
    werewolves = 4
    priest = 1
    fool = 1
    girl = 1
  } else {
    werewolves = 5
    priest = 1
    fool = 1
    girl = 1
  }

  const hunter = playerCount >= 7 ? 1 : 0
  const special = werewolves + 1 + 1 + hunter + priest + fool + girl // +witch +seer
  const villagers = Math.max(0, playerCount - special)

  return {
    werewolf: werewolves,
    witch: 1,
    seer: 1,
    hunter,
    amor: 0,
    fool,
    girl,
    priest,
    villager: villagers,
  }
}

export function getTotalRoles(config: RoleConfig): number {
  return Object.values(config).reduce((sum, n) => sum + n, 0)
}

export function getMinPlayers(): number {
  return 5
}
