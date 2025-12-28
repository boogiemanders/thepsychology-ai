import fs from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const DEFAULT_LOCAL_DIR = path.join('public', 'topic-teacher-audio', 'v1')
const DEFAULT_PREFIX = path.posix.join('topic-teacher-audio', 'v1')
const DEFAULT_BUCKET = 'thepsychologyai'
const DEFAULT_CONCURRENCY = 8
const DEFAULT_PROGRESS_INTERVAL_MS = 3000

function parseArgs(argv) {
  const args = {
    localDir: DEFAULT_LOCAL_DIR,
    bucket: process.env.CLOUDFLARE_R2_BUCKET || DEFAULT_BUCKET,
    prefix: DEFAULT_PREFIX,
    concurrency: DEFAULT_CONCURRENCY,
    progressIntervalMs: DEFAULT_PROGRESS_INTERVAL_MS,
    dryRun: false,
    limit: Infinity,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--local-dir') args.localDir = argv[++i] ?? args.localDir
    else if (arg === '--bucket') args.bucket = argv[++i] ?? args.bucket
    else if (arg === '--prefix') args.prefix = argv[++i] ?? args.prefix
    else if (arg === '--concurrency') args.concurrency = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--progress-interval-ms') args.progressIntervalMs = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--limit') args.limit = Number.parseInt(argv[++i] ?? '', 10)
  }

  if (!Number.isFinite(args.concurrency) || args.concurrency <= 0) args.concurrency = DEFAULT_CONCURRENCY
  if (!Number.isFinite(args.progressIntervalMs) || args.progressIntervalMs <= 0) {
    args.progressIntervalMs = DEFAULT_PROGRESS_INTERVAL_MS
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = Infinity

  args.prefix = args.prefix.replace(/^\/+/, '').replace(/\/+$/, '')
  return args
}

function requiredEnv(key) {
  const value = (process.env[key] || '').trim()
  if (!value) {
    console.error(`Missing required env var: ${key}`)
    process.exit(1)
  }
  return value
}

function listFiles(dirAbs) {
  let entries
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true })
  } catch {
    return []
  }

  const files = []
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!entry.name.toLowerCase().endsWith('.mp3')) continue
    files.push(path.join(dirAbs, entry.name))
  }
  return files.sort()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const accountId = requiredEnv('CLOUDFLARE_R2_ACCOUNT_ID')
  const accessKeyId = requiredEnv('CLOUDFLARE_R2_ACCESS_KEY_ID')
  const secretAccessKey = requiredEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
  const endpoint =
    (process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`).trim()

  const localDirAbs = path.join(process.cwd(), args.localDir)
  const files = listFiles(localDirAbs).slice(0, args.limit)
  if (files.length === 0) {
    console.error(`No .mp3 files found in ${args.localDir}`)
    process.exit(1)
  }

  console.log(`Bucket: ${args.bucket}`)
  console.log(`Endpoint: ${endpoint}`)
  console.log(`Local dir: ${args.localDir}`)
  console.log(`Prefix: ${args.prefix}`)
  console.log(`Files: ${files.length}`)
  console.log(`Concurrency: ${args.concurrency}`)
  console.log(args.dryRun ? 'Mode: DRY RUN (no uploads)' : 'Mode: RUN (will upload)')

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  let nextIndex = 0
  let uploaded = 0
  let failed = 0
  let lastLog = Date.now()

  const maybeLog = () => {
    const now = Date.now()
    if (now - lastLog >= args.progressIntervalMs || uploaded + failed >= files.length) {
      console.log(`Progress: ${uploaded + failed}/${files.length} (uploaded ${uploaded}, failed ${failed})`)
      lastLog = now
    }
  }

  const worker = async () => {
    while (true) {
      const idx = nextIndex++
      if (idx >= files.length) break

      const filePath = files[idx]
      const baseName = path.basename(filePath)
      const key = `${args.prefix}/${baseName}`

      if (args.dryRun) {
        uploaded += 1
        if (uploaded <= 3) {
          console.log(`DRY: would upload ${path.relative(process.cwd(), filePath)} -> s3://${args.bucket}/${key}`)
        }
        maybeLog()
        continue
      }

      try {
        const command = new PutObjectCommand({
          Bucket: args.bucket,
          Key: key,
          Body: fs.createReadStream(filePath),
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        })
        await client.send(command)
        uploaded += 1
      } catch (err) {
        failed += 1
        console.warn(`⚠️  Failed upload: ${baseName}: ${err?.message ?? err}`)
      } finally {
        maybeLog()
      }
    }
  }

  await Promise.all(Array.from({ length: args.concurrency }, () => worker()))

  console.log('Done.')
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

