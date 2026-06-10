import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { checkWinCondition } from '@/lib/gameLogic'
import { Player } from '@/types/game'

export async function POST(req: NextRequest) {
  const { code, action, mayorId, successorId, hunterTargetId } = await req.json()
  const db = createServiceClient()

  const { data: lobby } = await db.from('lobbies').select('*').eq('code', code).single()
  if (!lobby) return NextResponse.json({ error: 'Lobby nicht gefunden' }, { status: 404 })

  // Admin starts voting
  if (action === 'start_vote') {
    await db.from('lobbies').update({ status: 'day_vote' }).eq('code', code)
    return NextResponse.json({ ok: true })
  }

  // Mayor breaks tie
  if (action === 'tiebreak' && mayorId && successorId) {
    const { data: players } = await db.from('players').select('*').eq('lobby_code', code)
    const target = (players as Player[]).find(p => p.id === successorId)!

    if (target.role === 'fool') {
      await db.from('players').update({ can_vote: false }).eq('id', successorId)
      await db.from('game_events').insert({
        lobby_code: code,
        round: lobby.round,
        phase: 'tiebreaker',
        event_type: 'fool_revealed',
        description: `${target.displayName} ist der Dorfdepp – überlebt, verliert Stimmrecht`,
      })
      await db.from('lobbies').update({ status: 'night', round: lobby.round + 1 }).eq('code', code)
      return NextResponse.json({ ok: true, foolRevealed: true })
    }

    await db.from('players').update({ is_alive: false }).eq('id', successorId)
    await db.from('game_events').insert({
      lobby_code: code,
      round: lobby.round,
      phase: 'tiebreaker',
      event_type: 'death',
      description: `${target.displayName} wurde durch Bürgermeister-Entscheid eliminiert`,
    })

    const updated = (players as Player[]).map(p =>
      p.id === successorId ? { ...p, isAlive: false } : p
    )
    const winner = checkWinCondition(updated)
    if (winner) {
      await db.from('lobbies').update({ status: 'ended' }).eq('code', code)
      return NextResponse.json({ ok: true, winner })
    }

    if (target.role === 'hunter') {
      return NextResponse.json({ ok: true, hunterPending: true, targetId: successorId })
    }
    if (target.isMayor) {
      return NextResponse.json({ ok: true, mayorPending: true, targetId: successorId })
    }

    await db.from('lobbies').update({ status: 'night', round: lobby.round + 1 }).eq('code', code)
    return NextResponse.json({ ok: true })
  }

  // Mayor passes title on death
  if (action === 'pass_title' && successorId) {
    await db.from('players').update({ is_mayor: false }).eq('lobby_code', code)
    await db.from('players').update({ is_mayor: true }).eq('id', successorId)
    await db.from('game_events').insert({
      lobby_code: code,
      round: lobby.round,
      phase: 'night',
      event_type: 'mayor_passed',
      description: `Bürgermeister-Titel weitergegeben`,
    })
    await db.from('lobbies').update({ status: 'day_discussion', phase: null }).eq('code', code)
    return NextResponse.json({ ok: true })
  }

  // Hunter shoots
  if (action === 'hunter_shoot' && hunterTargetId) {
    const { data: players } = await db.from('players').select('*').eq('lobby_code', code)
    const target = (players as Player[]).find(p => p.id === hunterTargetId)!

    await db.from('players').update({ is_alive: false }).eq('id', hunterTargetId)
    await db.from('game_events').insert({
      lobby_code: code,
      round: lobby.round,
      phase: 'hunter',
      event_type: 'death',
      description: `Jäger erschießt ${target.displayName}`,
    })

    const updated = (players as Player[]).map(p =>
      p.id === hunterTargetId ? { ...p, isAlive: false } : p
    )
    const winner = checkWinCondition(updated)
    if (winner) {
      await db.from('lobbies').update({ status: 'ended' }).eq('code', code)
      return NextResponse.json({ ok: true, winner })
    }

    const wasDay = lobby.status === 'day_vote' || lobby.status === 'tiebreaker'
    if (wasDay) {
      await db.from('lobbies').update({ status: 'night', round: lobby.round + 1 }).eq('code', code)
    } else {
      await db.from('lobbies').update({ status: 'day_discussion', phase: null }).eq('code', code)
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
