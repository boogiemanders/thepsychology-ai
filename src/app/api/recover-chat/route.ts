import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { isNotificationEmailConfigured, sendNotificationEmail } from '@/lib/notify-email'
import { sendSlackNotification } from '@/lib/notify-slack'
import { INITIAL_RECOVER_ASSISTANT_MESSAGE } from '@/lib/recover'
import fs from 'node:fs'
import path from 'node:path'
import { sanitizeOpenAIApiKey } from '@/lib/openai-api-key'
import { logUsageEvent } from '@/lib/usage-events'
import { SupabaseClient } from '@supabase/supabase-js'
import { EPPP_DOMAINS } from '@/lib/eppp-data'

export const runtime = 'nodejs'

// Types for user progress context
type DomainProgress = {
  domain_name: string
  mastery_level: number
  questions_answered: number
}

type ExamHistoryEntry = {
  score: number
  total_questions: number
  correct_answers: number
  exam_type: string
  created_at: string
}

type UserProgressContext = {
  progress: DomainProgress[] | null
  exams: ExamHistoryEntry[] | null
  examCount: number
  lessonCount: number
  questionsAnswered: number
  priorityDomains: Array<{
    domainNumber: number | null
    domainName: string
    priorityScore: number | null
    percentageWrong: number | null
  }>
  studyBehavior: 'passive' | 'active' | 'balanced' | null
}

function normalizePriorityDomains(raw: unknown): UserProgressContext['priorityDomains'] {
  if (!Array.isArray(raw)) return []

  return raw
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const row = item as Record<string, unknown>

      const domainNumberRaw = row.domainNumber ?? row.domain_number
      const domainNameRaw = row.domainName ?? row.domain_name
      const priorityScoreRaw = row.priorityScore ?? row.priority_score
      const percentageWrongRaw = row.percentageWrong ?? row.percentage_wrong

      const domainName = typeof domainNameRaw === 'string' ? domainNameRaw.trim() : ''
      if (!domainName) return []

      return [
        {
          domainNumber:
            typeof domainNumberRaw === 'number' && Number.isFinite(domainNumberRaw)
              ? domainNumberRaw
              : null,
          domainName,
          priorityScore: typeof priorityScoreRaw === 'number' ? priorityScoreRaw : null,
          percentageWrong: typeof percentageWrongRaw === 'number' ? percentageWrongRaw : null,
        },
      ]
    })
    .slice(0, 3)
}

function isStudyRecommendationRequest(text: string): boolean {
  const normalized = text.toLowerCase()
  return (
    /\b(recommend|recommendation|prioritize|priority)\b/.test(normalized) ||
    /\b(order|sequence)\b/.test(normalized) ||
    /\bwhat should i study\b/.test(normalized) ||
    /\bwhat do i study next\b/.test(normalized) ||
    /\bwhich (domain|topic|area)\b/.test(normalized) ||
    /\bwhere should i start\b/.test(normalized) ||
    /\bwhat next\b/.test(normalized)
  )
}

type QuizTopicMatch = {
  topicName: string
  domainId: string | null
  source: 'catalog' | 'custom'
}

type RecoverMessage = {
  role: 'user' | 'assistant'
  content: string
}

function normalizeIntentText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[&]/g, ' and ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const QUIZ_TOPIC_CATALOG = EPPP_DOMAINS.flatMap((domain) =>
  domain.topics
    .map((topic) => {
      const topicName = topic.name.trim()
      const normalized = normalizeIntentText(topicName)
      if (!topicName || !normalized) return null
      return { topicName, domainId: domain.id, normalized }
    })
    .filter((item): item is { topicName: string; domainId: string; normalized: string } => item !== null)
).sort((a, b) => b.normalized.length - a.normalized.length)

function isQuizNavigationRequest(text: string): boolean {
  const normalized = normalizeIntentText(text)
  if (!normalized) return false
  const hasQuizWord = /\bquiz\b/.test(normalized) || /\bquestions?\b/.test(normalized)
  if (!hasQuizWord) return false

  return (
    /\b(where|start|open|link|send|do|take|want|lets|let|can|quick|give|make|create|generate|build|write|practice|test|five|5)\b/.test(normalized) ||
    normalized === 'quiz'
  )
}

function getPreviousAssistantMessage(messages: RecoverMessage[]): string | null {
  for (let idx = messages.length - 2; idx >= 0; idx -= 1) {
    const message = messages[idx]
    if (message.role === 'assistant') return message.content
  }
  return null
}

function isAffirmativeReply(text: string): boolean {
  const normalized = normalizeIntentText(text)
  if (!normalized) return false
  return /^(yes|yeah|yep|yup|sure|ok|okay|please|do it|sounds good|let s do it|lets do it)$/.test(normalized)
}

function isQuizOfferFromAssistant(text: string): boolean {
  const normalized = normalizeIntentText(text)
  if (!normalized) return false
  const mentionsQuiz = /\b(quiz|questions?)\b/.test(normalized)
  const soundsLikeOffer = /\b(would|want|like|ready|should|can|quick|take|do|try)\b/.test(normalized)
  return mentionsQuiz && soundsLikeOffer
}

function isAffirmativeQuizFollowUp(messages: RecoverMessage[], lastUserMessage: string): boolean {
  if (!isAffirmativeReply(lastUserMessage)) return false
  const previousAssistant = getPreviousAssistantMessage(messages)
  if (!previousAssistant) return false
  return isQuizOfferFromAssistant(previousAssistant)
}

function isAwaitingQuizTopic(messages: RecoverMessage[]): boolean {
  const latestAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content
  if (!latestAssistant) return false
  const normalized = normalizeIntentText(latestAssistant)
  return normalized.includes('which topic do you want the quiz on')
}

function matchCatalogTopic(text: string): QuizTopicMatch | null {
  const normalizedText = normalizeIntentText(text)
  if (!normalizedText) return null

  for (const candidate of QUIZ_TOPIC_CATALOG) {
    const pattern = new RegExp(`\\b${escapeRegex(candidate.normalized).replace(/\s+/g, '\\s+')}\\b`)
    if (pattern.test(normalizedText)) {
      return {
        topicName: candidate.topicName,
        domainId: candidate.domainId,
        source: 'catalog',
      }
    }
  }

  return null
}

function cleanTopicCandidate(raw: string): string {
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/\b(?:please|thanks|thank you|lol)\b/gi, '')
    .replace(/[.?!,:;]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isCustomTopicUsable(candidate: string): boolean {
  if (!candidate) return false
  const normalized = normalizeIntentText(candidate)
  if (!normalized || normalized.length < 3) return false
  if (normalized.split(' ').length > 10) return false
  if (/\bbig\s*6\b|\bbig six\b/.test(normalized)) return false
  if (/\b(i don t know|idk|not sure|you choose|your choice|anything|whatever|surprise me)\b/.test(normalized)) return false
  if (/^(ok|okay|yes|yep|sure|no|nah|later|stop|cancel|topic|quiz|questions?)$/.test(normalized)) return false
  return true
}

function extractCustomTopic(text: string, allowLooseReply = false): QuizTopicMatch | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const patterns: RegExp[] = [
    /\b(?:quiz|questions?)\s+(?:on|about|for)\s+(.+)$/i,
    /\b(?:on|about|for)\s+(.+?)\s+(?:quiz|questions?)\b/i,
    /\btopic\s*[:\-]\s*(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (!match?.[1]) continue
    const candidate = cleanTopicCandidate(match[1])
    if (!isCustomTopicUsable(candidate)) continue
    return {
      topicName: candidate,
      domainId: null,
      source: 'custom',
    }
  }

  if (allowLooseReply) {
    const segmentedCandidates = trimmed
      .split(/[,|\n]/)
      .flatMap((part) => part.split(/\band\b/i))
      .map((segment) => cleanTopicCandidate(segment))
      .filter(Boolean)

    for (const segmentedCandidate of segmentedCandidates) {
      if (!isCustomTopicUsable(segmentedCandidate)) continue
      return {
        topicName: segmentedCandidate,
        domainId: null,
        source: 'custom',
      }
    }

    const candidate = cleanTopicCandidate(trimmed)
    if (isCustomTopicUsable(candidate)) {
      return {
        topicName: candidate,
        domainId: null,
        source: 'custom',
      }
    }
  }

  return null
}

function resolveRequestedQuizTopic(messages: RecoverMessage[], allowLooseReply: boolean): QuizTopicMatch | null {
  const userMessages = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .reverse()

  for (let idx = 0; idx < userMessages.length; idx += 1) {
    const message = userMessages[idx]
    const shouldInspect = idx === 0 || isQuizNavigationRequest(message) || /\btopic\b/i.test(message)
    if (!shouldInspect) continue

    const catalogMatch = matchCatalogTopic(message)
    if (catalogMatch) return catalogMatch

    const customMatch = extractCustomTopic(message, allowLooseReply && idx === 0)
    if (customMatch) return customMatch
  }

  return null
}

function buildPriorityOrderText(userContext?: UserProgressContext): string | null {
  if (!userContext || userContext.priorityDomains.length === 0) return null

  const lines = userContext.priorityDomains.map((domain, index) => `${index + 1}. ${domain.domainName}`)
  if (lines.length === 0) return null

  return `If you want my recommendation, start with:\n${lines.join('\n')}`
}

function parseRequestedQuestionCount(text: string): number | null {
  const normalized = normalizeIntentText(text)
  if (!normalized || !/\bquestions?\b/.test(normalized)) return null

  const numericBeforeQuestions = normalized.match(/\b(\d{1,2})\s+questions?\b/)
  if (numericBeforeQuestions) {
    const count = Number.parseInt(numericBeforeQuestions[1], 10)
    if (Number.isFinite(count) && count > 0 && count <= 50) return count
  }

  const WORD_TO_COUNT: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  }

  for (const [word, count] of Object.entries(WORD_TO_COUNT)) {
    const pattern = new RegExp(`\\b${word}\\s+questions?\\b`)
    if (pattern.test(normalized)) return count
  }

  return null
}

function resolveRequestedQuestionCount(
  messages: RecoverMessage[],
  lastUserMessage: string,
  awaitingTopic: boolean
): number | null {
  const fromLastMessage = parseRequestedQuestionCount(lastUserMessage)
  if (fromLastMessage !== null) return fromLastMessage
  if (!awaitingTopic) return null

  const previousUserMessages = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .reverse()
    .slice(1)

  for (const message of previousUserMessages) {
    if (!isQuizNavigationRequest(message)) continue
    const count = parseRequestedQuestionCount(message)
    if (count !== null) return count
  }

  return null
}

function buildQuizRoutingReply(input: {
  messages: RecoverMessage[]
  lastUserMessage: string
  userContext?: UserProgressContext
}): string | null {
  const { messages, lastUserMessage, userContext } = input
  const awaitingTopic = isAwaitingQuizTopic(messages)
  const isQuizRequest = isQuizNavigationRequest(lastUserMessage) || isAffirmativeQuizFollowUp(messages, lastUserMessage)
  if (!isQuizRequest && !awaitingTopic) return null

  const requestedQuestionCount = resolveRequestedQuestionCount(messages, lastUserMessage, awaitingTopic)

  const requestedTopic = resolveRequestedQuizTopic(messages, awaitingTopic)

  if (requestedTopic) {
    const quizHref = `/quizzer?topic=${encodeURIComponent(requestedTopic.topicName)}${
      requestedTopic.domainId ? `&domain=${encodeURIComponent(requestedTopic.domainId)}` : ''
    }`

    const lines: string[] = [
      `Start here: [Open quiz for ${requestedTopic.topicName}](${quizHref})`,
      'Need a different topic? Use [Topic Selector](/topic-selector).',
    ]

    if (requestedQuestionCount !== null && requestedQuestionCount !== 10) {
      lines.push(
        `Quick note: you asked for ${requestedQuestionCount} questions, but Quizzer currently runs 10 questions (8 scored + 2 experimental). Recover chat cannot create custom ${requestedQuestionCount}-question sets yet.`
      )
    }

    if (requestedTopic.source === 'custom') {
      lines.push('If we have matching local question-bank content, Quizzer uses it first, then falls back to generation.')
    }

    return lines.join('\n\n')
  }

  const lines: string[] = ['Which topic do you want the quiz on?']

  if (requestedQuestionCount !== null && requestedQuestionCount !== 10) {
    lines.push(
      `Quick note: you asked for ${requestedQuestionCount} questions, but Quizzer currently runs 10 questions (8 scored + 2 experimental). Recover chat cannot create custom ${requestedQuestionCount}-question sets yet.`
    )
  }

  const priorityOrderText = buildPriorityOrderText(userContext)
  if (priorityOrderText) {
    lines.push(priorityOrderText)
  }

  lines.push(
    'Pick one in [Topic Selector](/topic-selector), or type a custom topic and I will open a quiz for it.'
  )

  return lines.join('\n\n')
}

type TimedTopicSuggestion = {
  domainId: string
  topicName: string
  durationSeconds: number
}

function isTimedTopicRequest(text: string): boolean {
  const normalized = normalizeIntentText(text)
  if (!normalized) return false
  const hasTopicWords = /\b(topic|topics|lesson|lessons|study)\b/.test(normalized)
  const hasTimeWords = /\b(minute|min|seconds|second|under|less than|short)\b/.test(normalized)
  return hasTopicWords && hasTimeWords
}

function parsePreferredDurationSeconds(text: string): number | null {
  const normalized = normalizeIntentText(text)
  if (!normalized) return null

  const minuteMatch = normalized.match(/(\d+)\s*(?:minutes?|mins?|min)\b/)
  const secondMatch = normalized.match(/(\d+)\s*(?:seconds?|secs?|sec)\b/)

  if (!minuteMatch && !secondMatch) return null

  const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0
  const seconds = secondMatch ? Number.parseInt(secondMatch[1], 10) : 0

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
  const total = minutes * 60 + seconds
  return total > 0 ? total : null
}

function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function mapPriorityDomainToDomainIds(priorityDomain: UserProgressContext['priorityDomains'][number]): string[] {
  if (priorityDomain.domainNumber != null) {
    switch (priorityDomain.domainNumber) {
      case 1:
        return ['1']
      case 2:
        return ['2']
      case 3:
        return ['3-social', '3-cultural']
      case 4:
        return ['4']
      case 5:
        return ['5-diagnosis', '5-assessment', '5-test']
      case 6:
        return ['6']
      case 7:
        return ['7']
      case 8:
        return ['8']
      default:
        break
    }
  }

  const normalized = normalizeIntentText(priorityDomain.domainName)
  if (normalized.includes('biolog')) return ['1']
  if (normalized.includes('cognitive') || normalized.includes('learning') || normalized.includes('memory')) return ['2']
  if (normalized.includes('social') || normalized.includes('cultural')) return ['3-social', '3-cultural']
  if (normalized.includes('growth') || normalized.includes('lifespan') || normalized.includes('development')) return ['4']
  if (normalized.includes('assessment') || normalized.includes('diagnos') || normalized.includes('psychopath')) {
    return ['5-diagnosis', '5-assessment', '5-test']
  }
  if (normalized.includes('treatment') || normalized.includes('intervention') || normalized.includes('clinical')) {
    return ['6']
  }
  if (normalized.includes('research') || normalized.includes('stat')) return ['7']
  if (normalized.includes('ethic') || normalized.includes('legal') || normalized.includes('professional')) return ['8']
  if (normalized.includes('org') || normalized.includes('io') || normalized.includes('industrial')) return ['3-5-6']

  return []
}

function buildTimedTopicCandidates(userContext?: UserProgressContext): Array<{ domainId: string; topicName: string }> {
  const candidates: Array<{ domainId: string; topicName: string }> = []
  const seen = new Set<string>()

  const addCandidate = (domainId: string, topicName: string) => {
    const key = `${domainId}::${topicName.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    candidates.push({ domainId, topicName })
  }

  if (userContext && userContext.priorityDomains.length > 0) {
    for (const priorityDomain of userContext.priorityDomains) {
      const domainIds = mapPriorityDomainToDomainIds(priorityDomain)
      for (const domainId of domainIds) {
        const domain = EPPP_DOMAINS.find((d) => d.id === domainId)
        if (!domain) continue
        domain.topics.slice(0, 3).forEach((topic) => addCandidate(domainId, topic.name))
      }
    }
  }

  if (candidates.length === 0) {
    ;['1', '2', '4', '6', '7', '8'].forEach((domainId) => {
      const domain = EPPP_DOMAINS.find((d) => d.id === domainId)
      if (!domain) return
      domain.topics.slice(0, 2).forEach((topic) => addCandidate(domainId, topic.name))
    })
  }

  return candidates.slice(0, 12)
}

function getRequestBaseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (host) {
    const proto =
      request.headers.get('x-forwarded-proto') ||
      (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')

    return `${proto}://${host}`
  }

  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  return 'http://localhost:3000'
}

async function fetchLessonDurationSeconds(
  request: NextRequest,
  domainId: string,
  topicName: string
): Promise<number | null> {
  try {
    const baseUrl = getRequestBaseUrl(request)
    const url = new URL('/api/topic-teacher/lesson-manifest', baseUrl)
    url.searchParams.set('domain', domainId)
    url.searchParams.set('topic', topicName)

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
    })
    if (!response.ok) return null

    const data = (await response.json()) as { totalDuration?: unknown }
    if (typeof data.totalDuration !== 'number' || !Number.isFinite(data.totalDuration)) return null
    if (data.totalDuration <= 0) return null

    return Math.round(data.totalDuration)
  } catch {
    return null
  }
}

async function findTimedTopicSuggestions(input: {
  request: NextRequest
  userContext?: UserProgressContext
  maxSeconds: number
}): Promise<TimedTopicSuggestion[]> {
  const { request, userContext, maxSeconds } = input
  const candidates = buildTimedTopicCandidates(userContext)
  if (candidates.length === 0) return []

  const durations = await Promise.all(
    candidates.map(async (candidate) => {
      const durationSeconds = await fetchLessonDurationSeconds(request, candidate.domainId, candidate.topicName)
      if (!durationSeconds) return null
      if (durationSeconds > maxSeconds) return null
      return { ...candidate, durationSeconds } satisfies TimedTopicSuggestion
    })
  )

  return durations
    .filter((item): item is TimedTopicSuggestion => item !== null)
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .slice(0, 3)
}

async function buildTimedTopicReply(input: {
  request: NextRequest
  messages: RecoverMessage[]
  lastUserMessage: string
  userContext?: UserProgressContext
}): Promise<string | null> {
  const { request, messages, lastUserMessage, userContext } = input
  if (!isTimedTopicRequest(lastUserMessage)) return null

  const preferredSeconds = parsePreferredDurationSeconds(lastUserMessage) ?? 15 * 60
  const suggestions = await findTimedTopicSuggestions({
    request,
    userContext,
    maxSeconds: preferredSeconds,
  })

  const lines: string[] = [
    'Use **Study** in the top menu to pick a topic. For question practice, use [Quizzer](/quizzer).',
  ]

  if (suggestions.length > 0) {
    lines.push(`These should fit ${formatMinutesSeconds(preferredSeconds)} or less:`)
    suggestions.forEach((topic) => {
      const href = `/topic-teacher?domain=${encodeURIComponent(topic.domainId)}&topic=${encodeURIComponent(topic.topicName)}`
      lines.push(`- [${topic.topicName}](${href}) (${formatMinutesSeconds(topic.durationSeconds)})`)
    })
    return lines.join('\n\n')
  }

  const requestedTopic = resolveRequestedQuizTopic(messages, true)
  const fallbackTopic = requestedTopic || resolveRequestedQuizTopic(messages.slice(0, -1), true)
  const quickQuizTopic = fallbackTopic?.topicName || 'Memory'
  const quickQuizDomain = fallbackTopic?.domainId || '2'
  const quizHref = `/quizzer?topic=${encodeURIComponent(quickQuizTopic)}&domain=${encodeURIComponent(quickQuizDomain)}`

  lines.push(
    `I could not find a prioritized lesson under ${formatMinutesSeconds(preferredSeconds)} right now.`,
    `Fast fallback: [Open a quiz now](${quizHref}). Quizzer uses local question-bank files first when available.`
  )

  return lines.join('\n\n')
}

async function getSessionElapsedSeconds(
  supabase: ReturnType<typeof getSupabaseClient>,
  sessionId: string
): Promise<number | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('recover_chat_sessions')
      .select('created_at')
      .eq('id', sessionId)
      .maybeSingle()

    if (error || !data?.created_at) return null
    const createdAtMs = new Date(data.created_at).getTime()
    if (!Number.isFinite(createdAtMs)) return null

    return Math.max(0, Math.floor((Date.now() - createdAtMs) / 1000))
  } catch {
    return null
  }
}

function buildFiveMinuteRedirectReply(): string {
  return [
    'We have been chatting for 5+ minutes. To save your momentum and API tokens, jump back into active work now.',
    '- [Study](/topic-selector)',
    '- [Practice](/exam-generator)',
    'After you do one focused block, come back and I will help you adjust the next step.',
  ].join('\n')
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

function resolveOpenAIApiKey(): string {
  const fromProcess = sanitizeOpenAIApiKey(process.env.OPENAI_API_KEY) ?? ''
  if (process.env.NODE_ENV === 'production') return fromProcess

  const fromEnvLocal = sanitizeOpenAIApiKey(readDotenvLocalValue('OPENAI_API_KEY')) ?? ''
  if (fromEnvLocal && fromEnvLocal !== fromProcess) {
    console.warn(
      '[recover-chat] Detected differing OPENAI_API_KEY values; using .env.local value (shell env vars override .env.local).'
    )
    return fromEnvLocal
  }

  return fromProcess || fromEnvLocal
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = resolveOpenAIApiKey()
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function getSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

type RecoverChunkMatch = {
  id: string
  document_id: string
  document_title: string | null
  document_apa_citation?: string | null
  storage_path: string | null
  content: string
  similarity: number
}

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(12_000),
})

const BodySchema = z.object({
  messages: z.array(MessageSchema).optional(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  userEmail: z.string().email().nullable().optional(),
})

const RECOVER_ALERT_MODE = (process.env.RECOVER_ALERT_MODE || 'harm').toLowerCase()
const RECOVER_ALERT_EMAIL_TO = process.env.RECOVER_ALERT_EMAIL_TO

const HARM_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bself[- ]?harm\b/i,
  /\bhurt myself\b/i,
  /\bharm myself\b/i,
  /\boverdose\b/i,
  /\bkill (someone|him|her|them)\b/i,
  /\bhurt (someone|others)\b/i,
  /\bharm (someone|others)\b/i,
]

const STRESS_PATTERNS: RegExp[] = [
  /\bstress(ed|ful)?\b/i,
  /\banxiet(y|ious)\b/i,
  /\bpanic\b/i,
  /\bburnout\b/i,
  /\boverwhelm(ed|ing)?\b/i,
]

function getAlertReason(text: string): 'harm' | 'stress' | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const harm = HARM_PATTERNS.some((pattern) => pattern.test(trimmed))
  if (harm) return 'harm'

  if (RECOVER_ALERT_MODE === 'stress_or_harm') {
    const stress = STRESS_PATTERNS.some((pattern) => pattern.test(trimmed))
    if (stress) return 'stress'
  }

  return null
}

function formatTranscript(messages: Array<{ role: string; content: string }>): string {
  return messages
    .map((message) => {
      const role = message.role.toUpperCase()
      return `${role}:\n${message.content}\n`
    })
    .join('\n')
    .trim()
}

async function maybeSendAlert(input: {
  reason: 'harm' | 'stress'
  userId?: string | null
  sessionId: string
}): Promise<void> {
  if (RECOVER_ALERT_MODE === 'off') return
  if (RECOVER_ALERT_MODE === 'harm' && input.reason !== 'harm') return

  const alertEmoji = input.reason === 'harm' ? '🚨' : '⚠️'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.thepsychology.ai'

  // PHI-free Slack notification
  try {
    await sendSlackNotification(
      `${alertEmoji} Recover ${input.reason.toUpperCase()} alert triggered. Review in admin dashboard.`,
      'recover'
    )
    console.log('[recover-chat] Slack alert sent:', { reason: input.reason })
  } catch (error) {
    console.error('[recover-chat] Failed to send Slack alert:', error)
  }

  // PHI-free email notification (no transcript, no user identity)
  const to = (RECOVER_ALERT_EMAIL_TO || process.env.NOTIFY_EMAIL_TO || '').trim() || undefined
  if (!isNotificationEmailConfigured(to)) {
    console.warn('[recover-chat] Alert triggered but email is not configured.')
    return
  }

  const subject = `[Recover Alert] ${input.reason.toUpperCase()} – Action Required`
  const text = [
    `A ${input.reason} alert was triggered in a Recover chat session.`,
    '',
    'For HIPAA compliance, user details and transcript are not included in this email.',
    '',
    `Review the session in your admin dashboard:`,
    `${baseUrl}/admin/recover?session=${input.sessionId}`,
    '',
    'Please follow up appropriately based on your protocols.',
  ].join('\n')

  try {
    await sendNotificationEmail({ subject, text, to })
    console.log('[recover-chat] Alert email sent (PHI-free):', { reason: input.reason })
  } catch (error) {
    console.error('[recover-chat] Failed to send alert email:', error)
  }
}

async function getUserProgressContext(
  userId: string,
  supabase: SupabaseClient
): Promise<UserProgressContext> {
  try {
    // Get topic mastery from user_domain_progress
    const { data: progress } = await supabase
      .from('user_domain_progress')
      .select('domain_name, mastery_level, questions_answered')
      .eq('user_id', userId)

    // Get recent exam scores from exam_history
    const { data: exams } = await supabase
      .from('exam_history')
      .select('score, total_questions, correct_answers, exam_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get total exam count
    const { count: examCount } = await supabase
      .from('exam_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get lesson count from feature_ratings (topic_teacher ratings indicate completed lessons)
    const { count: lessonCount } = await supabase
      .from('feature_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'topic_teacher')

    // Get total questions answered from user_question_history
    const { count: questionsAnswered } = await supabase
      .from('user_question_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Pull latest top 3 domains from Prioritize (source of truth for study order guidance)
    const { data: studyPrioritiesRow, error: studyPrioritiesError } = await supabase
      .from('study_priorities')
      .select('top_domains')
      .eq('user_id', userId)
      .maybeSingle()

    if (studyPrioritiesError) {
      console.error('[recover-chat] Failed to fetch study priorities:', studyPrioritiesError)
    }
    const priorityDomains = normalizePriorityDomains(studyPrioritiesRow?.top_domains)

    // Determine study behavior based on lesson/question ratio
    let studyBehavior: 'passive' | 'active' | 'balanced' | null = null
    if ((lessonCount ?? 0) >= 5) {
      const ratio = (questionsAnswered ?? 0) / (lessonCount ?? 1)
      if (ratio < 0.5) studyBehavior = 'passive'
      else if (ratio > 2) studyBehavior = 'active'
      else studyBehavior = 'balanced'
    }

    return {
      progress: progress as DomainProgress[] | null,
      exams: exams as ExamHistoryEntry[] | null,
      examCount: examCount ?? 0,
      lessonCount: lessonCount ?? 0,
      questionsAnswered: questionsAnswered ?? 0,
      priorityDomains,
      studyBehavior,
    }
  } catch (error) {
    console.error('[recover-chat] Failed to fetch user progress:', error)
    return {
      progress: null,
      exams: null,
      examCount: 0,
      lessonCount: 0,
      questionsAnswered: 0,
      priorityDomains: [],
      studyBehavior: null,
    }
  }
}

function getRecoverSystemPrompt(userContext?: UserProgressContext): string {
  let contextSection = ''

  if (userContext) {
    const parts: string[] = []

    // Format weak topics (mastery < 50%)
    if (userContext.progress && userContext.progress.length > 0) {
      const weakTopics = userContext.progress
        .filter((p) => p.mastery_level < 50)
        .sort((a, b) => a.mastery_level - b.mastery_level)
        .slice(0, 5)
        .map((p) => `${p.domain_name} (${Math.round(p.mastery_level)}%)`)

      if (weakTopics.length > 0) {
        parts.push(`Topics needing work: ${weakTopics.join(', ')}`)
      }
    }

    // Format recent exam performance
    if (userContext.exams && userContext.exams.length > 0) {
      const latestExam = userContext.exams[0]
      const scorePercent = Math.round(latestExam.score)
      parts.push(`Recent exam score: ${scorePercent}%`)
    } else {
      parts.push('Recent exam score: no exams taken yet')
    }

    if (userContext.priorityDomains.length > 0) {
      const formattedOrder = userContext.priorityDomains
        .map((domain, index) => {
          const wrongRate =
            typeof domain.percentageWrong === 'number' ? `, ${Math.round(domain.percentageWrong)}% wrong` : ''
          return `${index + 1}. ${domain.domainName}${wrongRate}`
        })
        .join(' | ')
      parts.push(`Prioritize top domains (use this order): ${formattedOrder}`)
    } else {
      parts.push('Prioritize top domains: unavailable')
    }

    // Add exam count
    if (userContext.examCount > 0) {
      parts.push(`Total practice exams taken: ${userContext.examCount}`)
    }

    // Add lesson and question counts
    if (userContext.lessonCount > 0) {
      parts.push(`Topic Teacher lessons completed: ${userContext.lessonCount}`)
    }
    if (userContext.questionsAnswered > 0) {
      parts.push(`Quiz questions answered: ${userContext.questionsAnswered}`)
    } else if (userContext.lessonCount > 3) {
      parts.push(`Quiz questions answered: 0 (hasn't tried quizzes yet)`)
    }

    if (parts.length > 0) {
      contextSection = `

## User's Study Progress (use to personalize recommendations)
${parts.map((p) => `- ${p}`).join('\n')}

When suggesting study actions, recommend specific topics from their weak areas above.
When they mention struggling with certain content, connect it to their actual progress data.
`
    }

    // Add behavior-specific guidance for passive learners
    if (userContext.studyBehavior === 'passive') {
      contextSection += `

## Special: This user learns by reading
They've completed ${userContext.lessonCount} lessons but answered few quiz questions.

Your approach with them:
1. VALIDATE: "You've been putting in serious work - ${userContext.lessonCount} lessons is impressive dedication!"
2. PRAISE RANGE: If they covered multiple domains, mention it positively
3. PRAISE PACING: Taking time between sessions helps memory consolidation
4. GENTLE NUDGE: "To really cement what you're learning, try a quick Quizzer set on that topic. Active recall is the #1 evidence-based way to move info into long-term memory."

Don't lecture about study methods. Just validate their effort and offer the quiz suggestion naturally.`
    }
  }

  return `You are a supportive coach for EPPP test-takers. Your agenda is to help users feel understood, then help them feel more prepared to study.

## How conversations work
- The UI opens with: "How are you doing right now? We can talk about studying, or anything that feels most useful."
- Follow the user's lead first. Do not force study planning before they are ready.
- If they want to talk about non-study things, support that briefly, then ask permission before pivoting to studying.

## Agenda transparency
- If the user says "stop pushing your agenda" (or similar), do not deny it.
- Acknowledge directly: your agenda is to help them feel understood and leave with one small next step when they want it.
- Offer choice and control: they can keep talking, pause, or switch to study planning.

## Study recommendation rules
- If the user asks what to study next, asks for recommendations, or asks for study order:
- Use "Prioritize top domains" from user context as source of truth.
- Do not derive study order from PDF/reference excerpts.
- If Prioritize data is unavailable, say that clearly, then give a provisional order based on their weak areas.

## Quiz routing rules
- Never tell users to find an external quiz platform.
- If they ask for a quiz, first ask what topic they want if none is provided.
- If topic is known, send them to in-app Quizzer or Topic Selector.
- Custom topic requests are allowed.
- If they ask for a specific number of questions, be transparent that Quizzer currently runs 10 questions (8 scored + 2 experimental).
- Do not claim you created, queued, or attached a custom quiz inside this chat.
- For short-time requests (e.g., less than 15 minutes), direct them to **Study** (top menu) for lessons and **Quizzer** for questions.
- If they give a specific time preference (for example 11 minutes 20 seconds), honor that preference when suggesting next steps.

## Session efficiency rule
- After 5 minutes of conversation, redirect them to active study in **Study** or **Practice**.
- Keep the redirect practical and concise.

## Model transparency
- If asked what AI model you are, do not guess a version name.
- Say you are an OpenAI language model used in this app, and you may not have access to the exact deployed version.

## Your approach
1. Briefly acknowledge what they said (one sentence max)
2. Ask what they want right now: to vent/talk, to get a concrete study step, or both
3. Match their choice; avoid pushing
4. When they are open, offer 2-3 concrete options and help pick one action for the next 24 hours

## If they want to talk about other things
- It is acceptable to stay with non-study conversation for 1-3 turns.
- Be supportive, calm, and concise.
- Then gently offer a choice: keep talking, or shift to a small study step.

## Concrete options to offer when they want study help
- "Want me to suggest a 15-minute study plan to get started?"
- "Should we figure out which topic to tackle first based on your weak areas?"
- "Would a quick Quizzer set on one topic help you warm up?"
- "Want to talk through what's blocking you, or just get a concrete next step?"

## For specific struggles
- **Motivation/energy**: Suggest starting with just 5-10 minutes, or their easiest weak topic
- **Overwhelm**: Help them pick ONE topic to focus on today
- **Procrastination**: Offer a tiny first step (open Topic Teacher, do 3 questions)
- **ADHD/attention**: Suggest shorter study chunks, the Quizzer for variety, taking breaks
- **Retention**: Recommend spaced practice, mixing topics, sleep before review sessions
- **Anxiety**: Normalize it, suggest starting with familiar material to build momentum

## Style
- Warm, respectful, and non-defensive
- Keep responses to 2-3 short paragraphs max
- One question at a time
- If the user is upset or using profanity, stay calm and avoid scolding
- Avoid em dashes; use commas or periods
- Do not diagnose or claim to provide therapy

## Response patterns to AVOID
- Starting every response with "You're feeling..." or "You're finding it..."
- Multiple reflective statements in a row
- Repeatedly pushing study actions after the user says no
- Denying you have an agenda when asked
- Claiming a specific OpenAI model version unless you are certain

## Safety
- If the user mentions self-harm, suicide, or intent to harm: respond with a brief caring message and encourage immediate help (911 or 988 in the US)
- For severe symptoms, encourage seeking a licensed professional

Be practical, consent-based, and action-oriented when invited. Help them take one small step forward.${contextSection}`
}

async function getRecoverContext(
  userMessage: string
): Promise<{ context: string; sources: Array<{ title: string; citation: string; similarity: number }> }> {
  const openai = getOpenAIClient()
  const supabase = getSupabaseClient()
  if (!openai || !supabase) return { context: '', sources: [] }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: userMessage,
    })

    // Log embedding usage (no userId available in this context)
    void logUsageEvent({
      eventName: 'recover-chat.embedding',
      endpoint: '/api/recover-chat',
      model: 'text-embedding-3-small',
      inputTokens: embeddingResponse.usage?.prompt_tokens ?? null,
      outputTokens: embeddingResponse.usage?.total_tokens ?? null,
    })

    const queryEmbedding = embeddingResponse.data[0]?.embedding
    if (!queryEmbedding) return { context: '', sources: [] }

    const { data, error } = await supabase.rpc('match_recover_chunks', {
      query_embedding: queryEmbedding,
      match_count: 6,
    })

    if (error || !data || data.length === 0) return { context: '', sources: [] }

    const matches = data as RecoverChunkMatch[]
    const sources = matches
      .map((match) => {
        const title = match.document_title || 'Untitled'
        const citation =
          typeof match.document_apa_citation === 'string' && match.document_apa_citation.trim().length > 0
            ? match.document_apa_citation.trim()
            : title
        return {
          title,
          citation,
          similarity: match.similarity,
        }
      })
      .filter((source) => source.citation.trim().length > 0)

    const context = matches
      .map((chunk, index) => {
        const title = chunk.document_title ? ` (${chunk.document_title})` : ''
        return `Source ${index + 1}${title}:\n${chunk.content}`
      })
      .join('\n\n')

    return { context, sources }
  } catch (error) {
    console.error('[recover-chat] Context error:', error)
    return { context: '', sources: [] }
  }
}

function getOpenAIErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const maybeStatus = (error as { status?: unknown }).status
  const status = typeof maybeStatus === 'number' ? maybeStatus : null
  if (status === 401) {
    const hint =
      process.env.NODE_ENV === 'production'
        ? ''
        : ' (Local dev tip: exported shell env vars override .env.local; restart `next dev` after updating.)'
    return `OpenAI authentication failed. Check OPENAI_API_KEY.${hint}`
  }
  if (status === 429) return 'OpenAI rate limit reached. Try again in a moment.'
  if (status && status >= 500) return 'OpenAI service error. Try again in a moment.'
  return null
}

async function persistRecoverTranscript(input: {
  supabase: ReturnType<typeof getSupabaseClient>
  sessionId: string
  userId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  assistantMessage: string
  assistantSources?: Array<{ citation: string; similarity?: number }>
  alertReason: 'harm' | 'stress' | null
}): Promise<void> {
  const supabase = input.supabase
  if (!supabase) return

  const now = new Date().toISOString()
  const lastUserIndex = [...input.messages].map((m) => m.role).lastIndexOf('user')
  const lastUserMessage = lastUserIndex >= 0 ? input.messages[lastUserIndex]?.content : null
  const initialAssistantMessage =
    input.messages[0]?.role === 'assistant' && input.messages[0]?.content.trim()
      ? input.messages[0].content
      : INITIAL_RECOVER_ASSISTANT_MESSAGE

  try {
    const { error: sessionError } = await supabase
      .from('recover_chat_sessions')
      .upsert({ id: input.sessionId, user_id: input.userId }, { onConflict: 'id' })

    if (sessionError) throw sessionError

    const { error: initialError } = await supabase
      .from('recover_chat_messages')
      .upsert(
        {
          session_id: input.sessionId,
          user_id: input.userId,
          message_index: 0,
          role: 'assistant',
          content: initialAssistantMessage,
        },
        { onConflict: 'session_id,message_index' }
      )

    if (initialError) throw initialError

    if (typeof lastUserMessage === 'string' && lastUserMessage.trim().length > 0 && lastUserIndex > 0) {
      const { error: userMsgError } = await supabase
        .from('recover_chat_messages')
        .upsert(
          {
            session_id: input.sessionId,
            user_id: input.userId,
            message_index: lastUserIndex,
            role: 'user',
            content: lastUserMessage,
            alert_reason: input.alertReason,
            created_at: now,
          },
          { onConflict: 'session_id,message_index' }
        )

      if (userMsgError) throw userMsgError
    }

    const assistantIndex = input.messages.length
    const { error: assistantMsgError } = await supabase
      .from('recover_chat_messages')
      .upsert(
        {
          session_id: input.sessionId,
          user_id: input.userId,
          message_index: assistantIndex,
          role: 'assistant',
          content: input.assistantMessage,
          sources: input.assistantSources ?? null,
          created_at: now,
        },
        { onConflict: 'session_id,message_index' }
      )

    if (assistantMsgError) throw assistantMsgError

    const sessionUpdate: Record<string, unknown> = {
      last_message_at: now,
      message_count: assistantIndex + 1,
    }

    if (input.alertReason === 'harm') {
      sessionUpdate.has_harm_alert = true
      sessionUpdate.last_alert_reason = 'harm'
      sessionUpdate.last_alert_at = now
    } else if (input.alertReason === 'stress') {
      sessionUpdate.has_stress_alert = true
      sessionUpdate.last_alert_reason = 'stress'
      sessionUpdate.last_alert_at = now
    }

    const { error: updateError } = await supabase
      .from('recover_chat_sessions')
      .update(sessionUpdate)
      .eq('id', input.sessionId)

    if (updateError) throw updateError
  } catch (error) {
    console.error('[recover-chat] Failed to persist transcript:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY.' }, { status: 500 })
    }
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }

    const raw = await request.json().catch(() => null)
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const messages = parsed.data.messages ?? []
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 })
    }

    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content
    const alertReason = lastUserMessage ? getAlertReason(lastUserMessage) : null

    if (alertReason) {
      await maybeSendAlert({
        reason: alertReason,
        userId: parsed.data.userId ?? null,
        sessionId: parsed.data.sessionId,
      })
    }

    // Fetch user progress data for personalization
    const userContext = parsed.data.userId
      ? await getUserProgressContext(parsed.data.userId, supabase)
      : undefined

    const sessionElapsedSeconds = await getSessionElapsedSeconds(supabase, parsed.data.sessionId)
    if (sessionElapsedSeconds !== null && sessionElapsedSeconds >= 5 * 60 && !alertReason) {
      const redirectReply = buildFiveMinuteRedirectReply()
      const responsePayload = { message: redirectReply }

      if (parsed.data.userId) {
        void persistRecoverTranscript({
          supabase,
          sessionId: parsed.data.sessionId,
          userId: parsed.data.userId,
          messages,
          assistantMessage: redirectReply,
          alertReason,
        })
      }

      return NextResponse.json(responsePayload)
    }

    const timedTopicReply = lastUserMessage
      ? await buildTimedTopicReply({
          request,
          messages,
          lastUserMessage,
          userContext,
        })
      : null

    if (timedTopicReply) {
      const responsePayload = { message: timedTopicReply }

      if (parsed.data.userId) {
        void persistRecoverTranscript({
          supabase,
          sessionId: parsed.data.sessionId,
          userId: parsed.data.userId,
          messages,
          assistantMessage: timedTopicReply,
          alertReason,
        })
      }

      return NextResponse.json(responsePayload)
    }

    const quizRoutingReply = lastUserMessage
      ? buildQuizRoutingReply({ messages, lastUserMessage, userContext })
      : null

    if (quizRoutingReply) {
      const responsePayload = { message: quizRoutingReply }

      if (parsed.data.userId) {
        void persistRecoverTranscript({
          supabase,
          sessionId: parsed.data.sessionId,
          userId: parsed.data.userId,
          messages,
          assistantMessage: quizRoutingReply,
          alertReason,
        })
      }

      return NextResponse.json(responsePayload)
    }

    const shouldSkipReferenceContext = lastUserMessage
      ? isStudyRecommendationRequest(lastUserMessage) || isQuizNavigationRequest(lastUserMessage)
      : false

    const { context, sources } =
      lastUserMessage && !shouldSkipReferenceContext
        ? await getRecoverContext(lastUserMessage)
        : { context: '', sources: [] }

    const systemMessages = [{ role: 'system' as const, content: getRecoverSystemPrompt(userContext) }]
    if (context) {
      systemMessages.push({
        role: 'system' as const,
        content:
          `You may use the following reference excerpts when helpful. ` +
          `If you cite them, keep it short. Prefer paraphrase and do not provide long verbatim excerpts.\n\n${context}`,
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [...systemMessages, ...messages.slice(-20)],
    })

    // Log chat completion usage
    void logUsageEvent({
      userId: parsed.data.userId,
      eventName: 'recover-chat.completion',
      endpoint: '/api/recover-chat',
      model: 'gpt-4o',
      inputTokens: completion.usage?.prompt_tokens ?? null,
      outputTokens: completion.usage?.completion_tokens ?? null,
      metadata: { sessionId: parsed.data.sessionId }
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) {
      return NextResponse.json({ error: 'No response from model.' }, { status: 502 })
    }

    const uniqueSources =
      sources.length > 0
        ? Array.from(
            new Map(sources.map((source) => [source.citation, source])).values()
          )
        : undefined

    const responsePayload = {
      message,
      sources: uniqueSources?.map(({ citation, similarity }) => ({ citation, similarity })),
    }

    if (parsed.data.userId) {
      void persistRecoverTranscript({
        supabase,
        sessionId: parsed.data.sessionId,
        userId: parsed.data.userId,
        messages,
        assistantMessage: message,
        assistantSources: responsePayload.sources,
        alertReason,
      })
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('[recover-chat] Error:', error)
    const openaiMessage = getOpenAIErrorMessage(error)
    if (openaiMessage) {
      return NextResponse.json({ error: openaiMessage }, { status: 502 })
    }
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
