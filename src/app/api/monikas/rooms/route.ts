// POST /api/monikas/rooms
// Creates a new room with the caller as host player.

import { NextRequest, NextResponse } from 'next/server'
import { getMonikasClient, dbUnavailable, bad } from '@/lib/monikas/server'
import { mapRoom, mapPlayer, type CreateRoomRequest } from '@/lib/monikas/types'

export async function POST(req: NextRequest) {
  const supabase = getMonikasClient()
  if (!supabase) return dbUnavailable()

  let body: CreateRoomRequest
  try {
    body = (await req.json()) as CreateRoomRequest
  } catch {
    return bad('invalid json body')
  }

  const hostName = typeof body.hostName === 'string' ? body.hostName.trim() : ''
  if (!hostName) return bad('hostName required')
  if (hostName.length > 40) return bad('hostName too long')

  const timer = typeof body.timerSeconds === 'number' ? body.timerSeconds : 60
  if (timer < 10 || timer > 300) return bad('timerSeconds out of range (10-300)')

  const { data: rpcData, error: rpcErr } = await supabase.rpc('monikas_create_room', {
    p_host_name: hostName,
    p_timer_seconds: timer,
  })

  if (rpcErr || !rpcData || !rpcData.length) {
    console.error('[monikas/rooms POST] rpc failed', rpcErr)
    return NextResponse.json({ error: 'could not create room' }, { status: 500 })
  }

  const { room_id, room_code, player_id, player_token } = rpcData[0]

  const [{ data: roomRow }, { data: playerRow }] = await Promise.all([
    supabase.from('monikas_rooms').select('*').eq('id', room_id).single(),
    supabase.from('monikas_players').select('*').eq('id', player_id).single(),
  ])

  if (!roomRow || !playerRow) {
    console.error('[monikas/rooms POST] reload after create failed')
    return NextResponse.json({ error: 'room created but reload failed' }, { status: 500 })
  }

  return NextResponse.json({
    room: mapRoom(roomRow),
    player: mapPlayer(playerRow),
    playerToken: player_token,
    roomCode: room_code,
  })
}
