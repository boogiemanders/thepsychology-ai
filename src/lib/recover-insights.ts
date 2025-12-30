import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeOpenAIApiKey } from '@/lib/openai-api-key'

const MODEL_NAME = 'gpt-4o-mini'
const PROMPT_VERSION = 'recover-insight-v1'
const GLOBAL_PREF_ID = 'global'
const DEFAULT_STYLE_PROMPT = [
  'Write as the founder, concise and practical.',
  '1-2 short paragraphs, then 2-3 bullet actions.',
  'No therapy claims, no jargon, no mention of internal metrics.',
  'Warm, encouraging, and specific to the user\'s study patterns.',
].join(' ')

export type RecoverInsightSource = {
  userId: string
  sourceType: 'quiz' | 'exam'
  sourceId?: string | null
  examType?: string | null
  examMode?: string | null
  topic?: string | null
  domain?: string | null
  totalQuestions?: number | null
  correctQuestions?: number | null
  questionAttempts: RecoverQuestionAttempt[]
}

export type RecoverQuestionAttempt = {
  questionId?: string | null
  question?: string | null
  topic?: string | null
  domain?: string | null
  knId?: string | null
  relatedSections?: string[] | null
  difficulty?: string | null
  isCorrect?: boolean | null
  isScored?: boolean | null
  timeSpentMs?: number | null
  visitCount?: number | null
  answerChanges?: number | null
  changedCorrectToWrong?: boolean | null
  changedWrongToCorrect?: boolean | null
  flagged?: boolean | null
  highlightCount?: number | null
  strikethroughCount?: number | null
}

type InsightCluster = {
  label: string
  count: number
  type: 'section' | 'topic' | 'kn'
}

type RecoverInsightData = {
  sourceType: 'quiz' | 'exam'
  sourceMeta: {
    examType?: string | null
    examMode?: string | null
    topic?: string | null
    domain?: string | null
  }
  counts: {
    total: number
    scored: number
    correct: number
    wrong: number
    unanswered: number
  }
  accuracyPercent: number
  timing: {
    medianMs: number | null
    averageMs: number | null
    p90Ms: number | null
    rushedWrongCount: number
    stuckWrongCount: number
  }
  behavior: {
    answerChanges: number
    changeRate: number
    changedCorrectToWrongCount: number
    changedWrongToCorrectCount: number
    revisitRate: number
    flaggedWrongCount: number
  }
  classification: {
    carelessCount: number
    knowledgeGapCount: number
    rushedCount: number
    stuckCount: number
  }
  clusters: InsightCluster[]
}

function readDotenvLocalValue(key: string): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const text = fs.readFileSync(envPath, 'utf8')
    const line = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('#') && l.startsWith(`${key}=`))
    if (!line) return null
    let value = line.slice(key.length + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    return value.trim() || null
  } catch {
    return null
  }
}

function resolveOpenAIApiKey(): string {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY) ?? ''
  if (process.env.NODE_ENV === 'production') return fromProcess

  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY')) ?? ''
  if (fromEnvLocal && fromEnvLocal !== fromProcess) {
    console.warn('[recover-insights] Using OPENAI_API_KEY from .env.local')
    return fromEnvLocal
  }

  return fromProcess || fromEnvLocal
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = resolveOpenAIApiKey()
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }
  return sorted[mid]
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return Math.round(sum / values.length)
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1))
  return sorted[idx]
}

function normalizeAttempts(input: RecoverQuestionAttempt[]): RecoverQuestionAttempt[] {
  return (input || []).map((attempt) => ({
    ...attempt,
    relatedSections: Array.isArray(attempt.relatedSections) ? attempt.relatedSections : null,
  }))
}

function buildClusters(wrongAttempts: RecoverQuestionAttempt[]): InsightCluster[] {
  const counts = new Map<string, { count: number; type: InsightCluster['type'] }>()

  wrongAttempts.forEach((attempt) => {
    const sections = Array.isArray(attempt.relatedSections) ? attempt.relatedSections : []
    if (sections.length > 0) {
      sections.forEach((section) => {
        const label = String(section || '').trim()
        if (!label) return
        const key = `section:${label}`
        const existing = counts.get(key)
        if (existing) {
          existing.count += 1
        } else {
          counts.set(key, { count: 1, type: 'section' })
        }
      })
      return
    }

    if (attempt.topic) {
      const label = String(attempt.topic).trim()
      if (label) {
        const key = `topic:${label}`
        const existing = counts.get(key)
        if (existing) {
          existing.count += 1
        } else {
          counts.set(key, { count: 1, type: 'topic' })
        }
      }
      return
    }

    if (attempt.knId) {
      const label = String(attempt.knId).trim()
      if (label) {
        const key = `kn:${label}`
        const existing = counts.get(key)
        if (existing) {
          existing.count += 1
        } else {
          counts.set(key, { count: 1, type: 'kn' })
        }
      }
    }
  })

  return Array.from(counts.entries())
    .map(([key, info]) => {
      const [, label] = key.split(':')
      return { label, count: info.count, type: info.type }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
}

function buildInsightData(source: RecoverInsightSource): RecoverInsightData {
  const attempts = normalizeAttempts(source.questionAttempts)
  const total = attempts.length
  const scored = attempts.filter((a) => a.isScored !== false)
  const scoredCount = scored.length
  const correctCount = scored.filter((a) => a.isCorrect === true).length
  const wrongAttempts = scored.filter((a) => a.isCorrect === false)
  const wrongCount = wrongAttempts.length
  const unanswered = scored.filter((a) => a.isCorrect !== true && a.isCorrect !== false).length

  const timingValues = attempts
    .map((a) => (typeof a.timeSpentMs === 'number' ? a.timeSpentMs : null))
    .filter((v): v is number => typeof v === 'number' && v > 0)

  const medianMs = median(timingValues)
  const averageMs = average(timingValues)
  const p90Ms = percentile(timingValues, 0.9)

  const rushedWrongCount = wrongAttempts.filter((a) =>
    medianMs && typeof a.timeSpentMs === 'number' && a.timeSpentMs <= medianMs * 0.6
  ).length
  const stuckWrongCount = wrongAttempts.filter((a) =>
    medianMs && typeof a.timeSpentMs === 'number' && a.timeSpentMs >= medianMs * 1.7
  ).length

  const answerChanges = attempts.reduce((sum, a) => sum + (typeof a.answerChanges === 'number' ? a.answerChanges : 0), 0)
  const changedCorrectToWrongCount = attempts.filter((a) => a.changedCorrectToWrong === true).length
  const changedWrongToCorrectCount = attempts.filter((a) => a.changedWrongToCorrect === true).length

  const revisitCount = attempts.filter((a) => (a.visitCount || 0) > 1).length
  const revisitRate = scoredCount > 0 ? Math.round((revisitCount / scoredCount) * 100) : 0

  const flaggedWrongCount = wrongAttempts.filter((a) => a.flagged === true).length

  const carelessCount = wrongAttempts.filter((a) => {
    const timeFlag = medianMs && typeof a.timeSpentMs === 'number' && a.timeSpentMs <= medianMs * 0.6
    const changeFlag = a.changedCorrectToWrong === true
    const noChanges = (a.answerChanges || 0) === 0
    return changeFlag || (timeFlag && noChanges)
  }).length

  const knowledgeGapCount = wrongAttempts.filter((a) => {
    const timeFlag = medianMs && typeof a.timeSpentMs === 'number' && a.timeSpentMs >= medianMs * 1.2
    const changeFlag = (a.answerChanges || 0) >= 2
    return Boolean(timeFlag || changeFlag)
  }).length

  const rushedCount = wrongAttempts.filter((a) => {
    return medianMs && typeof a.timeSpentMs === 'number' && a.timeSpentMs <= medianMs * 0.6
  }).length

  const stuckCount = wrongAttempts.filter((a) => {
    return medianMs && typeof a.timeSpentMs === 'number' && a.timeSpentMs >= medianMs * 1.7
  }).length

  const clusters = buildClusters(wrongAttempts)

  const accuracyPercent = scoredCount > 0 ? Math.round((correctCount / scoredCount) * 100) : 0

  return {
    sourceType: source.sourceType,
    sourceMeta: {
      examType: source.examType ?? null,
      examMode: source.examMode ?? null,
      topic: source.topic ?? null,
      domain: source.domain ?? null,
    },
    counts: {
      total,
      scored: scoredCount,
      correct: correctCount,
      wrong: wrongCount,
      unanswered,
    },
    accuracyPercent,
    timing: {
      medianMs,
      averageMs,
      p90Ms,
      rushedWrongCount,
      stuckWrongCount,
    },
    behavior: {
      answerChanges,
      changeRate: scoredCount > 0 ? Math.round((answerChanges / scoredCount) * 100) : 0,
      changedCorrectToWrongCount,
      changedWrongToCorrectCount,
      revisitRate,
      flaggedWrongCount,
    },
    classification: {
      carelessCount,
      knowledgeGapCount,
      rushedCount,
      stuckCount,
    },
    clusters,
  }
}

async function fetchStylePrompt(supabase: SupabaseClient): Promise<string> {
  try {
    const { data } = await supabase
      .from('recover_insight_preferences')
      .select('style_prompt')
      .eq('id', GLOBAL_PREF_ID)
      .maybeSingle()

    if (data?.style_prompt && String(data.style_prompt).trim()) {
      return String(data.style_prompt).trim()
    }
  } catch (error) {
    console.error('[recover-insights] Failed to fetch style prompt:', error)
  }

  return DEFAULT_STYLE_PROMPT
}

async function fetchStyleExamples(supabase: SupabaseClient): Promise<Array<{ draft: string; approved: string }>> {
  try {
    const { data } = await supabase
      .from('recover_insights')
      .select('draft_message, approved_message')
      .not('approved_message', 'is', null)
      .in('status', ['approved', 'sent'])
      .order('approved_at', { ascending: false })
      .limit(3)

    if (!Array.isArray(data)) return []
    return data
      .map((row: any) => ({
        draft: String(row?.draft_message || '').trim(),
        approved: String(row?.approved_message || '').trim(),
      }))
      .filter((row) => row.draft.length > 0 && row.approved.length > 0)
  } catch (error) {
    console.error('[recover-insights] Failed to fetch style examples:', error)
    return []
  }
}

async function fetchUserContext(supabase: SupabaseClient, userId: string): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('recover_chat_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!Array.isArray(data)) return []

    const userMessages = data
      .filter((row: any) => row?.role === 'user')
      .map((row: any) => String(row?.content || '').trim())
      .filter((content: string) => content.length > 0)
      .slice(0, 6)
      .reverse()

    return userMessages
  } catch (error) {
    console.error('[recover-insights] Failed to fetch Recover transcript:', error)
    return []
  }
}

function formatMs(value: number | null): string {
  if (!value || value <= 0) return 'n/a'
  const seconds = Math.round(value / 1000)
  return `${seconds}s`
}

async function generateDraftMessage(args: {
  insight: RecoverInsightData
  stylePrompt: string
  examples: Array<{ draft: string; approved: string }>
  userContext: string[]
}): Promise<{ message: string; model: string | null }> {
  const openai = getOpenAIClient()
  if (!openai) {
    return { message: '', model: null }
  }

  const { insight, stylePrompt, examples, userContext } = args

  const clusterText = insight.clusters.length
    ? insight.clusters.map((c) => `${c.label} (${c.count})`).join(', ')
    : 'none yet'

  const exampleText = examples.length
    ? examples
        .map(
          (ex, idx) =>
            `Example ${idx + 1}\nDraft: ${ex.draft}\nFounder edit: ${ex.approved}`
        )
        .join('\n\n')
    : 'No prior examples.'

  const transcriptText = userContext.length
    ? userContext.map((line, idx) => `${idx + 1}. ${line}`).join('\n')
    : 'No Recover context available.'

  const userContent = [
    `Insight summary (admin-only):`,
    `- Accuracy: ${insight.accuracyPercent}% (${insight.counts.correct}/${insight.counts.scored})`,
    `- Timing: median ${formatMs(insight.timing.medianMs)}, p90 ${formatMs(insight.timing.p90Ms)}`,
    `- Rushed wrong: ${insight.timing.rushedWrongCount}, Stuck wrong: ${insight.timing.stuckWrongCount}`,
    `- Answer changes: ${insight.behavior.answerChanges}, Correct→wrong: ${insight.behavior.changedCorrectToWrongCount}`,
    `- Careless indicators: ${insight.classification.carelessCount}, Knowledge-gap indicators: ${insight.classification.knowledgeGapCount}`,
    `- Top clusters: ${clusterText}`,
    '',
    'Recover transcript snippets (user voice):',
    transcriptText,
    '',
    'Founder edit examples:',
    exampleText,
  ].join('\n')

  const systemPrompt = [
    'You are drafting a short founder note for a learner.',
    'This is a draft for admin review, but it should be user-ready and supportive.',
    'Do not mention raw metrics or internal analytics.',
    'Keep it under 120 words.',
    stylePrompt,
  ].join(' ')

  const completion = await openai.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.4,
    max_tokens: 350,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  })

  const message = completion.choices[0]?.message?.content?.trim() || ''
  return { message, model: MODEL_NAME }
}

function fallbackMessage(insight: RecoverInsightData): string {
  const focus = insight.clusters[0]?.label
  const focusLine = focus ? `Focus next on ${focus}.` : 'Focus next on your most-missed subtopics.'
  const pacing =
    insight.timing.rushedWrongCount > insight.timing.stuckWrongCount
      ? 'Some misses look rushed, slow down on tough items.'
      : insight.timing.stuckWrongCount > 0
      ? 'Some misses look like getting stuck, use a quick elimination pass then move.'
      : 'Your pacing looks steady, keep the rhythm.'

  return [
    'Quick coach note from the founder:',
    pacing,
    focusLine,
    'Try this next session:',
    '- Do a 5-question warmup, then 2 short review blocks on your weakest cluster.',
    '- If you feel stuck, mark and move, then return with fresh eyes.',
  ].join('\n')
}

export async function createRecoverInsight(
  supabase: SupabaseClient,
  source: RecoverInsightSource
): Promise<void> {
  const insightData = buildInsightData(source)
  const stylePrompt = await fetchStylePrompt(supabase)
  const examples = await fetchStyleExamples(supabase)
  const userContext = await fetchUserContext(supabase, source.userId)

  let draftMessage = ''
  let model: string | null = null

  try {
    const generated = await generateDraftMessage({
      insight: insightData,
      stylePrompt,
      examples,
      userContext,
    })
    draftMessage = generated.message
    model = generated.model
  } catch (error) {
    console.error('[recover-insights] Draft generation failed:', error)
  }

  if (!draftMessage) {
    draftMessage = fallbackMessage(insightData)
  }

  await supabase.from('recover_insights').insert({
    user_id: source.userId,
    source_type: source.sourceType,
    source_id: source.sourceId ?? null,
    status: 'pending',
    insight_data: insightData,
    draft_message: draftMessage,
    model,
    prompt_version: PROMPT_VERSION,
    created_at: new Date().toISOString(),
  })
}
