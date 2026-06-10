import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getEliminationTarget, checkWinCondition } from '@/lib/gameLogic'
import { Player } from '@/types/game'

export async function POST(req: NextRequest) {
  const { code, voterId, targetId, voteType } = await req.json()
  const db = createServiceClient()

  const { data: lobby } = await db.from('lobbies').select('*').eq('code', code).single()
  if (!lobby) return NextResponse.json({ error: 'Lobby nicht gefunden' }, { status: 404 })

  // Insert or upsert vote
  const { error: voteErr } = await db.from('votes').upsert({
    lobby_code: code,
    round: lobby.round,
    vote_type: voteType,
    voter_id: voterId,
    target_id: targetId,
  }, { onConflict: 'lobby_code,round,vote_type,voter_id' })

  if (voteErr) return NextResponse.json({ error: voteErr.message }, { status: 500 })

  // Check if all eligible players have voted
  const { data: players } = await db
    .from('players')
    .select('*')
    .eq('lobby_code', code)
    .eq('is_alive', true)

  type RawPlayer = Record<string, unknown>
  const eligible = (players as RawPlayer[]).filter(p =>
    voteType === 'mayor_election' ? true : p.can_vote
  )

  const { data: allVotes } = await db
    .from('votes')
    .select('*')
    .eq('lobby_code', code)
    .eq('round', lobby.round)
    .eq('vote_type', voteType)

  if (!allVotes || allVotes.length < eligible.length) {
    return NextResponse.json({ ok: true, complete: false })
  }

  // All voted – resolve
  if (voteType === 'mayor_election') {
    const target = getEliminationTarget(allVotes)
    if (target) {
      await db.from('players').update({ is_mayor: true }).eq('id', target)
      await db.from('lobbies').update({ status: 'night' }).eq('code', code)
      return NextResponse.json({ ok: true, complete: true, mayorId: target })
    }
    // Tie in mayor election – admin decides (handled in mayor route)
    return NextResponse.json({ ok: true, complete: true, tie: true })
  }

  if (voteType === 'day_elimination') {
    const target = getEliminationTarget(allVotes)
    if (!target) {
      // Check if mayor exists for tiebreaker
      const rawPlayers = players as RawPlayer[]
      const mayor = rawPlayers.find(p => p.is_mayor && p.is_alive)
      if (mayor) {
        await db.from('lobbies').update({ status: 'tiebreaker' }).eq('code', code)
        return NextResponse.json({ ok: true, complete: true, tie: true })
      }
      // No mayor and tie = nobody dies
      await db.from('lobbies').update({ status: 'night', round: lobby.round + 1 }).eq('code', code)
      return NextResponse.json({ ok: true, complete: true, tie: true, noKill: true })
    }

    return await eliminatePlayer(target, code, lobby, players as RawPlayer[], db)
  }

  return NextResponse.json({ ok: true, complete: true })
}

type RawPlayer = Record<string, unknown>

async function eliminatePlayer(
  targetId: string,
  code: string,
  lobby: Record<string, unknown>,
  players: RawPlayer[],
  db: ReturnType<typeof import('@/lib/supabase').createServiceClient>
) {
  const target = players.find(p => p.id === targetId)!

  // Dorfdepp: überlebt, verliert Stimmrecht
  if (target.role === 'fool') {
    await db.from('players').update({ can_vote: false }).eq('id', targetId)
    await db.from('game_events').insert({
      lobby_code: code,
      round: lobby.round,
      phase: 'day_vote',
      event_type: 'fool_revealed',
      description: `${target.display_name} ist der Dorfdepp – überlebt, verliert Stimmrecht`,
    })
    await db.from('lobbies').update({ status: 'night', round: (lobby.round as number) + 1 }).eq('code', code)
    return NextResponse.json({ ok: true, complete: true, foolRevealed: true, targetId })
  }

  await db.from('players').update({ is_alive: false }).eq('id', targetId)
  await db.from('game_events').insert({
    lobby_code: code,
    round: lobby.round,
    phase: 'day_vote',
    event_type: 'death',
    description: `${target.display_name} wurde eliminiert (${target.role})`,
  })

  // Lover dies too
  const loverDeaths: string[] = []
  if (target.lover_id) {
    const lover = players.find(p => p.id === target.lover_id)
    if (lover && lover.is_alive) {
      await db.from('players').update({ is_alive: false }).eq('id', lover.id)
      loverDeaths.push(lover.id as string)
    }
  }

  const updatedPlayers: Player[] = players.map(p => ({
    id: p.id as string,
    lobbyCode: p.lobby_code as string,
    userId: p.user_id as string | null,
    displayName: p.display_name as string,
    role: p.role as Player['role'],
    isAlive: p.id !== targetId && !loverDeaths.includes(p.id as string) ? (p.is_alive as boolean) : false,
    isAdmin: p.is_admin as boolean,
    isMayor: p.is_mayor as boolean,
    canVote: p.can_vote as boolean,
    loverId: p.lover_id as string | null,
    priestBlessed: p.priest_blessed as boolean,
    joinedAt: p.joined_at as string,
  }))

  const winner = checkWinCondition(updatedPlayers)
  if (winner) {
    await db.from('lobbies').update({ status: 'ended' }).eq('code', code)
    return NextResponse.json({ ok: true, complete: true, winner, targetId, loverDeaths })
  }

  // Jäger muss schießen
  if (target.role === 'hunter') {
    return NextResponse.json({ ok: true, complete: true, hunterPending: true, targetId, loverDeaths })
  }

  // Bürgermeister muss Nachfolger wählen
  if (target.is_mayor) {
    return NextResponse.json({ ok: true, complete: true, mayorPending: true, targetId, loverDeaths })
  }

  await db.from('lobbies').update({ status: 'night', round: (lobby.round as number) + 1 }).eq('code', code)
  return NextResponse.json({ ok: true, complete: true, targetId, loverDeaths })
}
