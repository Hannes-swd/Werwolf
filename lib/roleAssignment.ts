import { Role, RoleConfig } from '@/types/game'

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive safe integer')
  }

  const range = 0x1_0000_0000
  const limit = range - (range % maxExclusive)
  const values = new Uint32Array(1)

  do {
    crypto.getRandomValues(values)
  } while (values[0] >= limit)

  return values[0] % maxExclusive
}

export function randomChance(probability: number): boolean {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('probability must be between 0 and 1')
  }
  if (probability === 0) return false
  if (probability === 1) return true
  return secureRandomInt(1_000_000) < probability * 1_000_000
}

export function assignRoles(playerIds: string[], config: RoleConfig): Map<string, Role> {
  const rolePool: Role[] = []

  for (const [role, count] of Object.entries(config) as [Role, number][]) {
    for (let i = 0; i < count; i++) rolePool.push(role)
  }

  // A secure shuffle keeps role assignment fair and unpredictable.
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    ;[rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]]
  }

  const map = new Map<string, Role>()
  playerIds.forEach((id, i) => map.set(id, rolePool[i]))
  return map
}

export function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[secureRandomInt(chars.length)]
  return code
}

export function generateGuestName(label = 'Player'): string {
  return `${label} ${secureRandomInt(9000) + 1000}`
}
