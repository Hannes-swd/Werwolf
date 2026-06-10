import { Role, RoleConfig } from '@/types/game'

export function assignRoles(playerIds: string[], config: RoleConfig): Map<string, Role> {
  const rolePool: Role[] = []

  for (const [role, count] of Object.entries(config) as [Role, number][]) {
    for (let i = 0; i < count; i++) rolePool.push(role)
  }

  // Fisher-Yates shuffle
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]]
  }

  const map = new Map<string, Role>()
  playerIds.forEach((id, i) => map.set(id, rolePool[i]))
  return map
}

export function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function generateGuestName(): string {
  const adjectives = [
    'Mutiger', 'Schlauer', 'Tapferer', 'Wilder', 'Kluger', 'Sanfter',
    'Flinker', 'Stiller', 'Frecher', 'Starker', 'Listiger', 'Wacher',
  ]
  const animals = [
    'Fuchs', 'Reh', 'Bär', 'Luchs', 'Ente', 'Lamm',
    'Adler', 'Igel', 'Wolf', 'Dachs', 'Hirsch', 'Hase',
  ]
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adj}${animal}`
}
