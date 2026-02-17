import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

export const runtime = 'nodejs'

const R2_PREFIX = 'blog-audio/v1'

type BlogManifestChunk = {
  chunkId: string
  text: string
  audioKey: string
  timingsKey: string
  duration: number
  sectionIdx: number
  sectionTitle: string
}

type BlogManifest = {
  slug: string
  version: number
  schemaVersion: number
  createdAt: string
  contentHash: string
  chunks: BlogManifestChunk[]
  totalDuration: number
}

type ResolvedChunk = {
  chunkId: string
  text: string
  audioUrl: string
  timingsUrl: string
  duration: number
  sectionIdx: number
  sectionTitle: string
}

type ManifestResponse = {
  slug: string
  chunks: ResolvedChunk[]
  totalDuration: number
}

function getR2Client(): { client: S3Client; bucket: string } | null {
  const g = globalThis as unknown as {
    __blogManifestR2Client?: { client: S3Client; bucket: string } | null
  }
  if (g.__blogManifestR2Client !== undefined) return g.__blogManifestR2Client

  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    g.__blogManifestR2Client = null
    return null
  }

  const endpoint = (
    process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  ).trim()

  g.__blogManifestR2Client = {
    bucket,
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  }
  return g.__blogManifestR2Client
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function readObjectFromR2(key: string): Promise<Buffer | null> {
  const r2 = getR2Client()
  if (!r2) return null

  try {
    const obj = await r2.client.send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }))
    const body = obj.Body
    if (!body) return null
    if (Buffer.isBuffer(body)) return body
    if (typeof body === 'string') return Buffer.from(body)
    if (body instanceof Uint8Array) return Buffer.from(body)
    if (typeof (body as unknown as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
      const arr = await (body as unknown as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray()
      return Buffer.from(arr)
    }
    return await streamToBuffer(body as Readable)
  } catch {
    return null
  }
}

function getR2BaseUrl(): string {
  const customDomain = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').trim()
  if (customDomain) {
    return customDomain.replace(/\/+$/, '')
  }

  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()
  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  if (bucket && accountId) {
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com`
  }

  return '/api/topic-teacher/r2'
}

/**
 * GET /api/blog/audio-manifest?slug=<slug>
 *
 * Fetches the pre-generated audio manifest for a blog post from R2.
 * Returns resolved chunk URLs for audio and timings.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const r2 = getR2Client()
  if (!r2) {
    return NextResponse.json(
      { error: 'Blog audio manifests are not configured (missing R2 credentials)' },
      { status: 500 }
    )
  }

  const key = `${R2_PREFIX}/manifests/${slug}.manifest.json`
  const buffer = await readObjectFromR2(key)
  if (!buffer) {
    return NextResponse.json(
      { error: `Manifest not found for blog post: ${slug}` },
      { status: 404 }
    )
  }

  let manifest: BlogManifest
  try {
    manifest = JSON.parse(buffer.toString('utf8')) as BlogManifest
    if (!manifest.slug || !Array.isArray(manifest.chunks)) {
      return NextResponse.json({ error: 'Invalid manifest format' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to parse manifest' }, { status: 500 })
  }

  const r2BaseUrl = getR2BaseUrl()

  const resolvedChunks: ResolvedChunk[] = manifest.chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    text: chunk.text,
    audioUrl: `${r2BaseUrl}/${R2_PREFIX}/audio/${chunk.audioKey}.mp3`,
    timingsUrl: `${r2BaseUrl}/${R2_PREFIX}/timings/${chunk.timingsKey}.words.json`,
    duration: chunk.duration,
    sectionIdx: chunk.sectionIdx,
    sectionTitle: chunk.sectionTitle,
  }))

  const totalDuration = resolvedChunks.reduce((sum, c) => sum + c.duration, 0)

  const response: ManifestResponse = {
    slug: manifest.slug,
    chunks: resolvedChunks,
    totalDuration,
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
