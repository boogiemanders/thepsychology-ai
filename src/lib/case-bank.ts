import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { findTopicFile } from './topic-paths'

const CASES_DIR = path.join(process.cwd(), 'caseBank', 'cases')
const QUESTIONS_DIR = path.join(process.cwd(), 'questionsGPT')

const CaseOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  nextNodeId: z.string().min(1),
  scoreDelta: z.number(),
  isBest: z.boolean().optional(),
  rationale: z.string().min(1),
})

const CaseDecisionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('decision'),
  knId: z
    .string()
    .regex(/^KN\d{1,3}$/i)
    .optional(),
  topicName: z.string().min(1).optional(),
  prompt: z.string().min(1),
  options: z.array(CaseOptionSchema).length(4),
})

const CaseEndNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('end'),
  summary: z.string().min(1),
  takeaways: z.array(z.string().min(1)).min(1),
  recommendedLessons: z
    .array(
      z.object({
        topic: z.string().min(1),
        domainId: z.string().min(1).optional(),
      })
    )
    .optional(),
})

const CaseNodeSchema = z.union([CaseDecisionNodeSchema, CaseEndNodeSchema])

const CaseScoringSchema = z.object({
  maxScore: z.number().positive(),
  levels: z
    .array(
      z.object({
        minScore: z.number(),
        label: z.string().min(1),
        message: z.string().min(1),
      })
    )
    .min(1),
})

export const CaseVignetteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  domainId: z.string().min(1),
  domainLabel: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isPremium: z.boolean(),
  tags: z.array(z.string().min(1)).default([]),
  version: z.number().int().positive(),
  rootNodeId: z.string().min(1),
  scoring: CaseScoringSchema,
  nodes: z.array(CaseNodeSchema).min(1),
})

export type CaseVignette = z.infer<typeof CaseVignetteSchema>

export type CaseVignetteSummary = Pick<
  CaseVignette,
  'id' | 'title' | 'domainId' | 'domainLabel' | 'estimatedMinutes' | 'difficulty' | 'isPremium' | 'tags' | 'version'
>

function getCaseFiles(): string[] {
  if (!fs.existsSync(CASES_DIR)) return []
  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.toLowerCase().endsWith('.json'))
    .sort()
    .map((file) => path.join(CASES_DIR, file))
}

function validateGraph(caseData: CaseVignette) {
  const nodeIds = new Set(caseData.nodes.map((node) => node.id))
  if (!nodeIds.has(caseData.rootNodeId)) {
    throw new Error(`rootNodeId "${caseData.rootNodeId}" not found in nodes`)
  }

  const duplicates = caseData.nodes
    .map((n) => n.id)
    .filter((id, idx, arr) => arr.indexOf(id) !== idx)
  if (duplicates.length > 0) {
    throw new Error(`Duplicate node ids: ${Array.from(new Set(duplicates)).join(', ')}`)
  }

  for (const node of caseData.nodes) {
    if (node.type !== 'decision') continue
    for (const option of node.options) {
      if (!nodeIds.has(option.nextNodeId)) {
        throw new Error(`Option "${node.id}.${option.id}" points to missing node "${option.nextNodeId}"`)
      }
    }
  }
}

type CaseBankCache = {
  byId: Map<string, CaseVignette>
  summaries: CaseVignetteSummary[]
}

let cache: CaseBankCache | null = null

function loadAllCases(): CaseBankCache {
  if (process.env.NODE_ENV !== 'production') {
    cache = null
  }
  if (cache) return cache

  const byId = new Map<string, CaseVignette>()
  const summaries: CaseVignetteSummary[] = []

  for (const filePath of getCaseFiles()) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = CaseVignetteSchema.parse(JSON.parse(raw))
    validateGraph(parsed)

    byId.set(parsed.id, parsed)
    summaries.push({
      id: parsed.id,
      title: parsed.title,
      domainId: parsed.domainId,
      domainLabel: parsed.domainLabel,
      estimatedMinutes: parsed.estimatedMinutes,
      difficulty: parsed.difficulty,
      isPremium: parsed.isPremium,
      tags: parsed.tags ?? [],
      version: parsed.version,
    })
  }

  summaries.sort((a, b) => a.domainId.localeCompare(b.domainId) || a.title.localeCompare(b.title))
  cache = { byId, summaries }
  return cache
}

export function listCaseVignetteSummaries(): CaseVignetteSummary[] {
  return loadAllCases().summaries
}

export function loadCaseVignetteById(caseId: string): CaseVignette | null {
  if (!caseId) return null
  const data = loadAllCases().byId.get(caseId)
  return data ?? null
}

export type CaseQuestionItem = {
  id: string
  caseId: string
  caseTitle: string
  nodeId: string
  topicName?: string
  domainId: string
  domainNumber: number
  knId?: string
  difficulty: 'easy' | 'medium' | 'hard'
  stem: string
  options: string[]
  answer: string
  explanation: string
  source_file: string
  source_folder: string
  tags: string[]
  isPremium: boolean
}

function domainNumberFromDomainId(domainId: string): number {
  const match = String(domainId || '').match(/(\d+)/)
  const domainNumber = match ? Number.parseInt(match[1] ?? '', 10) : NaN
  if (Number.isFinite(domainNumber) && domainNumber >= 1 && domainNumber <= 8) return domainNumber
  return 0
}

function normalizeTopicKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/^[\d\s]+/, '')
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildExplanationFromRationales(options: Array<{ id: string; text: string; isBest?: boolean; rationale: string }>) {
  const best = options.find((o) => o.isBest === true) ?? null
  if (!best) return ''

  const lines: string[] = []
  lines.push(`Correct: ${best.text}`)
  lines.push(best.rationale)

  const others = options.filter((o) => o !== best)
  if (others.length > 0) {
    lines.push('')
    lines.push('Why the other options are less optimal:')
    for (const option of others) {
      lines.push(`${option.id}. ${option.rationale}`)
    }
  }

  return lines.join('\n')
}

export function listCaseQuestionItems(): CaseQuestionItem[] {
  const { byId } = loadAllCases()
  const items: CaseQuestionItem[] = []
  const questionSourceCache = new Map<string, string | null>()

  for (const vignette of byId.values()) {
    const domainNumber = domainNumberFromDomainId(vignette.domainId)

    for (const node of vignette.nodes) {
      if (node.type !== 'decision') continue
      const best = node.options.find((o) => o.isBest === true) ?? null
      if (!best) continue

      const topicName = node.topicName
      const cacheKey = `${vignette.domainId}::${topicName ?? ''}`
      let resolvedQuestionFilePath = questionSourceCache.get(cacheKey) ?? null

      if (!questionSourceCache.has(cacheKey)) {
        resolvedQuestionFilePath =
          topicName && topicName.trim().length > 0
            ? findTopicFile(QUESTIONS_DIR, topicName, '.json', vignette.domainId)
            : null
        questionSourceCache.set(cacheKey, resolvedQuestionFilePath)
      }

      const source_file = resolvedQuestionFilePath
        ? path.relative(process.cwd(), resolvedQuestionFilePath).split(path.sep).join(path.posix.sep)
        : topicName
          ? `${domainNumber || ''} ${topicName}`.trim() + '.json'
          : path.posix.join('caseBank', 'cases', `${vignette.id}.json`)

      const source_folder = resolvedQuestionFilePath
        ? path.basename(path.dirname(resolvedQuestionFilePath))
        : 'caseBank'

      const options = node.options.map((o) => o.text)
      const answer = best.text
      const explanation = buildExplanationFromRationales(node.options)

      items.push({
        id: `${vignette.id}:${node.id}`,
        caseId: vignette.id,
        caseTitle: vignette.title,
        nodeId: node.id,
        topicName,
        domainId: vignette.domainId,
        domainNumber,
        knId: node.knId ? String(node.knId).toUpperCase() : undefined,
        difficulty: vignette.difficulty,
        stem: node.prompt,
        options,
        answer,
        explanation,
        source_file,
        source_folder,
        tags: vignette.tags ?? [],
        isPremium: vignette.isPremium,
      })
    }
  }

  items.sort((a, b) => a.domainNumber - b.domainNumber || a.caseTitle.localeCompare(b.caseTitle) || a.nodeId.localeCompare(b.nodeId))
  return items
}

export function getCaseQuestionsForTopic(topicName: string, domainId?: string | null): CaseQuestionItem[] {
  const target = normalizeTopicKey(topicName)
  if (!target) return []

  const domainKey = typeof domainId === 'string' && domainId.trim().length > 0 ? domainId.trim() : null
  const items = listCaseQuestionItems()

  return items.filter((item) => {
    if (domainKey && item.domainId !== domainKey) return false
    const itemTopic = item.topicName ? normalizeTopicKey(item.topicName) : ''
    return itemTopic && itemTopic === target
  })
}

export function getCaseQuestionsByKnId(): Map<string, CaseQuestionItem> {
  const map = new Map<string, CaseQuestionItem>()
  for (const item of listCaseQuestionItems()) {
    if (!item.knId) continue
    if (!map.has(item.knId)) {
      map.set(item.knId, item)
    }
  }
  return map
}
