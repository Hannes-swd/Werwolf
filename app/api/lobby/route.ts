import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateLobbyCode, generateGuestName } from '@/lib/roleAssignment'
import { getAutoConfig, getTotalRoles } from '@/lib/autoConfig'

export async function POST(req: NextRequest) {
  const { action, code, displayName, userId, settings, config } = await req.json()
  const db = createServiceClient()

  if (action === 'create') {
    let newCode = generateLobbyCode()
    // Ensure unique code
    while (true) {
      const { data } = await db.from('lobbies').select('code').eq('code', newCode).single()
      if (!data) break
      newCode = generateLobbyCode()
    }

    const name = displayName || generateGuestName()

    const { error: lobbyErr } = await db.from('lobbies').insert({
      code: newCode,
      admin_id: userId ?? newCode,
      status: 'waiting',
      config: config ?? getAutoConfig(5),
      votes_visible: settings?.votesVisible ?? true,
      mayor_enabled: settings?.mayorEnabled ?? true,
      auto_config: settings?.autoConfig ?? false,
    })

    if (lobbyErr) return NextResponse.json({ error: lobbyErr.message }, { status: 500 })

    const { data: player, error: playerErr } = await db
      .from('players')
      .insert({
        lobby_code: newCode,
        user_id: userId ?? null,
        display_name: name,
        is_admin: true,
      })
      .select()
      .single()

    if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })

    return NextResponse.json({ code: newCode, player })
  }

  if (action === 'join') {
    const { data: lobby } = await db
      .from('lobbies')
      .select('*')
      .eq('code', code)
      .single()

    if (!lobby) return NextResponse.json({ error: 'Lobby nicht gefunden' }, { status: 404 })
    if (lobby.status !== 'waiting')
      return NextResponse.json({ error: 'Spiel bereits gestartet' }, { status: 400 })

    const name = displayName || generateGuestName()

    const { data: player, error } = await db
      .from('players')
      .insert({
        lobby_code: code,
        user_id: userId ?? null,
        display_name: name,
        is_admin: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ lobby, player })
  }

  if (action === 'update_config') {
    const cfg = settings?.autoConfig
      ? getAutoConfig(settings.playerCount ?? 5)
      : config

    const { error } = await db
      .from('lobbies')
      .update({
        config: cfg,
        votes_visible: settings?.votesVisible,
        mayor_enabled: settings?.mayorEnabled,
        auto_config: settings?.autoConfig,
      })
      .eq('code', code)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
