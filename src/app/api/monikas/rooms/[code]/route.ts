// GET /api/monikas/rooms/[code]
// Public-ish room state: room row + all players (no tokens, no card text).
// Used by lobby view on iOS and the web join page.

import { NextRequest, NextResponse } from 'next/server'
import { getMonikasClient, dbUnavailable, bad } from '@/lib/monikas/server'
import { mapRoom, mapPlayer } from '@/lib/monikas/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code) return bad('room code required')

  const supabase = getMonikasClient()
  if (!supabase) return dbUnavailable()

  const { data: roomRow, error } = await supabase
    .from('monikas_rooms')
    .select('*')
    .eq('room_code', code.toUpperCase())
    .maybeSingle()

  if (error) {
    console.error('[monikas/rooms GET] db error', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
  if (!roomRow) return bad('room not found', 404)

  const [{ data: playerRows }, { data: cardRows }] = await Promise.all([
    supabase
      .from('monikas_players')
      .select('*')
      .eq('room_id', roomRow.id)
      .order('turn_order', { ascending: true }),
    supabase
      .from('monikas_cards')
      .select('submitted_by_player_id')
      .eq('room_id', roomRow.id)
      .eq('source_type', 'user'),
  ])

  const cardCounts: Record<string, number> = {}
  for (const row of cardRows ?? []) {
    const id = row.submitted_by_player_id as string | null
    if (id) cardCounts[id] = (cardCounts[id] ?? 0) + 1
  }

  return NextResponse.json({
    room: mapRoom(roomRow),
    players: (playerRows ?? []).map(mapPlayer),
    cardCounts,
  })
}
