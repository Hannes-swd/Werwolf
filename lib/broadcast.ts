import { supabase } from '@/lib/supabase'
import { GameState, LobbyState } from '@/lib/storage'

export type BroadcastMsg =
  | { type: 'lobby_state'; payload: LobbyState }
  | { type: 'game_state'; payload: GameState }
  | { type: 'request_sync'; payload?: { joiningPlayer?: { id: string; name: string } } }
  | { type: 'player_joined'; payload: { id: string; name: string } }
  | { type: 'night_action'; payload: { phase: string; actorId: string; targetId: string | null; action: string } }
  | { type: 'vote'; payload: { voterId: string; targetId: string; voteType: string } }
  | { type: 'girl_peek_result'; payload: { requesterId: string; wolves: string[]; caught: boolean } }
  | { type: 'score_update'; payload: { playerId: string; playerName: string; score: number } }
  | { type: 'kicked'; payload: { playerId: string } }
  | { type: 'lobby_closed' }

export function broadcastLobby(code: string, state: LobbyState) {
  supabase.channel(`werwolf:${code}`).send({
    type: 'broadcast',
    event: 'msg',
    payload: { type: 'lobby_state', payload: state } satisfies BroadcastMsg,
  })
}

export function broadcastGame(code: string, state: GameState) {
  supabase.channel(`werwolf:${code}`).send({
    type: 'broadcast',
    event: 'msg',
    payload: { type: 'game_state', payload: state } satisfies BroadcastMsg,
  })
}

export function subscribeToLobby(
  code: string,
  onMsg: (msg: BroadcastMsg) => void
) {
  const channel = supabase
    .channel(`werwolf:${code}`)
    .on('broadcast', { event: 'msg' }, ({ payload }) => onMsg(payload as BroadcastMsg))
    .subscribe()
  return channel
}
