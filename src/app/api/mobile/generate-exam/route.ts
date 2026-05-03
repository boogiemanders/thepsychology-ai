import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireMobileAuth } from '@/lib/server/mobile-auth'
import { getServerSubscriptionStatus } from '@/lib/subscription-server'
import { getSupabaseClient } from '@/lib/supabase-server'

type ExamType = 'diagnostic' | 'practice'

interface ServerQuestion {
  id?: number | string
  question?: string
  stem?: string
  options?: string[]
  answer?: string
  correct_answer?: string
  explanation?: string
  domain?: string | number
  difficulty?: string
}

interface IOSChoice {
  id: string
  label: string
  text: string
}

interface IOSQuestion {
  id: string
  stem: string
  choices: IOSChoice[]
  correctChoiceId: string
  explanation: string
  domain: string
  subdomain: string | null
  difficulty: 'easy' | 'medium' | 'hard'
}

interface IOSExam {
  id: string
  slug: string
  title: string
  domain: string
  questions: IOSQuestion[]
  timeLimitMinutes: number | null
  updatedAt: string
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null
  return items[Math.floor(Math.random() * items.length)]
}

function listJsonFiles(dir: string, prefix: string, exclude?: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .filter((name) => name.startsWith(prefix))
    .filter((name) => !exclude || !name.startsWith(exclude))
}

function loadQuestionsFromFile(dir: string, fileName: string): ServerQuestion[] | null {
  try {
    const raw = readFileSync(join(dir, fileName), 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.questions) ? parsed.questions : null
  } catch {
    return null
  }
}

interface SelectedFile {
  dir: string
  fileName: string
}

// Files most-recently assigned first
async function getSeenExamFiles(
  supabase: SupabaseClient,
  userId: string,
  examType: ExamType
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_exam_assignments')
    .select('exam_file, assigned_at')
    .eq('user_id', userId)
    .eq('exam_type', examType)
    .order('assigned_at', { ascending: false })

  if (error) {
    console.warn('[mobile/generate-exam] Failed to load assignments:', error)
    return []
  }
  return (data || []).map((row: any) => row.exam_file)
}

async function recordExamAssignment(
  supabase: SupabaseClient,
  userId: string,
  examType: ExamType,
  examFile: string
): Promise<void> {
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('user_exam_assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('exam_file', examFile)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('user_exam_assignments')
      .update({ assigned_at: now })
      .eq('id', existing.id)
    if (error) console.warn('[mobile/generate-exam] Failed to update assignment:', error)
    return
  }

  const { error } = await supabase
    .from('user_exam_assignments')
    .insert({ user_id: userId, exam_type: examType, exam_file: examFile, assigned_at: now })
  if (error) console.warn('[mobile/generate-exam] Failed to insert assignment:', error)
}

const RECENT_REPEAT_GUARD = 3

// seenFiles is ordered most-recent first
function selectExamFile(
  dir: string,
  prefix: string,
  exclude: string | undefined,
  seenFiles: string[]
): SelectedFile | null {
  const files = listJsonFiles(dir, prefix, exclude)
  if (files.length === 0) return null

  const seenSet = new Set(seenFiles)
  const unseen = files.filter((f) => !seenSet.has(f))

  let pool: string[]
  if (unseen.length > 0) {
    pool = unseen
  } else {
    // All exams have been seen — exclude the most recent few so users don't
    // get the same exam they just took. If there aren't enough files to do
    // that (e.g. only 1-2 files exist total), fall back to the full pool.
    const recentSet = new Set(seenFiles.slice(0, RECENT_REPEAT_GUARD))
    const filtered = files.filter((f) => !recentSet.has(f))
    pool = filtered.length > 0 ? filtered : files
  }

  const chosen = pickRandom(pool)
  if (!chosen) return null
  return { dir, fileName: chosen }
}

function normalizeDifficulty(raw: unknown): 'easy' | 'medium' | 'hard' {
  if (raw === 'easy' || raw === 'medium' || raw === 'hard') return raw
  return 'medium'
}

function normalizeDomain(raw: unknown): string {
  if (typeof raw === 'number') return `Domain ${raw}`
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return /^\d+$/.test(raw) ? `Domain ${raw}` : raw
  }
  return 'Domain 1'
}

function convertQuestion(q: ServerQuestion, index: number): IOSQuestion | null {
  const stem = q.stem ?? q.question ?? ''
  const options = Array.isArray(q.options) ? q.options : []
  if (!stem || options.length !== 4) return null

  const correctText = q.answer ?? q.correct_answer ?? ''
  const questionId = `q${q.id ?? index + 1}_${randomUUID().slice(0, 8)}`

  const letters = ['A', 'B', 'C', 'D']
  const choices: IOSChoice[] = options.map((text, i) => ({
    id: `${questionId}_${letters[i].toLowerCase()}`,
    label: letters[i],
    text: String(text ?? ''),
  }))

  // Match correct answer by text; tolerate leading letter prefix like "A. Foo"
  const stripPrefix = (t: string) => t.replace(/^[A-D]\.\s*/i, '').trim()
  const target = stripPrefix(correctText)
  let correctChoice =
    choices.find((c) => stripPrefix(c.text) === target) ??
    choices.find((c) => stripPrefix(c.text).toLowerCase() === target.toLowerCase()) ??
    choices.find((c) => /^[A-D]$/i.test(correctText) && c.label === correctText.toUpperCase())
  if (!correctChoice) correctChoice = choices[0]

  return {
    id: questionId,
    stem,
    choices,
    correctChoiceId: correctChoice.id,
    explanation: q.explanation ?? '',
    domain: normalizeDomain(q.domain),
    subdomain: null,
    difficulty: normalizeDifficulty(q.difficulty),
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildExam(examType: ExamType, questions: ServerQuestion[]): IOSExam {
  const converted = questions
    .map((q, i) => convertQuestion(q, i))
    .filter((q): q is IOSQuestion => q !== null)

  const shuffled = shuffle(converted)
  const id = randomUUID()

  return {
    id,
    slug: `generated-${examType}-${id}`,
    title: examType === 'diagnostic' ? 'Diagnostic Exam' : 'Practice Exam',
    domain: 'All Domains',
    questions: shuffled,
    timeLimitMinutes: null,
    updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json().catch(() => ({}))
    const examType = (body?.examType === 'practice' ? 'practice' : 'diagnostic') as ExamType

    const status = await getServerSubscriptionStatus(auth.userId)
    const isPro = status?.hasAccess === true

    if (examType === 'practice' && !isPro) {
      return NextResponse.json(
        { error: 'Practice exams are part of the Pro plan. Upgrade to unlock the full 225-question simulation.' },
        { status: 403 }
      )
    }

    const cwd = process.cwd()
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    const seenFiles = supabase
      ? await getSeenExamFiles(supabase, auth.userId, examType)
      : []

    let selected: SelectedFile | null = null

    if (examType === 'diagnostic') {
      const freeDir = join(cwd, 'free-examsGPT')
      if (isPro) {
        selected = selectExamFile(freeDir, 'diagnostic-exam-', 'diagnostic-exam-short-', seenFiles)
      }
      if (!selected) {
        selected = selectExamFile(freeDir, 'diagnostic-exam-short-', undefined, seenFiles)
      }
    } else {
      const proDir = join(cwd, 'examsGPT')
      selected = selectExamFile(proDir, 'practice-exam-', undefined, seenFiles)
    }

    const questions = selected ? loadQuestionsFromFile(selected.dir, selected.fileName) : null

    if (!selected || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No exam content available. Please try again later.' },
        { status: 503 }
      )
    }

    if (supabase) {
      await recordExamAssignment(supabase, auth.userId, examType, selected.fileName)
    }

    const exam = buildExam(examType, questions)
    return NextResponse.json(exam)
  } catch (error) {
    console.error('[mobile/generate-exam] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate exam' },
      { status: 500 }
    )
  }
}
