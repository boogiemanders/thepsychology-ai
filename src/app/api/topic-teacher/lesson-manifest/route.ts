import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

export const runtime = 'nodejs'

/**
 * Manifest chunk from R2 storage.
 */
type ManifestChunk = {
  chunkId: string
  type: 'stable' | 'metaphor'
  // Section navigation info
  sectionIdx: number
  sectionTitle: string
  sectionStart: boolean
  // For stable chunks:
  text?: string
  audioKey?: string
  timingsKey?: string
  duration?: number
  // For metaphor chunks:
  defaultVariant?: string
  variants?: Record<
    string,
    {
      text: string
      audioKey: string
      timingsKey: string
      duration: number
    }
  >
}

/**
 * Section info in manifest.
 */
type ManifestSection = {
  idx: number
  title: string
  startChunkIdx: number
}

/**
 * Lesson manifest stored in R2.
 */
type LessonManifest = {
  lessonId: string
  version: number
  schemaVersion: number
  createdAt: string
  contentHash: string
  sections?: ManifestSection[] // Section list for navigation
  chunks: ManifestChunk[]
  totalDuration: number
}

/**
 * Resolved chunk returned to the client.
 */
type ResolvedChunk = {
  chunkId: string
  text: string
  audioUrl: string
  timingsUrl: string
  duration: number
  // Section navigation info
  sectionIdx: number
  sectionTitle: string
  sectionStart: boolean
}

/**
 * Section info returned to client.
 */
type ResponseSection = {
  idx: number
  title: string
  startChunkIdx: number
}

/**
 * API response format.
 */
type ManifestResponse = {
  lessonId: string
  hobby: string | null
  sections: ResponseSection[] // Section list for navigation UI
  chunks: ResolvedChunk[]
  totalDuration: number
  version: number
  schemaVersion: number
}

const R2_PREFIX = 'topic-teacher-audio/v2'

function getR2Client(): { client: S3Client; bucket: string } | null {
  const g = globalThis as unknown as {
    __lessonManifestR2Client?: { client: S3Client; bucket: string } | null
  }
  if (g.__lessonManifestR2Client !== undefined) return g.__lessonManifestR2Client

  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    g.__lessonManifestR2Client = null
    return null
  }

  const endpoint = (
    process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  ).trim()

  g.__lessonManifestR2Client = {
    bucket,
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  }
  return g.__lessonManifestR2Client
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

async function fetchManifestFromR2(lessonId: string): Promise<LessonManifest | null> {
  // Normalize lessonId for R2 key (replace / with _)
  const normalizedId = lessonId.replace(/\//g, '_')
  const key = `${R2_PREFIX}/manifests/${normalizedId}.manifest.json`

  const buffer = await readObjectFromR2(key)
  if (!buffer) return null

  try {
    const manifest = JSON.parse(buffer.toString('utf8')) as LessonManifest
    // Validate basic structure
    if (!manifest.lessonId || !Array.isArray(manifest.chunks)) {
      return null
    }
    return manifest
  } catch {
    return null
  }
}

function getR2BaseUrl(): string {
  // Use the public R2 URL or custom domain
  const customDomain = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').trim()
  if (customDomain) {
    return customDomain.replace(/\/+$/, '')
  }

  // Fall back to R2 public bucket URL pattern
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()
  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  if (bucket && accountId) {
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com`
  }

  // Last resort: use relative path
  return '/api/topic-teacher/r2'
}

function resolveChunks(manifest: LessonManifest, hobby: string | null): ResolvedChunk[] {
  const r2BaseUrl = getR2BaseUrl()

  return manifest.chunks.map((chunk) => {
    // Base section info (with fallbacks for older manifests without section data)
    const sectionInfo = {
      sectionIdx: chunk.sectionIdx ?? 0,
      sectionTitle: chunk.sectionTitle ?? 'Introduction',
      sectionStart: chunk.sectionStart ?? false,
    }

    if (chunk.type === 'stable') {
      // Stable chunk - use the single audio/timing
      return {
        chunkId: chunk.chunkId,
        text: chunk.text ?? '',
        audioUrl: `${r2BaseUrl}/${R2_PREFIX}/audio/${chunk.audioKey}.mp3`,
        timingsUrl: `${r2BaseUrl}/${R2_PREFIX}/timings/${chunk.timingsKey}.words.json`,
        duration: chunk.duration ?? 0,
        ...sectionInfo,
      }
    }

    // Metaphor chunk - select variant based on hobby
    const variants = chunk.variants ?? {}
    const defaultVariant = chunk.defaultVariant ?? 'default'

    // Try to find a hobby-specific variant, fall back to default
    const selected = (hobby && variants[hobby]) ? variants[hobby] : variants[defaultVariant]

    if (!selected) {
      // No variant found - this shouldn't happen but handle gracefully
      console.warn(`[lesson-manifest] No variant found for chunk ${chunk.chunkId}`)
      return {
        chunkId: chunk.chunkId,
        text: '',
        audioUrl: '',
        timingsUrl: '',
        duration: 0,
        ...sectionInfo,
      }
    }

    return {
      chunkId: chunk.chunkId,
      text: selected.text,
      audioUrl: `${r2BaseUrl}/${R2_PREFIX}/audio/${selected.audioKey}.mp3`,
      timingsUrl: `${r2BaseUrl}/${R2_PREFIX}/timings/${selected.timingsKey}.words.json`,
      duration: selected.duration,
      ...sectionInfo,
    }
  })
}

/**
 * GET /api/topic-teacher/lesson-manifest
 *
 * Query parameters:
 *   - lessonId: The lesson identifier (e.g., "3-social/persuasion")
 *   - hobby: Optional hobby for metaphor personalization
 *
 * Returns:
 *   - 200: Manifest with resolved chunk URLs
 *   - 400: Missing lessonId
 *   - 404: Manifest not found
 *   - 500: R2 not configured
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId')
  const hobby = searchParams.get('hobby') || null

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
  }

  // Check R2 is configured
  const r2 = getR2Client()
  if (!r2) {
    return NextResponse.json(
      { error: 'Lesson manifests are not configured (missing R2 credentials)' },
      { status: 500 }
    )
  }

  // Fetch manifest from R2
  const manifest = await fetchManifestFromR2(lessonId)
  if (!manifest) {
    return NextResponse.json(
      { error: `Manifest not found for lesson: ${lessonId}` },
      { status: 404 }
    )
  }

  // Resolve chunks based on hobby
  const resolvedChunks = resolveChunks(manifest, hobby)

  // Calculate total duration from resolved chunks
  const totalDuration = resolvedChunks.reduce((sum, chunk) => sum + chunk.duration, 0)

  // Build sections from manifest or derive from resolved chunks
  let sections: ResponseSection[] = []
  if (manifest.sections && manifest.sections.length > 0) {
    sections = manifest.sections.map(s => ({
      idx: s.idx,
      title: s.title,
      startChunkIdx: s.startChunkIdx,
    }))
  } else {
    // Derive sections from resolved chunks for backward compatibility
    const sectionsMap = new Map<number, ResponseSection>()
    resolvedChunks.forEach((chunk, idx) => {
      if (!sectionsMap.has(chunk.sectionIdx)) {
        sectionsMap.set(chunk.sectionIdx, {
          idx: chunk.sectionIdx,
          title: chunk.sectionTitle,
          startChunkIdx: idx,
        })
      }
    })
    sections = Array.from(sectionsMap.values()).sort((a, b) => a.idx - b.idx)
  }

  const response: ManifestResponse = {
    lessonId: manifest.lessonId,
    hobby,
    sections,
    chunks: resolvedChunks,
    totalDuration,
    version: manifest.version,
    schemaVersion: manifest.schemaVersion,
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
