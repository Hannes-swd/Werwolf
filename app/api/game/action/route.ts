import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { resolveNight, checkWinCondition, getNextNightPhase } from '@/lib/gameLogic'
import { Player, RoleConfig } from '@/types/game'

export async function POST(req: NextRequest) {
  const { code, actorId, targetId, action, phase } = await req.json()
  const db = createServiceClient()

  const { data: lobby } = await db.from('lobbies').select('*').eq('code', code).single()
  if (!lobby) return NextResponse.json({ error: 'Lobby nicht gefunden' }, { status: 404 })

  // Record the action
  await db.from('night_actions').insert({
    lobby_code: code,
    round: lobby.round,
    phase,
    actor_id: actorId,
    target_id: targetId ?? null,
    action,
  })

  // Handle priest blessing
  if (action === 'bless' && targetId) {
    await db.from('players').update({ priest_blessed: true }).eq('id', targetId)
    await advancePhase(code, phase, lobby, db)
    return NextResponse.json({ ok: true })
  }

  // Handle amor linking
  if (action === 'link' && targetId) {
    const { data: targets } = await db
      .from('players')
      .select('id')
      .eq('lobby_code', code)
      .in('id', [actorId, targetId])

    if (targets && targets.length === 2) {
      await db.from('players').update({ lover_id: targetId }).eq('id', actorId)
      await db.from('players').update({ lover_id: actorId }).eq('id', targetId)
    }
    await advancePhase(code, phase, lobby, db)
    return NextResponse.json({ ok: true })
  }

  // Handle girl peek
  if (action === 'peek') {
    const { data: wolves } = await db
      .from('players')
      .select('id, display_name')
      .eq('lobby_code', code)
      .eq('role', 'werewolf')
      .eq('is_alive', true)

    const caught = Math.random() < 0.4
    if (caught) {
      await db.from('game_events').insert({
        lobby_code: code,
        round: lobby.round,
        phase: 'wolf',
        event_type: 'peek_caught',
        description: 'Das Mädchen wurde beim Spähen erwischt',
      })
    }
    return NextResponse.json({ ok: true, wolves: wolves?.map(w => w.display_name), caught })
  }

  // Check if all wolves have voted (for wolf phase)
  if (phase === 'wolf' && action === 'kill') {
    const { data: wolves } = await db
      .from('players')
      .select('id')
      .eq('lobby_code', code)
      .eq('role', 'werewolf')
      .eq('is_alive', true)

    const { data: wolfActions } = await db
      .from('night_actions')
      .select('actor_id')
      .eq('lobby_code', code)
      .eq('round', lobby.round)
      .eq('phase', 'wolf')

    const votedWolves = new Set(wolfActions?.map(a => a.actor_id))
    const allVoted = wolves?.every(w => votedWolves.has(w.id))

    if (!allVoted) return NextResponse.json({ ok: true, waiting: true })
    await advancePhase(code, phase, lobby, db)
    return NextResponse.json({ ok: true })
  }

  // Witch or seer or skip → advance
  if (['heal', 'poison', 'reveal', 'skip'].includes(action)) {
    await advancePhase(code, phase, lobby, db)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

async function advancePhase(
  code: string,
  currentPhase: string,
  lobby: Record<string, unknown>,
  db: ReturnType<typeof import('@/lib/supabase').createServiceClient>
) {
  const { data: witchPlayer } = await db
    .from('players')
    .select('id')
    .eq('lobby_code', code)
    .eq('role', 'witch')
    .single()

  const witchStatus = witchPlayer
    ? await db.from('witch_status').select('*').eq('player_id', witchPlayer.id).single()
    : null

  const healUsed = witchStatus?.data?.heal_used ?? true
  const poisonUsed = witchStatus?.data?.poison_used ?? true

  const { data: priestPlayer } = await db
    .from('players')
    .select('id')
    .eq('lobby_code', code)
    .eq('role', 'priest')
    .single()

  let priestUsed = true
  if (priestPlayer) {
    const { data: blessData } = await db
      .from('night_actions')
      .select('id')
      .eq('lobby_code', code)
      .eq('actor_id', priestPlayer.id)
      .eq('action', 'bless')
      .limit(1)
    priestUsed = (blessData?.length ?? 0) > 0
  }

  const config = lobby.config as RoleConfig
  const next = getNextNightPhase(
    currentPhase,
    { amor: config.amor, priest: config.priest, witch: config.witch, seer: config.seer },
    lobby.round as number,
    healUsed,
    poisonUsed,
    priestUsed
  )

  if (next === 'resolve' || next === null) {
    await resolveNightPhase(code, lobby, db)
  } else {
    await db.from('lobbies').update({ phase: next }).eq('code', code)
  }
}

async function resolveNightPhase(
  code: string,
  lobby: Record<string, unknown>,
  db: ReturnType<typeof import('@/lib/supabase').createServiceClient>
) {
  const { data: nightActions } = await db
    .from('night_actions')
    .select('*')
    .eq('lobby_code', code)
    .eq('round', lobby.round)

  const { data: players } = await db
    .from('players')
    .select('*')
    .eq('lobby_code', code)

  const result = resolveNight(players as Player[], nightActions ?? [])

  // Apply deaths
  for (const id of result.killed) {
    await db.from('players').update({ is_alive: false }).eq('id', id)
    const p = (players as Player[]).find(pl => pl.id === id)
    await db.from('game_events').insert({
      lobby_code: code,
      round: lobby.round,
      phase: 'night',
      event_type: 'death',
      description: `${p?.displayName ?? id} starb in der Nacht`,
    })
    // Lover
    if (p?.loverId) {
      const lover = (players as Player[]).find(pl => pl.id === p.loverId)
      if (lover?.isAlive) {
        await db.from('players').update({ is_alive: false }).eq('id', lover.id)
        result.killed.push(lover.id)
      }
    }
  }

  // Reset priest blessings
  await db.from('players').update({ priest_blessed: false }).eq('lobby_code', code)

  const updatedPlayers = (players as Player[]).map(p => ({
    ...p,
    isAlive: !result.killed.includes(p.id),
  }))

  const winner = checkWinCondition(updatedPlayers)
  if (winner) {
    await db.from('lobbies').update({ status: 'ended', phase: null }).eq('code', code)
    return
  }

  // Hunter died at night?
  const hunterDied = result.killed.find(
    id => (players as Player[]).find(p => p.id === id)?.role === 'hunter'
  )
  if (hunterDied) {
    await db.from('lobbies').update({ status: 'night', phase: 'hunter_pending' }).eq('code', code)
    return
  }

  // Mayor died at night?
  const mayorDied = result.killed.find(
    id => (players as Player[]).find(p => p.id === id)?.isMayor
  )
  if (mayorDied) {
    await db.from('lobbies').update({ status: 'night', phase: 'mayor_pending' }).eq('code', code)
    return
  }

  await db.from('lobbies').update({ status: 'day_discussion', phase: null }).eq('code', code)
}
