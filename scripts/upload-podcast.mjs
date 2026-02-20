import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'node:fs'
import path from 'node:path'

function readEnv(key) {
  try {
    const text = fs.readFileSync('.env.local', 'utf8')
    const line = text.split(/\r?\n/).find(l => l.startsWith(key + '='))
    if (!line) return process.env[key] || ''
    let val = line.slice(key.length + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    return val
  } catch {
    return process.env[key] || ''
  }
}

const accountId = readEnv('CLOUDFLARE_R2_ACCOUNT_ID')
const accessKeyId = readEnv('CLOUDFLARE_R2_ACCESS_KEY_ID')
const secretAccessKey = readEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
const bucket = readEnv('CLOUDFLARE_R2_BUCKET') || 'thepsychologyai'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
})

const prefix = 'topic-teacher-audio/v2/podcasts'

// Parse args: <mp3-file> [mp4-file] --lesson-id <id>
const args = process.argv.slice(2)
const lessonIdFlagIdx = args.indexOf('--lesson-id')
if (lessonIdFlagIdx === -1 || !args[lessonIdFlagIdx + 1]) {
  console.error('Usage: node scripts/upload-podcast.mjs <mp3-file> [mp4-file] --lesson-id <id>')
  console.error('Example: node scripts/upload-podcast.mjs podcast-upload/cortex.mp3 podcast-upload/cortex.mp4 --lesson-id "biopsychology-(neuroscience-&-pharmacology)/1-cerebral-cortex"')
  process.exit(1)
}

const lessonId = args[lessonIdFlagIdx + 1]
const files = args.filter((_, i) => i !== lessonIdFlagIdx && i !== lessonIdFlagIdx + 1)

if (files.length === 0) {
  console.error('Error: At least one file (mp3) is required.')
  process.exit(1)
}

// Normalize lessonId: replace / with _
const normalizedId = lessonId.replace(/\//g, '_')

async function upload(localPath, key, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fs.readFileSync(localPath),
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })
  await client.send(cmd)
  console.log('Uploaded:', key)
}

async function main() {
  let uploaded = 0
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`File not found: ${file}`)
      process.exit(1)
    }
    const ext = path.extname(file).toLowerCase()
    if (ext === '.mp3') {
      await upload(file, `${prefix}/${normalizedId}.mp3`, 'audio/mpeg')
      uploaded++
    } else if (ext === '.m4a') {
      await upload(file, `${prefix}/${normalizedId}.m4a`, 'audio/mp4')
      uploaded++
    } else if (ext === '.mp4') {
      await upload(file, `${prefix}/${normalizedId}.mp4`, 'video/mp4')
      uploaded++
    } else {
      console.warn(`Skipping unsupported file: ${file}`)
    }
  }
  console.log(`Done! Uploaded ${uploaded} file(s) for lesson: ${lessonId}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
