import fs from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'

const QUESTIONS_ROOT = path.join(process.cwd(), 'questionsGPT')

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_CONCURRENCY = 2
const DEFAULT_MAX_RETRIES = 3

function parseArgs(argv) {
  const args = {
    run: false,
    limit: Infinity,
    concurrency: DEFAULT_CONCURRENCY,
    model: DEFAULT_MODEL,
    maxRetries: DEFAULT_MAX_RETRIES,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--run') args.run = true
    else if (arg === '--dry-run') args.run = false
    else if (arg === '--limit') args.limit = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--concurrency') args.concurrency = Number.parseInt(argv[++i] ?? '', 10)
    else if (arg === '--model') args.model = argv[++i] ?? args.model
    else if (arg === '--max-retries') args.maxRetries = Number.parseInt(argv[++i] ?? '', 10)
  }

  if (!Number.isFinite(args.limit)) args.limit = Infinity
  if (!Number.isFinite(args.concurrency) || args.concurrency <= 0) args.concurrency = DEFAULT_CONCURRENCY
  if (!args.model) args.model = DEFAULT_MODEL
  if (!Number.isFinite(args.maxRetries) || args.maxRetries <= 0) args.maxRetries = DEFAULT_MAX_RETRIES

  return args
}

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
    const text = fs.readFileSync(envPath, 'utf8')
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

function walkJsonFiles(rootDir) {
  const out = []
  const stack = [rootDir]
  while (stack.length > 0) {
    const dir = stack.pop()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) out.push(full)
    }
  }
  out.sort()
  return out
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function coerceAnswerToOption(answerRaw, options) {
  let answer = String(answerRaw || '').trim()
  if (!answer) return answer

  // Common model habit: "B. <option text>"
  answer = answer.replace(/^[A-D](?:\s*[.)-])\s*/i, '').trim()

  // Letter-only answers.
  if (!options.includes(answer)) {
    const letterMatch = answer.match(/^([A-D])(?:[.)])?$/i)
    if (letterMatch) {
      const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65
      return options[idx] ?? answer
    }
  }

  if (options.includes(answer)) return answer

  // Normalized match (e.g., punctuation differences).
  const normalizedAnswer = normalizeText(answer)
  if (!normalizedAnswer) return answer
  const matches = options.filter((opt) => normalizeText(opt) === normalizedAnswer)
  return matches.length === 1 ? matches[0] : answer
}

function countLockInQuestions(questions) {
  return (questions || []).filter((q) => q && (q.is_lock_in_drill === true || q.tags?.includes?.('lock_in_drill'))).length
}

function pickBaseQuestion(questions) {
  const eligible = (questions || []).filter((q) => q && q.is_lock_in_drill !== true)
  const withExplanation = eligible.filter((q) => typeof q.explanation === 'string' && q.explanation.trim().length > 0)
  const mid = withExplanation.find((q) => String(q.difficulty || '').toLowerCase() === 'medium')
  return mid || withExplanation[0] || eligible[0] || null
}

function deriveTopicMetaFromQuestionFilePath(filePath) {
  const normalized = filePath.replace(/\\/g, '/')
  const parts = normalized.split('/')
  const fileName = parts[parts.length - 1] || ''
  const folderName = parts[parts.length - 2] || ''
  const removeExt = (name) => name.replace(/\.[^.]+$/i, '')
  const LEADING_PREFIX_REGEX = /^[\d\s.:,-]+/
  const topicName = removeExt(fileName).replace(LEADING_PREFIX_REGEX, '').trim()
  const domainId = (() => {
    const trimmed = folderName.trim()
    if (!trimmed) return null
    const prefixMatch = trimmed.match(/^(\d+)/)
    if (!prefixMatch) return null
    const prefix = prefixMatch[1]
    if (prefix === '3') {
      if (trimmed.toLowerCase().includes('cultural')) return '3-cultural'
      if (trimmed.toLowerCase().includes('organizational')) return '3-5-6'
      return '3-social'
    }
    if (prefix === '5') {
      if (trimmed.toLowerCase().includes('assessment')) return '5-assessment'
      if (trimmed.toLowerCase().includes('diagnosis')) return '5-diagnosis'
      if (trimmed.toLowerCase().includes('test')) return '5-test'
      return '5-assessment'
    }
    if (['1', '2', '4', '6', '7', '8'].includes(prefix)) return prefix
    return null
  })()
  return { topicName, domainId }
}

function buildPrompt(input) {
  const baseStem = input.baseStem
  const baseOptions = input.baseOptions.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')
  const baseAnswer = input.baseAnswer
  const baseExplanation = input.baseExplanation || ''

  return `You are an expert EPPP tutor and item writer.

Generate exactly TWO "lock-in" near-transfer multiple-choice questions for the SAME underlying concept as the base question.

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "questions": [
    {
      "lock_in_level": "easier",
      "stem": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "...",
      "explanation": "1-3 sentences explaining why the answer is correct",
      "difficulty": "easy",
      "quality_comment": "One sentence about why the question is good"
    },
    {
      "lock_in_level": "harder",
      "stem": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "...",
      "explanation": "1-3 sentences explaining why the answer is correct",
      "difficulty": "hard",
      "quality_comment": "One sentence about why the question is good"
    }
  ]
}

Hard constraints:
- Do NOT copy the base stem or reuse the exact same answer choices.
- Each question must have EXACTLY 4 options.
- The "answer" must match one option EXACTLY (not A/B/C/D).
- Keep the concept tightly aligned to the base question. Near-transfer means different context, same rule/definition.
- Keep it EPPP-style and realistic.

Base question (concept anchor):
Topic: ${input.topicName}
Domain: ${input.domainId || 'unknown'}
Stem: ${baseStem}
Options:
${baseOptions}
Correct answer: ${baseAnswer}
Explanation: ${baseExplanation}
`
}

function validateGeneratedQuestions(content) {
  const parsed = typeof content === 'string' ? JSON.parse(content) : content
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : null
  if (!questions || questions.length !== 2) {
    throw new Error('Model output must include exactly 2 questions.')
  }

  const normalized = questions.map((q) => {
    if (!q || typeof q !== 'object') throw new Error('Invalid question object.')
    const level = String(q.lock_in_level || '').trim().toLowerCase()
    if (!['easier', 'harder'].includes(level)) throw new Error('lock_in_level must be easier or harder.')
    const stem = String(q.stem || '').trim()
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o || '').trim()).filter(Boolean) : []
    let answer = coerceAnswerToOption(q.answer, options)
    const explanation = String(q.explanation || '').trim()
    const difficulty = String(q.difficulty || '').trim().toLowerCase()
    const quality_comment = String(q.quality_comment || '').trim()

    if (!stem) throw new Error('Missing stem.')
    if (options.length !== 4) throw new Error('Options must be length 4.')
    if (!answer) throw new Error('Missing answer.')

    if (!options.includes(answer)) throw new Error('Answer must match one option exactly.')
    if (!explanation) throw new Error('Missing explanation.')
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('difficulty must be easy|medium|hard.')

    return {
      lock_in_level: level,
      stem,
      options,
      answer,
      explanation,
      difficulty,
      quality_comment: quality_comment || undefined,
    }
  })

  const levels = new Set(normalized.map((q) => q.lock_in_level))
  if (levels.size !== 2) throw new Error('Must include one easier and one harder.')
  return normalized
}

async function generateLockInQuestionsWithRetries(openai, args, context) {
  let lastError = null

  for (let attempt = 1; attempt <= args.maxRetries; attempt++) {
    try {
      const prompt = buildPrompt(context)
      const completion = await openai.chat.completions.create({
        model: args.model,
        temperature: attempt === 1 ? 0.4 : 0.2,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You create high-quality EPPP multiple choice questions and always return strict JSON.',
          },
          { role: 'user', content: prompt },
        ],
      })

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Empty model response.')
      return validateGeneratedQuestions(content)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('Failed to generate lock-in questions.')
}

function queueWithConcurrency(items, concurrency, worker) {
  const results = []
  let nextIndex = 0

  async function runOne() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await worker(items[index], index)
    }
  }

  const runners = Array.from({ length: concurrency }, () => runOne())
  return Promise.all(runners).then(() => results)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const files = walkJsonFiles(QUESTIONS_ROOT).slice(0, args.limit)

  const toUpdate = []
  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : null
      if (!questions) continue
      if (countLockInQuestions(questions) >= 2) continue
      toUpdate.push(filePath)
    } catch {
      // ignore scan errors; we'll report during run
    }
  }

  console.log(`[lock-in-question-bank] Files scanned: ${files.length}`)
  console.log(`[lock-in-question-bank] Need lock-in questions: ${toUpdate.length}`)

  if (!args.run) {
    console.log('[lock-in-question-bank] Dry run. Re-run with --run to generate + write.')
    return
  }

  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    console.error('[lock-in-question-bank] Missing OPENAI_API_KEY (set env var or .env.local).')
    process.exitCode = 1
    return
  }

  const openai = new OpenAI({ apiKey })
  console.log(`[lock-in-question-bank] Mode: RUN | model=${args.model} | concurrency=${args.concurrency} | maxRetries=${args.maxRetries}`)

  let updatedCount = 0
  let skippedCount = 0
  let failedCount = 0

  await queueWithConcurrency(toUpdate, args.concurrency, async (filePath) => {
    const rel = path.relative(process.cwd(), filePath)
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : null
      if (!questions) {
        console.warn(`[lock-in-question-bank] Skip (no questions array): ${rel}`)
        skippedCount++
        return
      }

      const existingLock = countLockInQuestions(questions)
      if (existingLock >= 2) {
        skippedCount++
        return
      }

      const base = pickBaseQuestion(questions)
      if (!base) {
        console.warn(`[lock-in-question-bank] Skip (no base question): ${rel}`)
        skippedCount++
        return
      }

      const stem = String(base.stem ?? base.question ?? '').trim()
      const options = Array.isArray(base.options) ? base.options.map((o) => String(o || '').trim()).filter(Boolean) : []
      const answer = String(base.answer ?? base.correct_answer ?? '').trim()
      if (!stem || options.length < 2 || !answer) {
        console.warn(`[lock-in-question-bank] Skip (invalid base question): ${rel}`)
        skippedCount++
        return
      }

      const { topicName, domainId } = deriveTopicMetaFromQuestionFilePath(filePath)

      const generated = await generateLockInQuestionsWithRetries(openai, args, {
        topicName,
        domainId,
        baseStem: stem,
        baseOptions: options.slice(0, 4),
        baseAnswer: answer,
        baseExplanation: typeof base.explanation === 'string' ? base.explanation.trim() : '',
        baseKn: typeof base.kn === 'string' ? base.kn.trim() : '',
        baseKnExplanation: typeof base.kn_explanation === 'string' ? base.kn_explanation.trim() : '',
      })

      const baseKn = typeof base.kn === 'string' ? base.kn.trim() : ''
      const baseKnExplanation = typeof base.kn_explanation === 'string' ? base.kn_explanation.trim() : ''
      const normalizedKn = /^KN\d{1,3}$/i.test(baseKn) ? baseKn : null

      const existingNormalized = new Set(questions.map((q) => normalizeText(q?.stem ?? q?.question ?? '')))
      const additions = []

      for (const q of generated) {
        const norm = normalizeText(q.stem)
        if (!norm || existingNormalized.has(norm)) continue
        existingNormalized.add(norm)
        additions.push({
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          kn: normalizedKn ?? undefined,
          kn_explanation: baseKnExplanation || undefined,
          quality_comment: q.quality_comment,
          is_lock_in_drill: true,
          lock_in_level: q.lock_in_level,
          tags: ['lock_in_drill'],
        })
      }

      if (additions.length < 2) {
        throw new Error('Failed to produce 2 unique questions.')
      }

      parsed.questions = [...questions, ...additions.slice(0, 2)]
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf8')

      updatedCount++
      console.log(`[lock-in-question-bank] +2 lock-in questions: ${rel}`)
    } catch (error) {
      failedCount++
      console.warn(`[lock-in-question-bank] Failed: ${rel}`)
      console.warn(error instanceof Error ? error.message : String(error))
    }
  })

  console.log('[lock-in-question-bank] Done.')
  console.log(`[lock-in-question-bank] Updated: ${updatedCount} | Skipped: ${skippedCount} | Failed: ${failedCount}`)
  if (failedCount > 0) process.exitCode = 1
}

await main()
