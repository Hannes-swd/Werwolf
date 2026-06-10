import { Player, GameEvent, ROLE_LABELS } from '@/types/game'

export function exportGameTxt(
  lobbyCode: string,
  players: Player[],
  events: GameEvent[],
  winner: string | null,
  rounds: number,
  mayorName: string | null,
  votesVisible: boolean
): void {
  const date = new Date().toLocaleDateString('de-DE')
  const lines: string[] = []

  lines.push(`WERWOLF SPIEL - Lobby: ${lobbyCode}`)
  lines.push(`Datum: ${date} | Spieler: ${players.length}`)
  lines.push(`Votes: ${votesVisible ? 'Offen' : 'Verdeckt'} | Bürgermeister: ${mayorName ?? 'Kein'}`)
  lines.push('')
  lines.push('=== ROLLEN ===')
  players.forEach((p, i) => {
    const role = p.role ? ROLE_LABELS[p.role] : 'Unbekannt'
    lines.push(`${i + 1}. ${p.displayName.padEnd(20)} → ${role.toUpperCase()}`)
  })

  if (mayorName) {
    lines.push('')
    lines.push('=== BÜRGERMEISTER ===')
    lines.push(`Gewählt: ${mayorName}`)
  }

  lines.push('')
  lines.push('=== SPIEL-LOG ===')
  events.forEach(e => {
    lines.push(`[Runde ${e.round} – ${e.phase}]  ${e.description}`)
  })

  lines.push('')
  lines.push('=== ERGEBNIS ===')
  const winnerLabel =
    winner === 'village' ? 'DORF' : winner === 'wolves' ? 'WERWÖLFE' : 'LIEBESPAAR'
  lines.push(`Gewinner: ${winnerLabel} nach ${rounds} Runden`)

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `werwolf_${date.replace(/\./g, '-')}_${lobbyCode}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportGameJson(
  lobbyCode: string,
  players: Player[],
  events: GameEvent[],
  winner: string | null,
  rounds: number
): void {
  const data = {
    lobbyCode,
    date: new Date().toISOString(),
    rounds,
    winner,
    players: players.map(p => ({
      name: p.displayName,
      role: p.role,
      alive: p.isAlive,
      wasMayor: p.isMayor,
    })),
    events: events.map(e => ({
      round: e.round,
      phase: e.phase,
      type: e.eventType,
      description: e.description,
    })),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toLocaleDateString('de-DE').replace(/\./g, '-')
  a.download = `werwolf_${date}_${lobbyCode}.json`
  a.click()
  URL.revokeObjectURL(url)
}
