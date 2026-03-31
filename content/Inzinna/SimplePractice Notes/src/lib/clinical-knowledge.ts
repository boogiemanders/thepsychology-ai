export interface ClinicalKnowledgeChunk {
  id: string
  pageStart: number
  pageEnd: number
  heading: string
  preview: string
  tags: string[]
  estimatedTokens: number
  text: string
}

export interface ClinicalKnowledgeResourceSummary {
  id: string
  title: string
  authors: string[]
  modality: string
  focusTags: string[]
  pageCount: number
  chunkCount: number
  path: string
}

export interface ClinicalKnowledgeResource extends Omit<ClinicalKnowledgeResourceSummary, 'pageCount' | 'path'> {
  source: {
    pdfPath: string
    extractionMode: string
    includeNeighbors: number
  }
  metadata: {
    title: string
    author: string
    producer: string
    creator: string
    creationDate: string
    modDate: string
    pages: number
    fileSizeBytes: number
  }
  generatedAt: string
  chunkCount: number
  chunks: ClinicalKnowledgeChunk[]
}

export interface ClinicalKnowledgeManifest {
  version: number
  generatedAt: string
  resourceCount: number
  resources: ClinicalKnowledgeResourceSummary[]
}

export interface ClinicalKnowledgeSearchResult {
  resourceId: string
  resourceTitle: string
  chunk: ClinicalKnowledgeChunk
  score: number
}

const MANIFEST_PATH = 'assets/clinical-knowledge/manifest.json'
const INDEX_PATH = 'assets/clinical-knowledge/index.json'
const manifestCache: { promise?: Promise<ClinicalKnowledgeManifest> } = {}
const indexCache: { promise?: Promise<ClinicalKnowledgeSearchIndex> } = {}
const resourceCache = new Map<string, Promise<ClinicalKnowledgeResource>>()

export interface ClinicalKnowledgeIndexEntry {
  resourceId: string
  resourceTitle: string
  resourceModality: string
  chunk: Omit<ClinicalKnowledgeChunk, 'text'>
}

export interface ClinicalKnowledgeSearchIndex {
  version: number
  generatedAt: string
  entries: ClinicalKnowledgeIndexEntry[]
}

function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(query: string): string[] {
  return normalizeTerm(query)
    .split(' ')
    .filter((term) => term.length >= 3)
}

async function loadJson<T>(path: string): Promise<T> {
  if (!chrome.runtime?.id) {
    // Clear caches so a retry after page reload doesn't use stale promises
    delete manifestCache.promise
    delete indexCache.promise
    resourceCache.clear()
    throw new Error('Extension context invalidated — reload the page to retry')
  }
  const url = chrome.runtime.getURL(path)
  const resp = await fetch(url, { cache: 'no-store' })
  if (!resp.ok) {
    throw new Error(`Failed to load ${path}: ${resp.status}`)
  }
  return resp.json() as Promise<T>
}

export function loadClinicalKnowledgeManifest(): Promise<ClinicalKnowledgeManifest> {
  manifestCache.promise ??= loadJson<ClinicalKnowledgeManifest>(MANIFEST_PATH)
  return manifestCache.promise
}

export function loadClinicalKnowledgeIndex(): Promise<ClinicalKnowledgeSearchIndex> {
  indexCache.promise ??= loadJson<ClinicalKnowledgeSearchIndex>(INDEX_PATH)
  return indexCache.promise
}

export async function loadClinicalKnowledgeResource(
  resourceId: string
): Promise<ClinicalKnowledgeResource> {
  if (!resourceCache.has(resourceId)) {
    resourceCache.set(
      resourceId,
      loadJson<ClinicalKnowledgeResource>(`assets/clinical-knowledge/${resourceId}.json`)
    )
  }
  return resourceCache.get(resourceId) as Promise<ClinicalKnowledgeResource>
}

function scoreChunk(tokens: string[], chunk: ClinicalKnowledgeChunk): number {
  if (!tokens.length) return 0
  const haystack = normalizeTerm(
    [chunk.heading, chunk.preview, chunk.tags.join(' '), chunk.text.slice(0, 1500)].join(' ')
  )

  let score = 0
  for (const token of tokens) {
    if (!haystack.includes(token)) continue
    score += 1
    if (chunk.heading && normalizeTerm(chunk.heading).includes(token)) score += 2
    if (chunk.tags.some((tag) => normalizeTerm(tag).includes(token))) score += 2
    if (normalizeTerm(chunk.preview).includes(token)) score += 1
  }

  return score
}

function scoreIndexEntry(
  tokens: string[],
  entry: ClinicalKnowledgeIndexEntry
): number {
  const chunkScore = scoreChunk(tokens, { ...entry.chunk, text: '' })
  const resourceHaystack = normalizeTerm(
    `${entry.resourceTitle} ${entry.resourceModality}`
  )

  let score = chunkScore
  for (const token of tokens) {
    if (resourceHaystack.includes(token)) score += 2
  }

  return score
}

export async function searchClinicalKnowledge(
  query: string,
  options: { limit?: number; resourceIds?: string[] } = {}
): Promise<ClinicalKnowledgeSearchResult[]> {
  const index = await loadClinicalKnowledgeIndex()
  const tokens = tokenize(query)
  if (!tokens.length) return []

  const resourceIds = options.resourceIds?.length
    ? options.resourceIds
    : null
  const results: ClinicalKnowledgeSearchResult[] = []

  for (const entry of index.entries) {
    if (resourceIds && !resourceIds.includes(entry.resourceId)) continue
    const chunk = { ...entry.chunk, text: '' }
    const score = scoreIndexEntry(tokens, entry)
    if (score <= 0) continue
    results.push({
      resourceId: entry.resourceId,
      resourceTitle: entry.resourceTitle,
      chunk,
      score,
    })
  }

  return results
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.chunk.pageStart - b.chunk.pageStart
    })
    .slice(0, options.limit ?? 8)
}
