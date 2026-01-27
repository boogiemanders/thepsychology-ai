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

const lessonDir = process.argv[2] || '.mfa-work/biopsychology-(neuroscience-&-pharmacology)_1-cerebral-cortex'
const prefix = 'topic-teacher-audio/v2'

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
  const audioDir = path.join(lessonDir, 'audio')
  const files = fs.readdirSync(audioDir)

  let uploaded = 0
  for (const file of files) {
    const localPath = path.join(audioDir, file)
    if (file.endsWith('.mp3')) {
      await upload(localPath, `${prefix}/audio/${file}`, 'audio/mpeg')
      uploaded++
    } else if (file.endsWith('.words.json')) {
      await upload(localPath, `${prefix}/timings/${file}`, 'application/json')
      uploaded++
    }
  }

  // Upload manifest
  const lessonId = path.basename(lessonDir)
  const manifestPath = path.join(lessonDir, 'manifest.json')
  await upload(manifestPath, `${prefix}/manifests/${lessonId}.manifest.json`, 'application/json')
  uploaded++

  console.log(`Done! Uploaded ${uploaded} files.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
