import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'

let pdfDir = 'recover-pdfs'
let bucket = 'recover-pdfs'
let chunkWords = 450
let overlapWords = 80
let maxFiles = null
let includeInternalLessons = true
let citationsFile = 'recover-citations.json'

let openai = null
let supabase = null

async function loadDotEnvFiles(files = ['.env.local', '.env']) {
  const overrideExisting = (process.env.RECOVER_DOTENV_OVERRIDE || '1') === '1'

  for (const file of files) {
    let raw = ''
    try {
      raw = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx <= 0) continue
      const key = trimmed.slice(0, idx).trim()
      if (!key) continue
      if (!overrideExisting && Object.prototype.hasOwnProperty.call(process.env, key)) continue

      let value = trimmed.slice(idx + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
    }
  }
}

function cleanText(text) {
  return text.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim()
}

async function loadCitationOverrides() {
  try {
    const raw = await fs.readFile(citationsFile, 'utf8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function toStoragePath(fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_')
  return safeName
}

function chunkText(text) {
  const words = text.split(/\s+/)
  const step = Math.max(1, chunkWords - overlapWords)
  const chunks = []

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(words.length, start + chunkWords)
    const slice = words.slice(start, end).join(' ')
    if (slice.length < 200) continue
    chunks.push(slice)
    if (end >= words.length) break
  }

  return chunks
}

async function insertChunks(documentId, chunks) {
  const batchSize = 40
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })
    const embeddings = embeddingResponse.data.map((item) => item.embedding)

    const rows = batch.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: i + index,
      content: chunk,
      embedding: embeddings[index],
    }))

    const { error } = await supabase.from('recover_chunks').insert(rows)
    if (error) {
      throw new Error(`Failed to insert chunks: ${error.message}`)
    }
  }
}

async function upsertDocument({ title, apaCitation, storagePath }) {
  const payload = {
    title,
    apa_citation: apaCitation || null,
    storage_path: storagePath,
  }

  const { data, error } = await supabase
    .from('recover_documents')
    .upsert(payload, { onConflict: 'storage_path' })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert document row: ${error?.message || 'Unknown error'}`)
  }

  return data.id
}

async function clearChunks(documentId) {
  const { error } = await supabase.from('recover_chunks').delete().eq('document_id', documentId)
  if (error) {
    throw new Error(`Failed to clear existing chunks: ${error.message}`)
  }
}

async function ingestTextDocument({ title, apaCitation, storagePath, text }) {
  const cleaned = cleanText(text || '')
  if (!cleaned) {
    console.warn(`Skipping ${title}: no text extracted.`)
    return
  }

  const documentId = await upsertDocument({ title, apaCitation, storagePath })
  await clearChunks(documentId)

  const chunks = chunkText(cleaned)
  if (chunks.length === 0) {
    console.warn(`Skipping ${title}: no usable chunks.`)
    return
  }

  console.log(`Embedding ${chunks.length} chunks for ${title}...`)
  await insertChunks(documentId, chunks)
  console.log(`Done: ${title}`)
}

function extractMarkdownTitle(markdown, fallbackTitle) {
  const match = markdown.match(/^#\s+(.+)$/m)
  const heading = match?.[1]?.trim()
  return heading && heading.length > 0 ? heading : fallbackTitle
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s?/gm, '')
    .replace(/[*_~]+/g, ' ')
}

async function ingestPdf(fileName, citationOverrides) {
  const filePath = path.join(pdfDir, fileName)
  const buffer = await fs.readFile(filePath)

  const parser = new PDFParse({ data: buffer })
  const infoResult = await parser.getInfo().catch(() => null)
  const textResult = await parser.getText()
  await parser.destroy()

  const titleFromMeta = infoResult?.info?.Title ? String(infoResult.info.Title).trim() : ''
  const titleFallback = fileName.replace(/\.pdf$/i, '').trim()
  const title = titleFromMeta && titleFromMeta.toLowerCase() !== 'untitled' ? titleFromMeta : titleFallback

  const storagePath = toStoragePath(fileName)
  const upload = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (upload.error) {
    throw new Error(`Failed to upload ${fileName}: ${upload.error.message}`)
  }

  const apaCitation = citationOverrides[fileName] || citationOverrides[storagePath] || null
  await ingestTextDocument({ title, apaCitation, storagePath, text: textResult?.text || '' })
}

async function ingestInternalLessons(citationOverrides) {
  const lessons = [
    {
      path: 'topic-content/1-biological-bases/memory-and-sleep.md',
      title: 'Memory and Sleep',
      storagePath: 'internal:topic-content/1-biological-bases/memory-and-sleep.md',
    },
    {
      path: 'topic-content/1-biological-bases/emotions-and-stress.md',
      title: 'Emotions and Stress Systems',
      storagePath: 'internal:topic-content/1-biological-bases/emotions-and-stress.md',
    },
    {
      path: 'topic-content/2-cognitive-affective-bases/memory-and-forgetting.md',
      title: 'Memory and Forgetting',
      storagePath: 'internal:topic-content/2-cognitive-affective-bases/memory-and-forgetting.md',
    },
  ]

  for (const lesson of lessons) {
    const markdown = await fs.readFile(lesson.path, 'utf8')
    const title = extractMarkdownTitle(markdown, lesson.title)
    const apaCitation = citationOverrides[lesson.storagePath] || citationOverrides[lesson.path] || null
    await ingestTextDocument({
      title,
      apaCitation,
      storagePath: lesson.storagePath,
      text: stripMarkdown(markdown),
    })
  }
}

async function main() {
  await loadDotEnvFiles()

  const openaiApiKey = process.env.OPENAI_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  pdfDir = process.env.RECOVER_PDF_DIR || pdfDir
  bucket = process.env.RECOVER_BUCKET || bucket
  chunkWords = Number.parseInt(process.env.RECOVER_CHUNK_WORDS || String(chunkWords), 10)
  overlapWords = Number.parseInt(process.env.RECOVER_CHUNK_OVERLAP || String(overlapWords), 10)
  maxFiles = process.env.RECOVER_MAX_FILES ? Number.parseInt(process.env.RECOVER_MAX_FILES, 10) : maxFiles
  includeInternalLessons = process.env.RECOVER_INCLUDE_INTERNAL_LESSONS !== '0'
  citationsFile = process.env.RECOVER_CITATIONS_FILE || citationsFile

  openai = new OpenAI({ apiKey: openaiApiKey })
  supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

  try {
    await openai.embeddings.create({ model: 'text-embedding-3-small', input: 'ingest healthcheck' })
  } catch (error) {
    console.error('OpenAI embedding healthcheck failed. Check OPENAI_API_KEY.')
    throw error
  }

  const supabaseHealthcheck = await supabase.from('recover_documents').select('id').limit(1)
  if (supabaseHealthcheck.error) {
    throw new Error(`Supabase healthcheck failed: ${supabaseHealthcheck.error.message}`)
  }

  const citationOverrides = await loadCitationOverrides()

  const entries = await fs.readdir(pdfDir).catch(() => [])
  const pdfFiles = entries.filter((file) => file.toLowerCase().endsWith('.pdf'))
  const selectedFiles = maxFiles ? pdfFiles.slice(0, maxFiles) : pdfFiles

  if (selectedFiles.length > 0) {
    console.log(`Found ${selectedFiles.length} PDF(s). Uploading to ${bucket}...`)
    for (const fileName of selectedFiles) {
      console.log(`\nProcessing ${fileName}`)
      await ingestPdf(fileName, citationOverrides)
    }
  } else {
    console.log(`No PDFs found in ${pdfDir}.`)
  }

  if (includeInternalLessons) {
    console.log('\nProcessing internal lessons...')
    await ingestInternalLessons(citationOverrides)
  }
}

main().catch((error) => {
  console.error('Ingestion failed:', error)
  process.exit(1)
})
