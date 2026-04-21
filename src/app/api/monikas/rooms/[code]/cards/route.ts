// POST /api/monikas/rooms/[code]/cards — submit cards for the authenticated player.
// Body: { cards: [{ text: string, secretNote?: string }] }
// Replaces all existing cards from this player in this room (idempotent re-submit).

import { NextRequest, NextResponse } from 'next/server'
import { requirePlayer, bad } from '@/lib/monikas/server'

const MAX_CARDS_PER_PLAYER = 5
const MAX_TEXT = 280
const MAX_NOTE = 200

interface Body {
  cards?: Array<{ text?: string; secretNote?: string }>
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const auth = await requirePlayer(req, code)
  if (auth instanceof NextResponse) return auth
  const { supabase, playerId, roomId } = auth

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return bad('invalid json')
  }

  const raw = Array.isArray(body.cards) ? body.cards : []
  if (raw.length === 0) return bad('no cards')
  if (raw.length > MAX_CARDS_PER_PLAYER) return bad(`max ${MAX_CARDS_PER_PLAYER} cards`)

  const cleaned = raw
    .map(c => ({
      text: typeof c.text === 'string' ? c.text.trim() : '',
      secretNote: typeof c.secretNote === 'string' ? c.secretNote.trim() : '',
    }))
    .filter(c => c.text.length > 0)

  if (cleaned.length === 0) return bad('cards empty after trim')
  for (const c of cleaned) {
    if (c.text.length > MAX_TEXT) return bad('card text too long')
    if (c.secretNote.length > MAX_NOTE) return bad('secret note too long')
  }

  // Replace this player's cards atomically-ish.
  await supabase
    .from('monikas_cards')
    .delete()
    .eq('room_id', roomId)
    .eq('submitted_by_player_id', playerId)

  const rows = cleaned.map(c => ({
    room_id: roomId,
    submitted_by_player_id: playerId,
    original_text: c.text,
    normalized_text: c.text.toLowerCase(),
    secret_note: c.secretNote || null,
    source_type: 'user',
  }))

  const { error } = await supabase.from('monikas_cards').insert(rows)
  if (error) {
    console.error('[monikas/cards POST] insert failed', error)
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  return NextResponse.json({ count: rows.length })
}
