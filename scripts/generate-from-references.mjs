#!/usr/bin/env node
/**
 * Two-pass question generation using `claude` CLI (subscription, not API).
 *
 * Pass 1: Extract core concepts from parsed reference questions.
 * Pass 2: Generate new original questions grounded in lesson content.
 *
 * Usage:
 *   node scripts/generate-from-references.mjs [--domain 1] [--dry-run]
 *
 * Reads from:  staging/pdf-parsed/domain-*.json
 * Writes to:   staging/review/questionsGPT/{domain-folder}/{topic}.json
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import OpenAI from 'openai'

const DOMAIN_FOLDER_MAP = {
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

const PARSED_DIR = path.resolve('staging/pdf-parsed')
const REVIEW_DIR = path.resolve('staging/review/questionsGPT')
const CONTENT_DIR = path.resolve('topic-content-v4')
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

function sanitizeOpenAIApiKey(raw) {
  if (!raw) return null
  let value = String(raw).trim()
  if (!value) return null

  value = value.replace(/[\u200B-\u200D\uFEFF]/g, '')
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  if (value.includes('#')) {
    value = value.split('#')[0].trim()
  }

  value = value.split(/\s+/)[0]?.trim() ?? ''
  value = value.replace(/[^\x21-\x7E]/g, '')
  return value || null
}

function readDotenvLocalValue(key) {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const text = fsSync.readFileSync(envPath, 'utf8')
    const line = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let value = line.slice(key.length + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value.trim() || null
  } catch {
    return null
  }
}

function getOpenAIApiKey() {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY)
  if (process.env.NODE_ENV === 'production') return fromProcess
  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY'))
  return fromEnvLocal ?? fromProcess
}

const openaiApiKey = getOpenAIApiKey()
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null

let provider = 'auto'
let fallbackWarned = false
let activeProvider = null

async function callClaude(prompt) {
  // Use claude CLI with --print, passing prompt via stdin to avoid arg length limits
  return new Promise((resolve, reject) => {
    const chunks = []
    const proc = spawn('claude', ['--print'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    proc.stdout.on('data', (chunk) => chunks.push(chunk))

    let stderr = ''
    proc.stderr.on('data', (chunk) => { stderr += chunk })

    proc.on('close', (code) => {
      const output = Buffer.concat(chunks).toString().trim()
      if (code !== 0) {
        const detail = [stderr.trim(), output].filter(Boolean).join(' ').trim()
        reject(new Error(`claude exited with code ${code}: ${detail || 'no output'}`))
        return
      }
      resolve(output)
    })

    proc.on('error', reject)

    proc.stdin.write(prompt)
    proc.stdin.end()
  })
}

async function callOpenAI(prompt) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const text = completion.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('OpenAI returned no text content')
  }

  return text.trim()
}

function noteProvider(name) {
  if (activeProvider === name) return
  activeProvider = name
  console.log(`  LLM provider: ${name}${name === 'openai' ? ` (${OPENAI_MODEL})` : ''}`)
}

async function callLLM(prompt) {
  if (provider === 'claude') {
    noteProvider('claude')
    return callClaude(prompt)
  }

  if (provider === 'openai') {
    noteProvider('openai')
    return callOpenAI(prompt)
  }

  try {
    const output = await callClaude(prompt)
    noteProvider('claude')
    return output
  } catch (err) {
    if (!openai) throw err
    if (!fallbackWarned) {
      console.warn(`  Claude unavailable; falling back to OpenAI (${OPENAI_MODEL}).`)
      console.warn(`  Reason: ${err.message}`)
      fallbackWarned = true
    }
    noteProvider('openai')
    return callOpenAI(prompt)
  }
}

function extractJson(text) {
  // Try to find JSON in the response (may be wrapped in markdown code blocks)
  let cleaned = text
  if (cleaned.includes('```json')) {
    cleaned = cleaned.split('```json')[1].split('```')[0]
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.split('```')[1].split('```')[0]
  }
  return JSON.parse(cleaned.trim())
}

async function loadLessonFiles(domainKey) {
  const folderName = DOMAIN_FOLDER_MAP[domainKey]
  if (!folderName) return []

  const folderPath = path.join(CONTENT_DIR, folderName)
  try {
    const files = await fs.readdir(folderPath)
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    const lessons = []
    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(folderPath, file), 'utf8')
      const headers = []
      for (const line of content.split('\n')) {
        const h2 = line.match(/^## (.+)/)
        const h3 = line.match(/^### (.+)/)
        if (h2) headers.push(h2[1])
        if (h3) headers.push(h3[1])
      }
      lessons.push({
        filename: file,
        slug: file.replace(/\.md$/, ''),
        headers,
        content,
      })
    }
    return lessons
  } catch {
    return []
  }
}

async function pass1ExtractConcepts(questions, domainHeader) {
  const questionSummary = questions
    .map((q, i) => `${i + 1}. ${q.originalStem}\n   Options: ${q.originalOptions.join(' | ')}`)
    .join('\n\n')

  const prompt = `You are an expert in EPPP psychology exam content.

Below are reference questions from the domain "${domainHeader}". For each question, extract ONLY the core concept/topic being tested. Do NOT reproduce any wording from the questions. Just identify the underlying concept.

Return a JSON array of objects with:
- "index": the question number (1-based)
- "concept": a brief 5-15 word description of the concept being tested
- "subtopic": the narrower topic area (e.g. "classical conditioning", "MMPI-2 validity scales")

REFERENCE QUESTIONS:
${questionSummary}

Return ONLY valid JSON. No markdown formatting, no explanation.`

  console.log(`  Pass 1: Extracting concepts from ${questions.length} reference questions...`)
  const response = await callLLM(prompt)
  return extractJson(response)
}

async function pass2GenerateQuestions(concepts, lessons, domainKey, domainHeader) {
  const lessonSummaries = lessons
    .map((l) => {
      // Truncate long lessons to fit in context
      const truncated = l.content.length > 6000 ? l.content.substring(0, 6000) + '\n...[truncated]' : l.content
      return `### FILE: ${l.filename}\n${truncated}`
    })
    .join('\n\n---\n\n')

  const conceptList = concepts
    .map((c) => `- Concept ${c.index}: ${c.concept} (subtopic: ${c.subtopic})`)
    .join('\n')

  // Process in batches to stay within context limits
  const batchSize = 10
  const allQuestions = []

  for (let i = 0; i < concepts.length; i += batchSize) {
    const batch = concepts.slice(i, i + batchSize)
    const batchConceptList = batch
      .map((c) => `- Concept ${c.index}: ${c.concept} (subtopic: ${c.subtopic})`)
      .join('\n')

    const prompt = `You are an expert EPPP question writer for the domain "${domainHeader}".

TASK: Generate ONE new, original multiple-choice question for EACH concept below. The questions must be:
1. COMPLETELY ORIGINAL — do not copy or closely paraphrase any existing question
2. GROUNDED in the lesson content provided below
3. At EPPP doctoral-level difficulty

For each question, you MUST:
- Write the question based on what the lesson content actually says
- Identify which lesson file and which H2/H3 section the question maps to
- Include a direct quote from the lesson that confirms the answer
- Flag if the lesson doesn't adequately cover the concept

CONCEPTS TO GENERATE QUESTIONS FOR:
${batchConceptList}

LESSON CONTENT (domain ${domainKey}):
${lessonSummaries}

Return a JSON array where each object has these exact fields:
{
  "stem": "New original question text",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "answer": "Exact text of the correct option (must match one of the options)",
  "explanation": "Original explanation of why the answer is correct and why each distractor is wrong",
  "kn": "KN code (e.g. KN1 for domain 1, KN6 for domain 2, etc.)",
  "kn_explanation": "Why this KN code applies",
  "difficulty": "easy|medium|hard",
  "quality_comment": "Brief assessment of question quality",
  "suggestedLesson": "filename without .md extension (e.g. 1-neurons-and-neurotransmitters)",
  "suggestedParagraph": "The H2 or H3 header text (e.g. ## Neurotransmitter Systems)",
  "lessonExcerpt": "Direct quote from the lesson that supports the correct answer",
  "needsReview": false,
  "inspirationDomain": "${domainHeader}",
  "inspirationIndex": 0
}

Set "needsReview": true if the lesson content doesn't clearly support the answer.
Set "inspirationIndex" to the concept index number.

Return ONLY a valid JSON array. No markdown, no explanation outside the JSON.`

    console.log(`  Pass 2: Generating questions for concepts ${i + 1}-${Math.min(i + batchSize, concepts.length)}...`)
    const response = await callLLM(prompt)
    try {
      const questions = extractJson(response)
      allQuestions.push(...questions)
    } catch (err) {
      console.error(`  Error parsing batch ${i + 1}: ${err.message}`)
      console.error(`  Raw response (first 500 chars): ${response.substring(0, 500)}`)
    }

    // Small delay between batches to be respectful of rate limits
    if (i + batchSize < concepts.length) {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  return allQuestions
}

function groupByLesson(questions) {
  const groups = {}
  for (const q of questions) {
    const lesson = q.suggestedLesson || 'unmatched'
    if (!groups[lesson]) groups[lesson] = []
    groups[lesson].push(q)
  }
  return groups
}

async function processDomain(domainFile) {
  const raw = await fs.readFile(domainFile, 'utf8')
  const data = JSON.parse(raw)
  const { domain, domainKey, questions } = data

  console.log(`\nProcessing domain: ${domain} (${domainKey}) — ${questions.length} reference questions`)

  if (questions.length === 0) {
    console.log('  No questions to process, skipping.')
    return
  }

  // Load lesson content for this domain
  const lessons = await loadLessonFiles(domainKey)
  if (lessons.length === 0) {
    console.warn(`  Warning: No lesson files found for domain ${domainKey}`)
  } else {
    console.log(`  Loaded ${lessons.length} lesson files`)
  }

  // Pass 1: Extract concepts
  const concepts = await pass1ExtractConcepts(questions, domain)
  console.log(`  Extracted ${concepts.length} concepts`)

  // Pass 2: Generate new questions
  const newQuestions = await pass2GenerateQuestions(concepts, lessons, domainKey, domain)
  console.log(`  Generated ${newQuestions.length} new questions`)

  // Group by lesson and write output files
  const folderName = DOMAIN_FOLDER_MAP[domainKey]
  if (!folderName) {
    console.error(`  No folder mapping for domain key: ${domainKey}`)
    return
  }

  const outputFolder = path.join(REVIEW_DIR, folderName)
  await fs.mkdir(outputFolder, { recursive: true })

  const grouped = groupByLesson(newQuestions)
  for (const [lesson, qs] of Object.entries(grouped)) {
    const outFile = path.join(outputFolder, `${lesson}.json`)

    // Check if file already exists and merge
    let existing = []
    try {
      const prev = JSON.parse(await fs.readFile(outFile, 'utf8'))
      existing = prev.questions || []
    } catch {
      // File doesn't exist yet
    }

    const merged = { questions: [...existing, ...qs] }
    await fs.writeFile(outFile, JSON.stringify(merged, null, 2))
    console.log(`  Wrote ${qs.length} questions to ${folderName}/${lesson}.json`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const domainFilter = args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null
  provider = args.includes('--provider') ? args[args.indexOf('--provider') + 1] : 'auto'
  const dryRun = args.includes('--dry-run')

  if (!['auto', 'claude', 'openai'].includes(provider)) {
    console.error('Invalid --provider. Use one of: auto, claude, openai')
    process.exit(1)
  }

  if (provider === 'openai' && !openai) {
    console.error('OPENAI_API_KEY is required when using --provider openai')
    process.exit(1)
  }

  if (dryRun) {
    console.log('DRY RUN: Will show what would be processed without calling Claude.\n')
  }

  // Find parsed domain files
  let files
  try {
    files = (await fs.readdir(PARSED_DIR)).filter((f) => f.startsWith('domain-') && f.endsWith('.json'))
  } catch {
    console.error(`No parsed files found in ${PARSED_DIR}. Run ingest-eppp-pdf.mjs first.`)
    process.exit(1)
  }

  if (domainFilter) {
    files = files.filter((f) => f === `domain-${domainFilter}.json`)
  }

  if (files.length === 0) {
    console.error('No matching domain files found.')
    process.exit(1)
  }

  console.log(`Found ${files.length} domain file(s) to process.`)

  for (const file of files) {
    const filePath = path.join(PARSED_DIR, file)

    if (dryRun) {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
      console.log(`  Would process: ${data.domain} (${data.domainKey}) — ${data.questions.length} questions`)
      continue
    }

    await processDomain(filePath)
  }

  console.log('\nDone. Review generated questions in staging/review/questionsGPT/')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
