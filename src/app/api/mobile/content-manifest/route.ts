import { NextRequest, NextResponse } from 'next/server'
import { requireMobileAuth } from '@/lib/server/mobile-auth'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'

let cachedManifest: { json: string; etag: string } | null = null

async function loadManifest(): Promise<{ json: string; etag: string }> {
  if (cachedManifest) return cachedManifest

  const filePath = join(process.cwd(), 'public', 'mobile-content-manifest.json')
  const raw = await readFile(filePath, 'utf-8')
  const etag = `"${createHash('md5').update(raw).digest('hex')}"`
  cachedManifest = { json: raw, etag }
  return cachedManifest
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request)
    if ('error' in auth) return auth.error

    const manifest = await loadManifest()

    // Support conditional caching with If-None-Match
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === manifest.etag) {
      return new NextResponse(null, { status: 304 })
    }

    return new NextResponse(manifest.json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ETag: manifest.etag,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('[mobile/content-manifest] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
