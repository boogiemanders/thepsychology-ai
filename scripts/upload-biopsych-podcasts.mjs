// Bulk-upload biopsychology podcast videos from a Google Drive folder to R2,
// fuzzy-matching each Drive file to the right lesson.
//
// Reuses the existing Google OAuth token (Drive scope) from the Sheets MCP and
// the R2 credentials from .env.local. Backs up any existing object to <key>.bak
// before overwriting (idempotent).
//
// Usage:
//   node scripts/upload-biopsych-podcasts.mjs --folder <driveFolderUrlOrId>            # dry-run: show mapping
//   node scripts/upload-biopsych-podcasts.mjs --folder <driveFolderUrlOrId> --commit   # download + upload
//
// Flags:
//   --folder <id|url>   Google Drive folder containing the video files (required)
//   --commit            Actually download + upload. Without it, prints the planned mapping only.
//   --min-score <n>     Min match score (shared significant tokens) to auto-map. Default 1.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { google } from 'googleapis'
import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'

const CONTENT_DIR = 'EPPP/content/topic-content-v4/1 Biopsychology (Neuroscience & Pharmacology)'
const LESSON_PREFIX = 'biopsychology-(neuroscience-&-pharmacology)'
const R2_PREFIX = 'topic-teacher-audio/v2'
const UPLOAD_DIR = 'podcast-upload'
const GOOGLE_CREDS = path.join(os.homedir(), '.claude', 'google-credentials.json')
const GOOGLE_TOKEN = path.join(os.homedir(), '.claude', 'google-token.json')
const STOPWORDS = new Set(['your', 'the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'for', 'with', 'lesson', 'podcast', 'final', 'v1', 'v2', 'mp4', 'm4a'])

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null }
function has(name) { return process.argv.includes(name) }

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

// "1-memory-and-sleep" / "Your_Cerebral_Cortex.mp4" -> ["memory","sleep"] / ["cerebral","cortex"]
function tokens(s) {
  return s
    .replace(/\.[a-z0-9]+$/i, '')      // drop extension
    .replace(/^\d+[-_\s]*/, '')        // drop leading lesson number
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t))
}

function score(fileTokens, lessonTokens) {
  const set = new Set(lessonTokens)
  return fileTokens.filter((t) => set.has(t)).length
}

function listLessons() {
  const dir = path.join(process.cwd(), CONTENT_DIR)
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const base = f.replace(/\.md$/, '')
      return { base, lessonId: `${LESSON_PREFIX}/${base}`, tokens: tokens(base) }
    })
}

function folderId(input) {
  if (!input) return null
  const m = input.match(/folders\/([a-zA-Z0-9_-]+)/) || input.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m ? m[1] : input.trim()
}

function driveClient() {
  const creds = JSON.parse(fs.readFileSync(GOOGLE_CREDS, 'utf8')).installed
  const token = JSON.parse(fs.readFileSync(GOOGLE_TOKEN, 'utf8'))
  const oauth = new google.auth.OAuth2(creds.client_id, creds.client_secret, creds.redirect_uris?.[0])
  oauth.setCredentials({ refresh_token: token.refresh_token, access_token: token.token, expiry_date: token.expiry ? Date.parse(token.expiry) : undefined })
  return google.drive({ version: 'v3', auth: oauth })
}

function r2Client() {
  const accountId = req('CLOUDFLARE_R2_ACCOUNT_ID')
  const endpoint = envVal('CLOUDFLARE_R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`
  const client = new S3Client({
    region: 'auto', endpoint, forcePathStyle: true,
    credentials: { accessKeyId: req('CLOUDFLARE_R2_ACCESS_KEY_ID'), secretAccessKey: req('CLOUDFLARE_R2_SECRET_ACCESS_KEY') },
  })
  return { client, bucket: envVal('CLOUDFLARE_R2_BUCKET') || 'thepsychologyai' }
}

async function listDriveVideos(drive, fId) {
  const files = []
  let pageToken
  do {
    const res = await drive.files.list({
      q: `'${fId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size)',
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    files.push(...(res.data.files || []))
    pageToken = res.data.nextPageToken
  } while (pageToken)
  // Only real media: Drive folders also hold the lesson .md docs, which we must ignore.
  return files.filter((f) => (f.mimeType || '').startsWith('video/') || (f.mimeType || '').startsWith('audio/'))
}

async function downloadDriveFile(drive, fileId, destPath) {
  const res = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' })
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(destPath)
    res.data.on('error', reject).pipe(out).on('finish', resolve).on('error', reject)
  })
}

async function uploadToR2({ client, bucket }, lessonId, fileAbs) {
  const normalizedId = lessonId.replace(/\//g, '_')
  const ext = path.extname(fileAbs).toLowerCase() === '.m4a' ? 'm4a' : 'mp4'
  const key = `${R2_PREFIX}/podcasts/${normalizedId}.${ext}`
  const bakKey = `${key}.bak`
  const exists = async (k) => { try { await client.send(new HeadObjectCommand({ Bucket: bucket, Key: k })); return true } catch { return false } }
  if (await exists(key)) {
    if (await exists(bakKey)) console.log(`    backup exists, skip: ${bakKey}`)
    else {
      await client.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`, Key: bakKey }))
      console.log(`    backed up -> ${bakKey}`)
    }
  }
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: fs.createReadStream(fileAbs),
    ContentType: ext === 'm4a' ? 'audio/mp4' : 'video/mp4',
    CacheControl: 'public, max-age=300, must-revalidate',
  }))
  return key
}

async function main() {
  const fId = folderId(arg('--folder'))
  if (!fId) { console.error('Required: --folder <driveFolderUrlOrId>'); process.exit(1) }
  const commit = has('--commit')
  const minScore = Number(arg('--min-score') || 1)

  // Explicit overrides for creative titles fuzzy matching can't resolve.
  // Format: --map "Drive_File.mp4=1-lesson-base;Other.mp4=1-other-base"
  const overrides = new Map()
  const mapArg = arg('--map')
  if (mapArg) {
    for (const pair of mapArg.split(';')) {
      const [name, base] = pair.split('=').map((s) => s && s.trim())
      if (name && base) overrides.set(name, base)
    }
  }

  const lessons = listLessons()
  const byBase = new Map(lessons.map((l) => [l.base, l]))
  const drive = driveClient()
  const driveFiles = await listDriveVideos(drive, fId)
  if (!driveFiles.length) { console.error('No video files found in that Drive folder.'); process.exit(1) }

  // Match each Drive file to its best lesson.
  const taken = new Set()
  const plan = []
  for (const file of driveFiles) {
    if (overrides.has(file.name)) {
      const l = byBase.get(overrides.get(file.name))
      if (!l) { console.error(`--map points ${file.name} at unknown lesson "${overrides.get(file.name)}"`); process.exit(1) }
      plan.push({ file, best: l, scoreVal: 99, ambiguous: false, forced: true })
      continue
    }
    const ft = tokens(file.name)
    const ranked = lessons
      .map((l) => ({ l, s: score(ft, l.tokens) }))
      .sort((a, b) => b.s - a.s)
    const best = ranked[0]
    const ambiguous = ranked[1] && ranked[1].s === best.s && best.s > 0
    plan.push({ file, best: best.s >= minScore ? best.l : null, scoreVal: best.s, ambiguous })
  }

  console.log(`\nFolder: ${fId}`)
  console.log(`Drive videos: ${driveFiles.length} | Lessons: ${lessons.length}\n`)
  console.log('PLANNED MAPPING:')
  for (const p of plan) {
    const sizeMb = p.file.size ? (Number(p.file.size) / 1e6).toFixed(1) + 'MB' : '?'
    if (!p.best) { console.log(`  [NO MATCH] ${p.file.name} (${sizeMb})`); continue }
    if (taken.has(p.best.lessonId)) { console.log(`  [DUP -> SKIP] ${p.file.name} would map to ${p.best.base} (already taken)`); p.best = null; continue }
    taken.add(p.best.lessonId)
    const flag = p.forced ? ' [forced via --map]' : p.ambiguous ? ' [AMBIGUOUS - verify]' : ''
    console.log(`  ${p.file.name} (${sizeMb})  ->  ${p.best.base}  (score ${p.scoreVal})${flag}`)
  }
  const unmatchedLessons = lessons.filter((l) => !taken.has(l.lessonId))
  if (unmatchedLessons.length) {
    console.log('\nLESSONS WITH NO VIDEO:')
    unmatchedLessons.forEach((l) => console.log(`  - ${l.base}`))
  }

  if (!commit) {
    console.log('\nDry-run. Re-run with --commit to download + upload the matched files.')
    return
  }

  fs.mkdirSync(path.join(process.cwd(), UPLOAD_DIR), { recursive: true })
  const r2 = r2Client()
  console.log('\nUPLOADING:')
  for (const p of plan) {
    if (!p.best) continue
    const dest = path.join(process.cwd(), UPLOAD_DIR, p.file.name)
    console.log(`  ${p.file.name} -> ${p.best.base}`)
    console.log('    downloading from Drive...')
    await downloadDriveFile(drive, p.file.id, dest)
    const key = await uploadToR2(r2, p.best.lessonId, dest)
    console.log(`    uploaded -> ${key}`)
  }
  console.log('\nDone.')
}
main().catch((e) => { console.error(e); process.exit(1) })
