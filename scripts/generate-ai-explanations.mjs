#!/usr/bin/env node

/**
 * Generate AI explanations for all questions using EPPP reference content
 *
 * Usage: node scripts/generate-ai-explanations.mjs [--dry-run] [--file <path>]
 *
 * Options:
 *   --dry-run   Preview changes without writing to files
 *   --file      Process only a specific file
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const QUESTIONS_DIR = path.join(ROOT_DIR, 'questionsGPT')
const REFERENCE_DIR = path.join(ROOT_DIR, 'eppp-reference og')

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Domain folder to domain ID mapping (inverse of DOMAIN_FOLDER_MAP)
const FOLDER_TO_DOMAIN_ID = {
  '1 Biological Bases of Behavior : Physiological Psychology and Psychopharmacology': '1',
  '2 Cognitive-Affective Bases : Learning and Memory': '2',
  '3 Social Psychology': '3-social',
  '3 Cultural': '3-cultural',
  '4 Growth & Lifespan Development': '4',
  '5 Assessment': '5-assessment',
  '5 Diagnosis : Psychopathology': '5-diagnosis',
  '5 Test Construction': '5-test',
  '6 Treatment, Intervention, and Prevention : Clinical Psychology': '6',
  '7 Research Methods & Statistics': '7',
  '8 Ethical : Legal : Professional Issues': '8',
  '2 3 5 6 Organizational Psychology': '3-5-6',
}

// Domain ID to reference folder
const DOMAIN_ID_TO_REFERENCE_FOLDER = {
  '1': '1 Biological Bases of Behavior : Physiological Psychology and Psychopharmacology',
  '2': '2 Cognitive-Affective Bases : Learning and Memory',
  '3-social': '3 Social Psychology',
  '3-cultural': '3 Cultural',
  '4': '4 Growth & Lifespan Development',
  '5-assessment': '5 Assessment',
  '5-diagnosis': '5 Diagnosis : Psychopathology',
  '5-test': '5 Test Construction',
  '6': '6 Treatment, Intervention, and Prevention : Clinical Psychology',
  '7': '7 Research Methods & Statistics',
  '8': '8 Ethical : Legal : Professional Issues',
  '3-5-6': '2 3 5 6 Organizational Psychology',
}

function normalizeTopicName(topicName) {
  return topicName
    .replace(/\//g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '')
    .replace(/\.\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTopicFromFilename(filename) {
  // Remove extension and leading domain number
  const baseName = filename.replace(/\.json$/i, '')
  // Remove leading number and space (e.g., "1 " or "2 3 ")
  return baseName.replace(/^[\d\s]+/, '').trim()
}

function findReferenceFile(topicName, domainId) {
  const domainFolder = DOMAIN_ID_TO_REFERENCE_FOLDER[domainId]
  if (!domainFolder) return null

  const folderPath = path.join(REFERENCE_DIR, domainFolder)
  if (!fs.existsSync(folderPath)) return null

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'))
  const normalizedTopic = normalizeTopicName(topicName)

  // Try exact match first
  for (const file of files) {
    const normalizedFile = normalizeTopicName(file.replace('.md', '').replace(/^[\d\s]+/, ''))
    if (normalizedFile === normalizedTopic) {
      return path.join(folderPath, file)
    }
  }

  // Try fuzzy match
  for (const file of files) {
    const normalizedFile = normalizeTopicName(file.replace('.md', '').replace(/^[\d\s]+/, ''))
    if (normalizedFile.includes(normalizedTopic) || normalizedTopic.includes(normalizedFile)) {
      return path.join(folderPath, file)
    }
  }

  return null
}

function loadReferenceContent(topicName, domainId) {
  const filePath = findReferenceFile(topicName, domainId)
  if (!filePath) return null

  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(`Error reading reference file: ${filePath}`, err)
    return null
  }
}

async function generateExplanation(question, answer, options, referenceContent) {
  const incorrectOptions = options.filter(opt => opt !== answer)
  const optionsText = incorrectOptions.map((opt, i) => `- ${opt}`).join('\n')

  const prompt = `You are an EPPP psychology tutor explaining a multiple-choice question.

## Reference Material (from EPPP study guide)
${referenceContent}

---

## Question
${question}

## Correct Answer
${answer}

## Incorrect Options
${optionsText}

---

Using ONLY the reference material above, provide a comprehensive explanation:

1. First, explain why "${answer}" is the correct answer (2-3 sentences).

2. Then briefly explain why each incorrect option is wrong (1 sentence each).

Keep the total response under 400 words. Be educational and clear.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: 'You are a helpful EPPP psychology tutor. Base your explanations only on the provided reference material. Be concise.',
    })

    return response.content[0]?.text?.trim() || null
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    return null
  }
}

function getAllQuestionFiles() {
  const files = []

  const domains = fs.readdirSync(QUESTIONS_DIR).filter(f => {
    const fullPath = path.join(QUESTIONS_DIR, f)
    return fs.statSync(fullPath).isDirectory()
  })

  for (const domain of domains) {
    const domainPath = path.join(QUESTIONS_DIR, domain)
    const jsonFiles = fs.readdirSync(domainPath).filter(f => f.endsWith('.json'))

    for (const jsonFile of jsonFiles) {
      files.push({
        path: path.join(domainPath, jsonFile),
        domain,
        filename: jsonFile,
      })
    }
  }

  return files
}

async function processFile(fileInfo, dryRun = false) {
  const { path: filePath, domain, filename } = fileInfo
  const domainId = FOLDER_TO_DOMAIN_ID[domain]
  const topicName = extractTopicFromFilename(filename)

  console.log(`\n📁 Processing: ${filename}`)
  console.log(`   Domain: ${domain} (${domainId || 'unknown'})`)
  console.log(`   Topic: ${topicName}`)

  // Load reference content
  const referenceContent = domainId ? loadReferenceContent(topicName, domainId) : null

  if (!referenceContent) {
    console.log(`   ⚠️  No reference content found, skipping`)
    return { processed: 0, skipped: 0, errors: 0, noRef: 1 }
  }

  // Load questions
  let data
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    data = JSON.parse(content)
  } catch (err) {
    console.error(`   ❌ Error reading file: ${err.message}`)
    return { processed: 0, skipped: 0, errors: 1, noRef: 0 }
  }

  const questions = data.questions || []
  let processed = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const stem = q.stem || q.question
    const answer = q.answer || q.correct_answer
    const options = q.options || []

    if (!stem || !answer || options.length < 2) {
      console.log(`   ⚠️  Q${i + 1}: Missing stem, answer, or options, skipping`)
      skipped++
      continue
    }

    // Check if already has AI-generated explanation (longer than typical)
    if (q.explanation && q.explanation.length > 200) {
      console.log(`   ⏭️  Q${i + 1}: Already has AI explanation, skipping`)
      skipped++
      continue
    }

    console.log(`   🔄 Q${i + 1}: Generating explanation...`)

    const explanation = await generateExplanation(stem, answer, options, referenceContent)

    if (explanation) {
      if (!dryRun) {
        q.explanation = explanation
      }
      console.log(`   ✅ Q${i + 1}: Generated (${explanation.length} chars)`)
      processed++
    } else {
      console.log(`   ❌ Q${i + 1}: Failed to generate`)
      errors++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Write back to file
  if (!dryRun && processed > 0) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
      console.log(`   💾 Saved ${processed} updated explanations`)
    } catch (err) {
      console.error(`   ❌ Error writing file: ${err.message}`)
      errors++
    }
  }

  return { processed, skipped, errors, noRef: 0 }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const fileIndex = args.indexOf('--file')
  const specificFile = fileIndex !== -1 ? args[fileIndex + 1] : null

  console.log('🚀 AI Explanation Generator')
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set')
    process.exit(1)
  }

  let files = getAllQuestionFiles()

  if (specificFile) {
    files = files.filter(f => f.path.includes(specificFile) || f.filename.includes(specificFile))
    if (files.length === 0) {
      console.error(`❌ No files matching: ${specificFile}`)
      process.exit(1)
    }
  }

  console.log(`   Files to process: ${files.length}`)

  const totals = { processed: 0, skipped: 0, errors: 0, noRef: 0 }

  for (const file of files) {
    const result = await processFile(file, dryRun)
    totals.processed += result.processed
    totals.skipped += result.skipped
    totals.errors += result.errors
    totals.noRef += result.noRef
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Processed: ${totals.processed}`)
  console.log(`   ⏭️  Skipped: ${totals.skipped}`)
  console.log(`   ⚠️  No reference: ${totals.noRef}`)
  console.log(`   ❌ Errors: ${totals.errors}`)
}

main().catch(console.error)
