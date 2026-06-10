import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { assignRoles } from '@/lib/roleAssignment'
import { RoleConfig } from '@/types/game'

export async function POST(req: NextRequest) {
  const { code, adminPlayerId } = await req.json()
  const db = createServiceClient()

  const { data: lobby } = await db.from('lobbies').select('*').eq('code', code).single()
  if (!lobby) return NextResponse.json({ error: 'Lobby nicht gefunden' }, { status: 404 })

  const { data: adminPlayer } = await db
    .from('players')
    .select('*')
    .eq('id', adminPlayerId)
    .single()
  if (!adminPlayer?.is_admin)
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })

  const { data: players } = await db
    .from('players')
    .select('id')
    .eq('lobby_code', code)

  if (!players || players.length < 5)
    return NextResponse.json({ error: 'Mindestens 5 Spieler benötigt' }, { status: 400 })

  const config = lobby.config as RoleConfig
  const roleMap = assignRoles(players.map(p => p.id), config)

  // Update all players with their roles
  const updates = Array.from(roleMap.entries()).map(([playerId, role]) =>
    db.from('players').update({ role }).eq('id', playerId)
  )
  await Promise.all(updates)

  // Create witch_status entry
  const witchEntry = players.find(p => roleMap.get(p.id) === 'witch')
  if (witchEntry) {
    await db.from('witch_status').insert({ player_id: witchEntry.id })
  }

  // Set lobby status
  const nextStatus = lobby.mayor_enabled ? 'mayor_election' : 'night'
  await db
    .from('lobbies')
    .update({ status: nextStatus, round: 1 })
    .eq('code', code)

  return NextResponse.json({ ok: true, nextStatus })
}
