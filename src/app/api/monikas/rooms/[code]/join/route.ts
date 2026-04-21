// POST /api/monikas/rooms/[code]/join
// Join an existing lobby as a new player.

import { NextRequest, NextResponse } from 'next/server'
import { getMonikasClient, dbUnavailable, bad } from '@/lib/monikas/server'
import { mapRoom, mapPlayer, type JoinRoomRequest, type JoinType } from '@/lib/monikas/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code) return bad('room code required')

  const supabase = getMonikasClient()
  if (!supabase) return dbUnavailable()

  let body: JoinRoomRequest
  try {
    body = (await req.json()) as JoinRoomRequest
  } catch {
    return bad('invalid json body')
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  if (!displayName) return bad('displayName required')
  if (displayName.length > 40) return bad('displayName too long')

  const joinType: JoinType =
    body.joinType === 'host_device' || body.joinType === 'web_player'
      ? body.joinType
      : 'web_player'

  const { data: rpcData, error: rpcErr } = await supabase.rpc('monikas_join_room', {
    p_room_code: code,
    p_display_name: displayName,
    p_join_type: joinType,
  })

  if (rpcErr) {
    const msg = rpcErr.message || 'join failed'
    if (msg.includes('room not found')) return bad('room not found', 404)
    if (msg.includes('not accepting joins')) return bad(msg, 409)
    console.error('[monikas/rooms/[code]/join POST] rpc failed', rpcErr)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (!rpcData || !rpcData.length) {
    return NextResponse.json({ error: 'join failed' }, { status: 500 })
  }

  const { room_id, player_id, player_token } = rpcData[0]

  const [{ data: roomRow }, { data: playerRow }] = await Promise.all([
    supabase.from('monikas_rooms').select('*').eq('id', room_id).single(),
    supabase.from('monikas_players').select('*').eq('id', player_id).single(),
  ])

  if (!roomRow || !playerRow) {
    return NextResponse.json({ error: 'joined but reload failed' }, { status: 500 })
  }

  return NextResponse.json({
    room: mapRoom(roomRow),
    player: mapPlayer(playerRow),
    playerToken: player_token,
  })
}
