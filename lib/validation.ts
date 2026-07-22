const PLAYER_NAME_MAX_LENGTH = 20
const LOBBY_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/
const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export function normalizePlayerName(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PLAYER_NAME_MAX_LENGTH)
}

export function normalizeLobbyCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function isLobbyCode(value: unknown): value is string {
  return typeof value === 'string' && LOBBY_CODE_PATTERN.test(value)
}

export function isPlayerId(value: unknown): value is string {
  return typeof value === 'string' && PLAYER_ID_PATTERN.test(value)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
