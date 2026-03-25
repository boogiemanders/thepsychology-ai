#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const REVIEW_ROOT = path.join(ROOT, 'staging', 'review')
const KNS_PATH = path.join(ROOT, 'KNs.md')
const REPORT_DIR = path.join(REVIEW_ROOT, 'reports')
const SUMMARY_PATH = path.join(REPORT_DIR, 'kn-audit-summary.md')
const DETAILS_PATH = path.join(REPORT_DIR, 'kn-audit-details.json')

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'by', 'can', 'current', 'does', 'for',
  'from', 'how', 'if', 'in', 'include', 'including', 'into', 'is', 'it', 'its', 'of', 'on', 'or',
  'pertaining', 'should', 'such', 'than', 'that', 'the', 'their', 'them', 'these', 'this', 'those',
  'to', 'use', 'used', 'using', 'various', 'what', 'when', 'which', 'with', 'within', 'your',
  'major', 'models', 'theories', 'theory', 'model', 'issues', 'issue', 'methods', 'method',
  'research', 'based', 'psychological', 'psychology', 'client', 'clients', 'question', 'questions',
  'knowledge', 'domain', 'domains', 'factors', 'factor', 'approaches', 'approach'
])

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function parseKNs(markdown) {
  const kns = new Map()
  let currentDomain = null

  for (const line of markdown.split(/\r?\n/)) {
    const domainMatch = line.match(/^##\s+(\d+)\./)
    if (domainMatch) {
      currentDomain = Number(domainMatch[1])
      continue
    }

    const knMatch = line.match(/^- (KN\d{1,2})\.\s+(.*)$/)
    if (knMatch && currentDomain) {
      const [, code, description] = knMatch
      kns.set(code, {
        code,
        domain: currentDomain,
        description: description.trim(),
      })
    }
  }

  return kns
}

function normalizeToken(token) {
  let t = token.toLowerCase()
  if (t.length > 5 && t.endsWith('ing')) t = t.slice(0, -3)
  else if (t.length > 4 && t.endsWith('ed')) t = t.slice(0, -2)
  else if (t.length > 4 && t.endsWith('es')) t = t.slice(0, -2)
  else if (t.length > 3 && t.endsWith('s')) t = t.slice(0, -1)
  return t
}

function tokenize(text) {
  const raw = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return raw
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
}

function expectedDomainFromQuestion(filePath, question) {
  const inspiration = String(question.inspirationDomain || '').toUpperCase()
  if (inspiration.includes('BIOLOGICAL')) return 1
  if (inspiration.includes('COGNITIVE-AFFECTIVE')) return 2
  if (inspiration.includes('SOCIAL') || inspiration.includes('CULTURAL')) return 3
  if (inspiration.includes('GROWTH') || inspiration.includes('LIFESPAN')) return 4
  if (inspiration.includes('ASSESSMENT') || inspiration.includes('DIAGNOSIS')) return 5
  if (inspiration.includes('TREATMENT') || inspiration.includes('INTERVENTION')) return 6
  if (inspiration.includes('RESEARCH')) return 7
  if (inspiration.includes('ETHIC') || inspiration.includes('LEGAL') || inspiration.includes('PROFESSIONAL')) return 8

  const rel = path.relative(REVIEW_ROOT, filePath)
  const parts = rel.split(path.sep)
  const folder = parts[1] || ''
  if (folder.startsWith('1 ')) return 1
  if (folder.startsWith('2 Learning')) return 2
  if (folder.startsWith('3 Social') || folder.startsWith('3 Cultural')) return 3
  if (folder.startsWith('4 ')) return 4
  if (folder.startsWith('5 ')) return 5
  if (folder.startsWith('6 ')) return 6
  if (folder.startsWith('7 ')) return 7
  if (folder.startsWith('8 ')) return 8
  return null
}

function collectJsonFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'archive-beyond-lesson.json') {
      results.push(full)
    }
  }
  return results.sort()
}

function formatPercent(numerator, denominator) {
  if (!denominator) return '0.0%'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

function main() {
  const kns = parseKNs(fs.readFileSync(KNS_PATH, 'utf8'))
  const files = collectJsonFiles(REVIEW_ROOT)
  const details = []
  const fileStats = new Map()
  const sourceStats = new Map()

  let totalQuestions = 0
  let missingKN = 0
  let missingKNExplanation = 0
  let invalidKN = 0
  let domainConflict = 0
  let lexicalConflict = 0
  let highConfidenceIssues = 0

  for (const file of files) {
    let raw
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      continue
    }

    const questions = Array.isArray(raw) ? raw : Array.isArray(raw.questions) ? raw.questions : []
    const relPath = path.relative(ROOT, file)
    const source = relPath.split(path.sep)[2] || 'unknown'
    if (!sourceStats.has(source)) {
      sourceStats.set(source, { files: 0, questions: 0, missingKN: 0, invalidKN: 0, domainConflict: 0, lexicalConflict: 0, highConfidenceIssues: 0 })
    }
    sourceStats.get(source).files += 1

    for (let index = 0; index < questions.length; index += 1) {
      const q = questions[index]
      totalQuestions += 1
      sourceStats.get(source).questions += 1

      const kn = q.kn || q.knId || null
      const knExplanation = q.kn_explanation || ''
      const expectedDomain = expectedDomainFromQuestion(file, q)

      let issue = null
      let reason = ''
      let keywordOverlap = 0
      let knDescription = ''

      if (!kn) {
        missingKN += 1
        sourceStats.get(source).missingKN += 1
        issue = 'missing_kn'
        reason = 'Question is missing a KN code.'
      } else if (!kns.has(kn)) {
        invalidKN += 1
        sourceStats.get(source).invalidKN += 1
        issue = 'invalid_kn'
        reason = `KN code ${kn} does not exist in KNs.md.`
      } else {
        const meta = kns.get(kn)
        knDescription = meta.description

        if (!String(knExplanation).trim()) {
          missingKNExplanation += 1
        }

        if (expectedDomain && meta.domain !== expectedDomain) {
          domainConflict += 1
          sourceStats.get(source).domainConflict += 1
        }

        const descTokens = new Set(tokenize(meta.description))
        const bodyTokens = new Set(tokenize([q.stem, q.explanation, q.kn_explanation].filter(Boolean).join(' ')))
        for (const token of descTokens) {
          if (bodyTokens.has(token)) keywordOverlap += 1
        }
        if (descTokens.size > 0 && keywordOverlap === 0) {
          lexicalConflict += 1
          sourceStats.get(source).lexicalConflict += 1
        }

        if ((expectedDomain && meta.domain !== expectedDomain) && keywordOverlap === 0) {
          highConfidenceIssues += 1
          sourceStats.get(source).highConfidenceIssues += 1
          issue = 'high_confidence_kn_mismatch'
          reason = `KN ${kn} belongs to domain ${meta.domain}, but the question metadata points to domain ${expectedDomain}, and its text does not overlap the KN description keywords.`
        } else if (expectedDomain && meta.domain !== expectedDomain) {
          issue = 'domain_conflict'
          reason = `KN ${kn} belongs to domain ${meta.domain}, but the question metadata points to domain ${expectedDomain}.`
        } else if (keywordOverlap === 0) {
          issue = 'lexical_conflict'
          reason = `Question text/KN explanation has no meaningful keyword overlap with the KN ${kn} description.`
        }
      }

      if (!issue && !String(knExplanation).trim()) {
        issue = 'missing_kn_explanation'
        reason = 'Question has a KN code but no KN explanation.'
      }

      if (issue) {
        details.push({
          file: relPath,
          questionIndex: index + 1,
          source,
          kn: kn || null,
          expectedDomain,
          issue,
          keywordOverlap,
          reason,
          stem: q.stem,
          knDescription,
          knExplanation: knExplanation || '',
        })
      }

      const key = relPath
      if (!fileStats.has(key)) {
        fileStats.set(key, { questions: 0, issues: 0, highConfidenceIssues: 0 })
      }
      fileStats.get(key).questions += 1
      if (issue) fileStats.get(key).issues += 1
      if (issue === 'high_confidence_kn_mismatch') fileStats.get(key).highConfidenceIssues += 1
    }
  }

  const topFiles = [...fileStats.entries()]
    .filter(([, stats]) => stats.issues > 0)
    .sort((a, b) => {
      if (b[1].highConfidenceIssues !== a[1].highConfidenceIssues) {
        return b[1].highConfidenceIssues - a[1].highConfidenceIssues
      }
      return b[1].issues - a[1].issues
    })
    .slice(0, 20)

  const summaryLines = [
    '# KN Audit Summary',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    `- Folder audited: \`staging/review\``,
    `- Question files audited: ${files.length}`,
    `- Total questions audited: ${totalQuestions}`,
    '',
    '## Hard Failures',
    '',
    `- Missing \`kn\`: ${missingKN}`,
    `- Invalid \`kn\` values: ${invalidKN}`,
    `- Missing \`kn_explanation\`: ${missingKNExplanation}`,
    '',
    '## Review Flags',
    '',
    `- Domain conflicts (heuristic): ${domainConflict}`,
    `- Lexical conflicts (heuristic): ${lexicalConflict}`,
    `- High-confidence KN mismatches (both heuristics): ${highConfidenceIssues}`,
    '',
    '## By Source',
    '',
    '| Source | Files | Questions | Missing KN | Invalid KN | Domain Conflicts | Lexical Conflicts | High-Confidence Issues |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
  ]

  for (const [source, stats] of [...sourceStats.entries()].sort()) {
    summaryLines.push(
      `| ${source} | ${stats.files} | ${stats.questions} | ${stats.missingKN} | ${stats.invalidKN} | ${stats.domainConflict} | ${stats.lexicalConflict} | ${stats.highConfidenceIssues} |`
    )
  }

  summaryLines.push('', '## Top Files To Review', '')
  summaryLines.push('| File | Questions | Total Issues | High-Confidence Issues |')
  summaryLines.push('|---|---:|---:|---:|')
  for (const [file, stats] of topFiles) {
    summaryLines.push(`| \`${file}\` | ${stats.questions} | ${stats.issues} | ${stats.highConfidenceIssues} |`)
  }

  summaryLines.push(
    '',
    '## Notes',
    '',
    '- `Domain conflicts` are heuristic flags, not guaranteed errors. Some question files mix content from multiple EPPP domains.',
    '- `Lexical conflicts` compare the KN description to the question text plus `kn_explanation`. They are useful for catching obviously wrong KNs, but they can still produce false positives.',
    '- `High-confidence KN mismatches` require both a domain conflict and zero keyword overlap. These are the best first-pass cleanup targets.',
    '',
    `Detailed findings: \`${path.relative(ROOT, DETAILS_PATH)}\``
  )

  ensureDir(REPORT_DIR)
  fs.writeFileSync(SUMMARY_PATH, `${summaryLines.join('\n')}\n`, 'utf8')
  fs.writeFileSync(
    DETAILS_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scope: {
          folder: 'staging/review',
          files: files.length,
          questions: totalQuestions,
        },
        totals: {
          missingKN,
          invalidKN,
          missingKNExplanation,
          domainConflict,
          lexicalConflict,
          highConfidenceIssues,
        },
        topFiles: topFiles.map(([file, stats]) => ({ file, ...stats })),
        details,
      },
      null,
      2
    ),
    'utf8'
  )

  console.log(`Wrote ${path.relative(ROOT, SUMMARY_PATH)}`)
  console.log(`Wrote ${path.relative(ROOT, DETAILS_PATH)}`)
}

main()
