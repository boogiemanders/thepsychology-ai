/**
 * Upload calligraphy font files to Cloudflare R2.
 *
 * Usage:
 *   node scripts/upload-calligraphy-fonts-to-r2.mjs
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

const prefix = 'calligraphy-fonts'
const fontsDir = path.resolve('../chinesecalligraphy/public/fonts')

const mimeTypes = {
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function main() {
  if (!fs.existsSync(fontsDir)) {
    console.error(`Font directory not found: ${fontsDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(fontsDir).filter(f => {
    const ext = path.extname(f).toLowerCase()
    return ['.ttf', '.otf', '.woff', '.woff2'].includes(ext)
  })

  console.log(`Found ${files.length} font files to upload`)

  for (const file of files) {
    const filePath = path.join(fontsDir, file)
    const body = fs.readFileSync(filePath)
    const ext = path.extname(file).toLowerCase()
    const key = `${prefix}/${file}`

    console.log(`  Uploading ${file} (${(body.length / 1024 / 1024).toFixed(1)} MB)...`)

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mimeTypes[ext] || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }))
  }

  console.log(`\nDone! ${files.length} fonts uploaded to R2 under "${prefix}/"`)
  console.log(`Public URL pattern: https://pub-6707275e70b943c9abf6f3f8017ff7a0.r2.dev/${prefix}/<filename>`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
