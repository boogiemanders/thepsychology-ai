// POST /api/monikas/rooms/[code]/start
// Minimal start-game: flips status to in_progress and picks turn_order=0 as the first actor.
// Real engine logic (deck shuffle, team assignment, rounds) lands in Milestone 3.

import { NextRequest, NextResponse } from 'next/server'
import { getMonikasClient, dbUnavailable, bad, requirePlayer } from '@/lib/monikas/server'
import { mapRoom } from '@/lib/monikas/types'

const MIN_PLAYERS = 1

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code) return bad('room code required')

  const auth = await requirePlayer(req, code)
  if (auth instanceof NextResponse) return auth
  const { supabase, roomId } = auth

  const { data: players } = await supabase
    .from('monikas_players')
    .select('id,turn_order,join_type')
    .eq('room_id', roomId)
    .order('turn_order', { ascending: true })

  if (!players || players.length < MIN_PLAYERS) {
    return bad(`need at least ${MIN_PLAYERS} players`, 409)
  }

  // Prefer a web-joined player as the first actor so the host phone (which may
  // be mirroring to a TV) doesn't leak private card text. Fallback: host.
  const firstActor = players.find(p => p.join_type === 'web_player') ?? players[0]

  const { data: updated, error } = await supabase
    .from('monikas_rooms')
    .update({
      status: 'in_progress',
      active_actor_player_id: firstActor.id,
      current_round: 1,
      current_team: 1,
      current_turn_index: 0,
    })
    .eq('id', roomId)
    .eq('status', 'lobby')
    .select('*')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'could not start' }, { status: 500 })
  }

  return NextResponse.json({ room: mapRoom(updated) })
}
