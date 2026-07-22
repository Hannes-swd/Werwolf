import { describe, expect, it } from 'vitest'
import {
  isLobbyCode,
  isPlayerId,
  normalizeLobbyCode,
  normalizePlayerName,
} from '@/lib/validation'

describe('input validation', () => {
  it('normalizes names without changing ordinary Unicode text', () => {
    expect(normalizePlayerName('  María\n  Wolf  ')).toBe('María Wolf')
    expect(normalizePlayerName('１２３')).toBe('123')
    expect(normalizePlayerName('a'.repeat(40))).toHaveLength(20)
  })

  it('normalizes and validates lobby codes', () => {
    expect(normalizeLobbyCode(' ab-c12! ')).toBe('ABC12')
    expect(isLobbyCode('ABC234')).toBe(true)
    expect(isLobbyCode('ABCI10')).toBe(false)
  })

  it('accepts bounded opaque player identifiers only', () => {
    expect(isPlayerId('30f0a219-3313-4b60-8b60-51319d95e98c')).toBe(true)
    expect(isPlayerId('../admin')).toBe(false)
    expect(isPlayerId('x'.repeat(65))).toBe(false)
  })
})
