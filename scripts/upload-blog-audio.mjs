/**
 * Upload pre-generated blog audio to Cloudflare R2.
 *
 * Usage:
 *   node scripts/upload-blog-audio.mjs                          # Upload all blog posts
 *   node scripts/upload-blog-audio.mjs --slug how-to-pass-the-eppp-first-try  # Upload one post
 */

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

const prefix = 'blog-audio/v1'

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

async function uploadBlogPost(postDir, slug) {
  const audioDir = path.join(postDir, 'audio')
  if (!fs.existsSync(audioDir)) {
    console.warn(`No audio dir found: ${audioDir}`)
    return 0
  }

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
  const manifestPath = path.join(postDir, 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    await upload(manifestPath, `${prefix}/manifests/${slug}.manifest.json`, 'application/json')
    uploaded++
  }

  return uploaded
}

async function main() {
  const args = process.argv.slice(2)
  let slugFilter = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) {
      slugFilter = args[++i]
    } else if (args[i]?.startsWith('--slug=')) {
      slugFilter = args[i].slice('--slug='.length)
    }
  }

  const blogWorkDir = path.join(process.cwd(), '.mfa-work', 'blog')
  if (!fs.existsSync(blogWorkDir)) {
    console.error(`Blog work directory not found: ${blogWorkDir}`)
    console.error('Run pregen-blog-audio.ts first.')
    process.exit(1)
  }

  const slugDirs = fs.readdirSync(blogWorkDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(slug => !slugFilter || slug === slugFilter)

  console.log(`Uploading ${slugDirs.length} blog post(s) to R2...`)

  let totalUploaded = 0
  for (const slug of slugDirs) {
    console.log(`\n--- ${slug} ---`)
    const postDir = path.join(blogWorkDir, slug)
    const uploaded = await uploadBlogPost(postDir, slug)
    totalUploaded += uploaded
  }

  console.log(`\nDone! Uploaded ${totalUploaded} files.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
