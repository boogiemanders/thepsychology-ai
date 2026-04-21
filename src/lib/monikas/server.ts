// Server-only helpers for Monikas API routes.
// All writes go through the service role client. Player identity is a per-room
// `player_token` passed as a Bearer header — not a Supabase auth session.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'

export function getMonikasClient(): SupabaseClient | null {
  return getSupabaseClient(undefined, { requireServiceRole: true })
}

export function dbUnavailable() {
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Extract the Bearer token. Returns null if missing/malformed. */
export function extractPlayerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!h) return null
  const [scheme, token] = h.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

/**
 * Validate that the Bearer token belongs to a player in the given room.
 * Returns { player } on success, or a NextResponse error on failure.
 */
export async function requirePlayer(
  req: NextRequest,
  roomCode: string
): Promise<{ supabase: SupabaseClient; playerId: string; roomId: string } | NextResponse> {
  const supabase = getMonikasClient()
  if (!supabase) return dbUnavailable()

  const token = extractPlayerToken(req)
  if (!token) return bad('missing player token', 401)

  const { data: room } = await supabase
    .from('monikas_rooms')
    .select('id')
    .eq('room_code', roomCode.toUpperCase())
    .maybeSingle()

  if (!room) return bad('room not found', 404)

  const { data: player } = await supabase
    .from('monikas_players')
    .select('id,room_id')
    .eq('player_token', token)
    .eq('room_id', room.id)
    .maybeSingle()

  if (!player) return bad('player token does not match this room', 403)

  return { supabase, playerId: player.id, roomId: player.room_id }
}
