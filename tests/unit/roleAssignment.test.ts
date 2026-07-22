import { describe, expect, it } from 'vitest'
import { assignRoles, generateLobbyCode, randomChance } from '@/lib/roleAssignment'

describe('role assignment security helpers', () => {
  it('creates human-friendly six-character lobby codes', () => {
    for (let index = 0; index < 100; index += 1) {
      expect(generateLobbyCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it('assigns every configured role exactly once per slot', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    const roles = assignRoles(ids, {
      werewolf: 1,
      witch: 1,
      seer: 1,
      hunter: 0,
      amor: 0,
      fool: 0,
      girl: 0,
      priest: 0,
      villager: 2,
    })

    expect([...roles.keys()]).toEqual(ids)
    expect([...roles.values()].sort()).toEqual(['seer', 'villager', 'villager', 'werewolf', 'witch'])
  })

  it('handles probability boundaries without requesting randomness', () => {
    expect(randomChance(0)).toBe(false)
    expect(randomChance(1)).toBe(true)
    expect(() => randomChance(-0.1)).toThrow(RangeError)
    expect(() => randomChance(1.1)).toThrow(RangeError)
  })
})
