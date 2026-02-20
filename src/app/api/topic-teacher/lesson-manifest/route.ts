import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'
import { readFileSync, readdirSync, existsSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Maps domain IDs to actual folder names in topic-content-v4
const DOMAIN_FOLDER_MAP: Record<string, string> = {
  '1': '1 Biopsychology (Neuroscience & Pharmacology)',
  '2': '2 Learning and Memory',
  '3-social': '3 Social Psychology',
  '3-cultural': '3 Cultural Considerations',
  '4': '4 Development',
  '5-assessment': '5 Assessment',
  '5-diagnosis': '5 Diagnosis',
  '5-test': '5 Test Construction',
  '6': '6 Clinical Interventions',
  '7': '7 Research and Stats',
  '8': '8 Ethics',
  '3-5-6': '2 3 5 6 I-O Psychology',
}

// Reverse map: folder name (without leading number) -> actual folder
const DOMAIN_NAME_TO_FOLDER: Record<string, string> = {
  'biopsychology (neuroscience & pharmacology)': '1 Biopsychology (Neuroscience & Pharmacology)',
  'learning and memory': '2 Learning and Memory',
  'social psychology': '3 Social Psychology',
  'cultural considerations': '3 Cultural Considerations',
  'development': '4 Development',
  'assessment': '5 Assessment',
  'diagnosis': '5 Diagnosis',
  'test construction': '5 Test Construction',
  'clinical interventions': '6 Clinical Interventions',
  'research and stats': '7 Research and Stats',
  'ethics': '8 Ethics',
  'i-o psychology': '2 3 5 6 I-O Psychology',
}

/**
 * Get the actual folder name from a domain parameter.
 * Handles multiple formats:
 * - Domain ID: "1" -> "1 Biopsychology..."
 * - Domain name: "Biopsychology (Neuroscience & Pharmacology)" -> "1 Biopsychology..."
 */
function getDomainFolder(domain: string): string | null {
  // Try direct ID mapping first
  if (DOMAIN_FOLDER_MAP[domain]) {
    return DOMAIN_FOLDER_MAP[domain]
  }

  // Try name-based mapping (case insensitive)
  const normalized = domain.toLowerCase().trim()
  if (DOMAIN_NAME_TO_FOLDER[normalized]) {
    return DOMAIN_NAME_TO_FOLDER[normalized]
  }

  // Try to find a folder that contains this domain name
  const rootDir = path.join(process.cwd(), 'topic-content-v4')
  try {
    const folders = readdirSync(rootDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    // Check if domain matches a folder (with or without leading number)
    for (const folder of folders) {
      const folderWithoutPrefix = folder.replace(/^\d+\s+/, '').toLowerCase()
      if (folderWithoutPrefix === normalized || folder.toLowerCase() === normalized) {
        return folder
      }
    }
  } catch {
    // Ignore errors
  }

  return null
}

/**
 * Normalize a topic name to a slug for matching against filenames.
 * This mirrors the logic from topic-content-manager.ts
 */
function slugifyTopicName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(?:\d+[\s-]+)+/, '') // remove leading numeric prefixes
    .replace(/[&]/g, 'and')
    .replace(/\band\b/g, '') // align with topic-content-manager matching behavior
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseFrontmatter(content: string): Record<string, string> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/
  const match = content.match(frontmatterRegex)
  if (!match) return {}

  const metadata: Record<string, string> = {}
  const frontmatterText = match[1]

  for (const line of frontmatterText.split('\n')) {
    const [key, ...valueParts] = line.split(': ')
    const value = valueParts.join(': ').trim()
    if (!key || !value) continue
    metadata[key.trim()] = value.replace(/^["']|["']$/g, '')
  }

  return metadata
}

/**
 * Convert a folder or filename part to the lessonId format used by the pregen script.
 * This mirrors the logic from scripts/pregen-topic-audio.ts getLessonIdFromPath()
 */
function normalizeForLessonId(part: string): string {
  return part.replace(/^\d+\s+/, '').toLowerCase().replace(/\s+/g, '-')
}

/**
 * Find a markdown filename in a domain folder that matches the provided topic slug.
 */
function findMatchingFilenameInDomainFolder(baseDir: string, topicSlug: string): string | null {
  try {
    const entries = readdirSync(baseDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const baseName = entry.name.slice(0, -3) // drop ".md"
      const candidateSlug = slugifyTopicName(baseName)
      if (candidateSlug === topicSlug) {
        return baseName
      }

      // Match by frontmatter metadata so topic strings from prioritize/topic-teacher
      // resolve even when v4 filenames are internal shorthand.
      try {
        const fullPath = path.join(baseDir, entry.name)
        const content = readFileSync(fullPath, 'utf-8')
        const metadata = parseFrontmatter(content)

        const metadataSlug = metadata.slug ? slugifyTopicName(metadata.slug) : ''
        if (metadataSlug === topicSlug) {
          return baseName
        }

        const metadataTopicName = metadata.topic_name ? slugifyTopicName(metadata.topic_name) : ''
        if (metadataTopicName === topicSlug) {
          return baseName
        }

        const metadataTitle = metadata.title ? slugifyTopicName(metadata.title) : ''
        if (metadataTitle === topicSlug) {
          return baseName
        }
      } catch {
        // Ignore malformed files and continue scanning.
      }
    }
  } catch (e) {
    console.log(`[manifest] Error reading domain folder: ${e}`)
  }

  return null
}

/**
 * Resolve the lessonId from domain and topic parameters.
 * This computes the same lessonId that the pregen script would generate.
 */
function resolveLessonIdFromDomainTopic(domain: string, topic: string): string | null {
  const domainFolder = getDomainFolder(domain)
  if (!domainFolder) {
    console.log(`[manifest] Unknown domain: ${domain}`)
    return null
  }

  const rootDir = path.join(process.cwd(), 'topic-content-v4')
  const baseDir = path.join(rootDir, domainFolder)

  if (!existsSync(baseDir)) {
    console.log(`[manifest] Domain folder not found: ${baseDir}`)
    return null
  }

  // Find the actual filename by matching slugified topic name
  const topicSlug = slugifyTopicName(topic)
  const actualFilename = findMatchingFilenameInDomainFolder(baseDir, topicSlug)

  if (!actualFilename) {
    console.log(`[manifest] No file found for topic "${topic}" (slug: ${topicSlug}) in ${domainFolder}`)
    return null
  }

  // Compute lessonId using the same normalization as the pregen script
  const normalizedFolder = normalizeForLessonId(domainFolder)
  const normalizedFile = normalizeForLessonId(actualFilename)

  return `${normalizedFolder}/${normalizedFile}`
}

/**
 * Resolve lessonId from topic only by scanning all known domain folders.
 * This supports links that omit `domain`.
 */
function resolveLessonIdFromTopic(topic: string): string | null {
  const rootDir = path.join(process.cwd(), 'topic-content-v4')
  const topicSlug = slugifyTopicName(topic)
  const matches: string[] = []
  const seenFolders = new Set<string>()

  for (const domainFolder of Object.values(DOMAIN_FOLDER_MAP)) {
    if (!domainFolder || seenFolders.has(domainFolder)) continue
    seenFolders.add(domainFolder)

    const baseDir = path.join(rootDir, domainFolder)
    if (!existsSync(baseDir)) continue

    const actualFilename = findMatchingFilenameInDomainFolder(baseDir, topicSlug)
    if (!actualFilename) continue

    matches.push(`${normalizeForLessonId(domainFolder)}/${normalizeForLessonId(actualFilename)}`)
  }

  if (matches.length === 0) {
    console.log(`[manifest] No file found for topic "${topic}" (slug: ${topicSlug}) across all domains`)
    return null
  }

  if (matches.length > 1) {
    console.log(`[manifest] Multiple lesson matches for topic "${topic}" (slug: ${topicSlug}), choosing first:`, matches)
  }

  return matches[0]
}

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
  audioUrl: string | null // null if needs live generation
  timingsUrl: string | null // null if needs live generation
  duration: number | null // null if needs live generation
  needsLiveGeneration: boolean // true for metaphors without hobby variant
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
  podcast?: { audio: string | null; video: string | null }
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
      // Stable chunk - use the single audio/timing (always from R2)
      return {
        chunkId: chunk.chunkId,
        text: chunk.text ?? '',
        audioUrl: `${r2BaseUrl}/${R2_PREFIX}/audio/${chunk.audioKey}.mp3`,
        timingsUrl: `${r2BaseUrl}/${R2_PREFIX}/timings/${chunk.timingsKey}.words.json`,
        duration: chunk.duration ?? 0,
        needsLiveGeneration: false,
        ...sectionInfo,
      }
    }

    // Metaphor chunk - select variant based on hobby
    const variants = chunk.variants ?? {}
    const defaultVariant = chunk.defaultVariant ?? 'default'

    // Check if hobby-specific variant exists in R2
    if (hobby && variants[hobby]) {
      // Has hobby-specific variant - use R2 audio
      const selected = variants[hobby]
      return {
        chunkId: chunk.chunkId,
        text: selected.text,
        audioUrl: `${r2BaseUrl}/${R2_PREFIX}/audio/${selected.audioKey}.mp3`,
        timingsUrl: `${r2BaseUrl}/${R2_PREFIX}/timings/${selected.timingsKey}.words.json`,
        duration: selected.duration,
        needsLiveGeneration: false,
        ...sectionInfo,
      }
    }

    // Has hobby but no hobby-specific variant - needs live generation
    if (hobby) {
      // Return default text as placeholder; client will generate personalized audio
      const defaultText = variants[defaultVariant]?.text ?? ''
      return {
        chunkId: chunk.chunkId,
        text: defaultText,
        audioUrl: null, // Signal: needs live generation
        timingsUrl: null,
        duration: null,
        needsLiveGeneration: true,
        ...sectionInfo,
      }
    }

    // No hobby - use default variant from R2
    const selected = variants[defaultVariant]
    if (!selected) {
      // No variant found - this shouldn't happen but handle gracefully
      console.warn(`[lesson-manifest] No variant found for chunk ${chunk.chunkId}`)
      return {
        chunkId: chunk.chunkId,
        text: '',
        audioUrl: null,
        timingsUrl: null,
        duration: null,
        needsLiveGeneration: false,
        ...sectionInfo,
      }
    }

    return {
      chunkId: chunk.chunkId,
      text: selected.text,
      audioUrl: `${r2BaseUrl}/${R2_PREFIX}/audio/${selected.audioKey}.mp3`,
      timingsUrl: `${r2BaseUrl}/${R2_PREFIX}/timings/${selected.timingsKey}.words.json`,
      duration: selected.duration,
      needsLiveGeneration: false,
      ...sectionInfo,
    }
  })
}

async function checkPodcastExists(lessonId: string): Promise<{ audio: string | null; video: string | null } | null> {
  const r2 = getR2Client()
  if (!r2) return null

  const normalizedId = lessonId.replace(/\//g, '_')
  const mp3Key = `${R2_PREFIX}/podcasts/${normalizedId}.mp3`
  const m4aKey = `${R2_PREFIX}/podcasts/${normalizedId}.m4a`
  const mp4Key = `${R2_PREFIX}/podcasts/${normalizedId}.mp4`

  const check = async (key: string): Promise<boolean> => {
    try {
      await r2.client.send(new HeadObjectCommand({ Bucket: r2.bucket, Key: key }))
      return true
    } catch {
      return false
    }
  }

  const [mp3Exists, m4aExists, mp4Exists] = await Promise.all([check(mp3Key), check(m4aKey), check(mp4Key)])

  if (!mp3Exists && !m4aExists && !mp4Exists) return null

  const r2BaseUrl = getR2BaseUrl()
  // Prefer mp3 over m4a for audio
  const audioKey = mp3Exists ? mp3Key : m4aExists ? m4aKey : null
  return {
    audio: audioKey ? `${r2BaseUrl}/${audioKey}` : null,
    video: mp4Exists ? `${r2BaseUrl}/${mp4Key}` : null,
  }
}

/**
 * GET /api/topic-teacher/lesson-manifest
 *
 * Query parameters:
 *   - lessonId: The lesson identifier (e.g., "biopsychology-(neuroscience-&-pharmacology)/1-cerebral-cortex")
 *   - domain: Domain ID (e.g., "1", "3-social") - alternative to lessonId
 *   - topic: Topic name (e.g., "Cerebral Cortex") - alternative to lessonId
 *   - hobby: Optional hobby for metaphor personalization
 *
 * If domain and topic are provided, they will be used to resolve the lessonId.
 * If only topic is provided, the API will scan all domains and use the first match.
 *
 * Returns:
 *   - 200: Manifest with resolved chunk URLs
 *   - 400: Missing lessonId or domain/topic
 *   - 404: Manifest not found
 *   - 500: R2 not configured
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  let lessonId = searchParams.get('lessonId')
  const domain = searchParams.get('domain')
  const topic = searchParams.get('topic')
  const hobby = searchParams.get('hobby') || null

  // If domain and topic are provided, resolve the lessonId first.
  if (domain && topic) {
    const resolved = resolveLessonIdFromDomainTopic(domain, topic)
    if (resolved) {
      console.log(`[manifest] Resolved lessonId from domain="${domain}" topic="${topic}": ${resolved}`)
      lessonId = resolved
    } else {
      console.log(`[manifest] Could not resolve lessonId from domain="${domain}" topic="${topic}"`)
    }
  }

  // Fall back to topic-only resolution when lessonId is still missing.
  if (!lessonId && topic) {
    const resolved = resolveLessonIdFromTopic(topic)
    if (resolved) {
      console.log(`[manifest] Resolved lessonId from topic="${topic}": ${resolved}`)
      lessonId = resolved
    } else {
      console.log(`[manifest] Could not resolve lessonId from topic="${topic}"`)
    }
  }

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId, or topic, or domain + topic is required' }, { status: 400 })
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

  // Check for podcast availability (in parallel with manifest if we refactored, but manifest is already done)
  const podcast = await checkPodcastExists(lessonId)

  if (!manifest) {
    // No MFA manifest, but if podcast exists, return a minimal response
    if (podcast) {
      return NextResponse.json({
        lessonId,
        hobby,
        sections: [],
        chunks: [],
        totalDuration: 0,
        version: 0,
        schemaVersion: 0,
        podcast,
      } satisfies ManifestResponse, {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      })
    }
    return NextResponse.json(
      { error: `Manifest not found for lesson: ${lessonId}` },
      { status: 404 }
    )
  }

  // Resolve chunks based on hobby
  const resolvedChunks = resolveChunks(manifest, hobby)

  // Calculate total duration from resolved chunks (null durations for live chunks excluded)
  const totalDuration = resolvedChunks.reduce((sum, chunk) => sum + (chunk.duration ?? 0), 0)

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
    ...(podcast ? { podcast } : {}),
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
