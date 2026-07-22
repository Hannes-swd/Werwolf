import { Player, NightAction, Vote, NightResult } from '@/types/game'

export function resolveNight(
  players: Player[],
  nightActions: NightAction[]
): NightResult {
  const alive = players.filter(p => p.isAlive)
  const result: NightResult = {
    killed: [],
    healed: [],
    poisoned: [],
    wolfTarget: null,
    priestProtected: false,
  }

  const wolfKill = nightActions.find(a => a.action === 'kill')
  const heal = nightActions.find(a => a.action === 'heal')
  const poison = nightActions.find(a => a.action === 'poison')

  if (wolfKill?.targetId) {
    result.wolfTarget = wolfKill.targetId
    const target = alive.find(p => p.id === wolfKill.targetId)
    if (target?.priestBlessed) {
      result.priestProtected = true
    } else if (heal?.targetId === wolfKill.targetId) {
      result.healed.push(wolfKill.targetId)
    } else {
      result.killed.push(wolfKill.targetId)
    }
  }

  if (poison?.targetId) {
    if (!result.killed.includes(poison.targetId)) {
      result.poisoned.push(poison.targetId)
      result.killed.push(poison.targetId)
    }
  }

  return result
}

export function countVotes(votes: Vote[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const vote of votes) {
    counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1)
  }
  return counts
}

export function getEliminationTarget(votes: Vote[]): string | null {
  const counts = countVotes(votes)
  if (counts.size === 0) return null

  let maxVotes = 0
  let topTargets: string[] = []

  for (const [targetId, count] of counts) {
    if (count > maxVotes) {
      maxVotes = count
      topTargets = [targetId]
    } else if (count === maxVotes) {
      topTargets.push(targetId)
    }
  }

  if (topTargets.length === 1) return topTargets[0]
  return null // A tie must be resolved by the configured decision maker.
}

export function checkWinCondition(players: Player[]): 'village' | 'wolves' | 'lovers' | null {
  const alive = players.filter(p => p.isAlive)
  const aliveWolves = alive.filter(p => p.role === 'werewolf')
  const aliveVillage = alive.filter(p => p.role !== 'werewolf')

  // The lovers win when they are the final pair.
  const lovers = alive.filter(p => p.loverId !== null)
  if (alive.length === 2 && lovers.length === 2 && lovers[0].loverId === lovers[1].id) {
    return 'lovers'
  }

  if (aliveWolves.length === 0) return 'village'
  if (aliveWolves.length >= aliveVillage.length) return 'wolves'

  return null
}

export function getNextNightPhase(
  current: string | null,
  config: { amor: number; priest: number; witch: number; seer: number },
  round: number,
  witchHealUsed: boolean,
  witchPoisonUsed: boolean,
  priestBlessed: boolean
): string | null {
  const phases: string[] = []

  if (round === 1 && config.amor > 0) phases.push('amor')
  if (config.priest > 0 && !priestBlessed) phases.push('priest')
  phases.push('wolf')
  if (config.witch > 0 && (!witchHealUsed || !witchPoisonUsed)) phases.push('witch')
  if (config.seer > 0) phases.push('seer')
  phases.push('resolve')

  if (current === null) return phases[0]
  const idx = phases.indexOf(current)
  return idx >= 0 && idx < phases.length - 1 ? phases[idx + 1] : null
}
