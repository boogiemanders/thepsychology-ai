// Replace a lesson's podcast video on R2 with a local file.
// Backs up the existing object to <key>.bak before overwriting (idempotent: skips backup if .bak already exists).
//
// Usage:
//   node scripts/replace-podcast-video.mjs --lesson-id "biopsychology-(neuroscience-&-pharmacology)/1-cerebral-cortex" --file <path.mp4>
import fs from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'

const R2_PREFIX = 'topic-teacher-audio/v2'

function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}
function envVal(key) {
  if (process.env[key]) return process.env[key].trim()
  try {
    const text = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    const line = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let v = line.slice(key.length + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    return v.trim() || null
  } catch { return null }
}
function req(key) { const v = envVal(key); if (!v) { console.error(`Missing env: ${key}`); process.exit(1) } return v }

async function main() {
  const lessonId = arg('--lesson-id')
  const file = arg('--file')
  if (!lessonId || !file) { console.error('Usage: --lesson-id <id> --file <path.mp4>'); process.exit(1) }
  const fileAbs = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
  if (!fs.existsSync(fileAbs)) { console.error(`File not found: ${fileAbs}`); process.exit(1) }

  const bucket = envVal('CLOUDFLARE_R2_BUCKET') || 'thepsychologyai'
  const accountId = req('CLOUDFLARE_R2_ACCOUNT_ID')
  const endpoint = envVal('CLOUDFLARE_R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`
  const client = new S3Client({
    region: 'auto', endpoint, forcePathStyle: true,
    credentials: { accessKeyId: req('CLOUDFLARE_R2_ACCESS_KEY_ID'), secretAccessKey: req('CLOUDFLARE_R2_SECRET_ACCESS_KEY') },
  })

  const normalizedId = lessonId.replace(/\//g, '_')
  const key = `${R2_PREFIX}/podcasts/${normalizedId}.mp4`
  const bakKey = `${key}.bak`

  const exists = async (k) => { try { await client.send(new HeadObjectCommand({ Bucket: bucket, Key: k })); return true } catch { return false } }

  // Back up existing original once.
  if (await exists(key)) {
    if (await exists(bakKey)) {
      console.log(`Backup already exists, skipping: ${bakKey}`)
    } else {
      await client.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`, Key: bakKey }))
      console.log(`Backed up existing -> ${bakKey}`)
    }
  } else {
    console.log('No existing podcast video to back up (new slot).')
  }

  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: fs.createReadStream(fileAbs),
    // NOT immutable: these get replaced, so browsers must revalidate or stale copies stick.
    ContentType: 'video/mp4', CacheControl: 'public, max-age=300, must-revalidate',
  }))
  const publicBase = (envVal('CLOUDFLARE_R2_PUBLIC_URL') || '').replace(/\/+$/, '')
  console.log('Replaced:', key)
  if (publicBase) console.log('Public URL:', `${publicBase}/${key}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
