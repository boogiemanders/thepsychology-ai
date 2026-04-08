import { NextRequest, NextResponse } from 'next/server'
import { FONTS } from '@/app/lab/calligraphy/components/fonts'

const R2_BASE = (
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ||
  ''
).trim()

const FONT_PREFIX = 'calligraphy-fonts'
const VALID_FONT_FILES = new Set(FONTS.map(font => font.file))

function getContentType(file: string) {
  const lower = file.toLowerCase()

  if (lower.endsWith('.otf')) {
    return 'font/otf'
  }

  if (lower.endsWith('.woff2')) {
    return 'font/woff2'
  }

  if (lower.endsWith('.woff')) {
    return 'font/woff'
  }

  return 'font/ttf'
}

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file')?.trim() || ''

  if (!file || !VALID_FONT_FILES.has(file)) {
    return NextResponse.json({ error: 'Unknown font file.' }, { status: 404 })
  }

  if (!R2_BASE) {
    return NextResponse.json({ error: 'Font storage is not configured.' }, { status: 500 })
  }

  const upstreamUrl = `${R2_BASE}/${FONT_PREFIX}/${encodeURIComponent(file)}`
  const upstream = await fetch(upstreamUrl, {
    headers: {
      Accept: 'font/*,*/*;q=0.8',
    },
    cache: 'force-cache',
  }).catch(() => null)

  if (!upstream || !upstream.ok) {
    return NextResponse.json({ error: 'Failed to fetch font.' }, { status: 502 })
  }

  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || getContentType(file),
      'Cache-Control': upstream.headers.get('cache-control') || 'public, max-age=31536000, immutable',
    },
  })
}
