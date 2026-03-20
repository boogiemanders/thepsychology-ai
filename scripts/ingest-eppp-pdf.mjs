#!/usr/bin/env node
/**
 * Parse a PsychPrep EPPP practice exam PDF into structured JSON per domain.
 *
 * PDF format (one question per "page", separated by "-- N of M --"):
 *   DOMAIN HEADER (ALL CAPS)
 *   N. Question stem text...
 *   • 	1. Option 1
 *   • 	2. Option 2
 *   • 	3. Option 3
 *   • 	4. Option 4
 *   Feedback: CORRECT – Answer N! Explanation text...
 *
 * Some pages contain TWO questions with different domain headers mid-page.
 *
 * Usage:
 *   node scripts/ingest-eppp-pdf.mjs path/to/exam.pdf
 *
 * Output: staging/pdf-parsed/domain-{key}.json
 */

import fs from 'fs/promises'
import path from 'path'
import { PDFParse } from 'pdf-parse'

const PDF_DOMAIN_MAP = {
  'BIOLOGICAL BASES OF BEHAVIOR': '1',
  'COGNITIVE-AFFECTIVE BASES OF BEHAVIOR': '2',
  'SOCIAL AND MULTICULTURAL BASES OF BEHAVIOR': '3-social',
  'GROWTH AND LIFESPAN DEVELOPMENT': '4',
  'ASSESSMENT AND DIAGNOSIS': '5-assessment',
  'TREATMENT/INTERVENTION': '6',
  'TREATMENT, INTERVENTION, AND PREVENTION': '6',
  'RESEARCH METHODS AND STATISTICS': '7',
  'ETHICAL/LEGAL/PROFESSIONAL ISSUES': '8',
}

const DOMAIN_HEADERS = Object.keys(PDF_DOMAIN_MAP)
const OUTPUT_DIR = path.resolve('staging/pdf-parsed')

function matchDomain(line) {
  const trimmed = line.trim()
  for (const header of DOMAIN_HEADERS) {
    if (trimmed === header) return header
  }
  return null
}

function splitIntoQuestionChunks(pageText) {
  // A page may have 1 or 2 questions. Each question is preceded by a domain header.
  // Split on domain headers to get individual question blocks.
  const chunks = []
  const lines = pageText.split('\n')
  let currentDomain = null
  let currentLines = []

  for (const line of lines) {
    const domain = matchDomain(line)
    if (domain) {
      // Flush previous chunk
      if (currentDomain && currentLines.length > 0) {
        chunks.push({ domain: currentDomain, text: currentLines.join('\n') })
      }
      currentDomain = domain
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  // Flush last chunk
  if (currentDomain && currentLines.length > 0) {
    chunks.push({ domain: currentDomain, text: currentLines.join('\n') })
  }

  return chunks
}

function parseQuestion(text) {
  // Extract the question number and stem
  // Format: "N. Question text..." then options start with "• \tN."
  const stemMatch = text.match(/(\d+)\.\s+([\s\S]*?)(?=\n.*•\s)/)
  if (!stemMatch) return null

  const stem = stemMatch[2].replace(/\s+/g, ' ').trim()

  // Extract options: "• \tN. option text"
  const optionPattern = /•\s+(\d)\.\s+([^\n]+)/g
  const options = {}
  let match
  while ((match = optionPattern.exec(text)) !== null) {
    options[match[1]] = match[2].trim()
  }

  const optionArray = ['1', '2', '3', '4'].map((n) => options[n]).filter(Boolean)

  // Extract correct answer from feedback
  const feedbackMatch = text.match(/Feedback:\s*CORRECT\s*[–\-]\s*Answer\s*(\d)/i)
  const answerNum = feedbackMatch ? feedbackMatch[1] : null
  const answerLetter = answerNum ? ['A', 'B', 'C', 'D'][parseInt(answerNum, 10) - 1] : null

  if (!stem || optionArray.length < 4) {
    return null
  }

  return {
    originalStem: stem,
    originalOptions: optionArray,
    originalAnswer: answerLetter,
    conceptSummary: null,
  }
}

async function main() {
  const pdfPath = process.argv[2]
  if (!pdfPath) {
    console.error('Usage: node scripts/ingest-eppp-pdf.mjs <path-to-pdf>')
    process.exit(1)
  }

  const resolvedPath = path.resolve(pdfPath)
  console.log(`Reading PDF: ${resolvedPath}`)

  const buffer = await fs.readFile(resolvedPath)
  const parser = new PDFParse({ data: buffer })
  const textResult = await parser.getText()
  await parser.destroy()

  const text = textResult?.text || ''
  if (!text.trim()) {
    console.error('No text extracted from PDF.')
    process.exit(1)
  }

  console.log(`Extracted ${text.length} characters of text.`)

  // Split on page separators
  const pages = text.split(/--\s*\d+\s*of\s*\d+\s*--/)

  const domains = {}
  let parsed = 0
  let failed = 0

  for (const page of pages) {
    if (!page.trim()) continue

    const chunks = splitIntoQuestionChunks(page)

    for (const chunk of chunks) {
      const domainKey = PDF_DOMAIN_MAP[chunk.domain]
      if (!domainKey) continue

      const question = parseQuestion(chunk.text)
      if (question) {
        if (!domains[domainKey]) {
          domains[domainKey] = { domain: chunk.domain, domainKey, questions: [] }
        }
        domains[domainKey].questions.push(question)
        parsed++
      } else {
        failed++
      }
    }
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Clear prior parsed domain files so a new exam doesn't inherit stale domains.
  const existing = await fs.readdir(OUTPUT_DIR)
  for (const file of existing) {
    if (file.startsWith('domain-') && file.endsWith('.json')) {
      await fs.unlink(path.join(OUTPUT_DIR, file))
    }
  }

  let totalQuestions = 0
  for (const [key, data] of Object.entries(domains)) {
    const outFile = path.join(OUTPUT_DIR, `domain-${key}.json`)
    await fs.writeFile(outFile, JSON.stringify(data, null, 2))
    console.log(`  domain-${key}.json: ${data.questions.length} questions (${data.domain})`)
    totalQuestions += data.questions.length
  }

  console.log(`\nTotal: ${totalQuestions} questions parsed, ${failed} failed`)
  console.log(`Output: ${OUTPUT_DIR}/`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
