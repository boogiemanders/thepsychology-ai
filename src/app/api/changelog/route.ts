import { NextRequest, NextResponse } from 'next/server'
import { CHANGELOG_ENTRIES, type ChangelogEntry } from '@/lib/changelog'
import { filterAndSanitizeChangelogEntries } from '@/lib/changelog-display'

type ApiChangelogEntry = {
  id: string
  date: string
  title: string
  body?: string
  url?: string
  author?: string | null
}

type ApiChangelogResponse = {
  entries: ApiChangelogEntry[]
  source: 'github' | 'fallback'
  generatedAt: string
  error?: string
}

type GitHubCommit = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    } | null
  }
  author?: {
    login?: string
  } | null
}

type GitHubCommitDetail = GitHubCommit & {
  files?: Array<{ filename: string }>
}

// Only commits that modify files under one of these folders are shown in the
// user-facing changelog. Path prefix match against each modified file.
const EPPP_PATH_PREFIXES = ['EPPP/']

const DEFAULT_REPO = 'boogiemanders/thepsychology-ai'
const DAY_MS = 24 * 60 * 60 * 1000
const CANONICAL_CHANGELOG_AUTHOR = 'Anders Chan, Psy.D.'
const CANONICAL_CHANGELOG_AUTHOR_ALIASES = new Set(['boogiemanders', 'anders chan'])

// Commit authors (GitHub login or commit author name, lowercased) to hide from
// the user-facing changelog entirely.
const EXCLUDED_CHANGELOG_AUTHORS = new Set(['katherine.archibald45'])

function isExcludedChangelogAuthor(commit: GitHubCommit): boolean {
  const candidates = [commit.author?.login, commit.commit?.author?.name]
  return candidates.some(
    (c) => typeof c === 'string' && EXCLUDED_CHANGELOG_AUTHORS.has(c.trim().toLowerCase()),
  )
}

// Keywords to filter out from user-facing changelog (payment/billing and non-EPPP related)
const EXCLUDED_CHANGELOG_KEYWORDS = [
  // Payment/billing
  'stripe', 'payment', 'billing', 'subscription',
  'price', 'pricing', 'checkout', 'invoice',
  'charge', 'revenue', 'money', 'paid', 'purchase',
  // Lab/SENSE (non-EPPP)
  'lab hub', 'lab/', 'sense lens', '/sense', 'sensory processing',
  'clinician tool', 'session wizard', 'mit media lab',
  // Infrastructure/code changes (not user-facing)
  'domain_folder_map', 'source_folder_to_domain', 'kebab-case',
  'topic-content-v3', 'topic-content-v4',
  // Marketing/testimonials
  'testimonial',
  // Internal compensation / employment agreement changes
  'didactic', 'licensed agreement', 'agreement v2', '90791', '90837',
]

// Hide brand/vendor names that should not appear in the public-facing changelog.
// Use regex here so exact terms like `GA4` and standalone `GPT` are filtered
// without accidentally matching folder names such as `examsGPT`.
const EXCLUDED_CHANGELOG_TEXT_PATTERNS = [
  /\baatbs\b/i,
  /\bpsychprep\b/i,
  /\bprepjet\b/i,
  /\bmometrix\b/i,
  /\brula\b/i,
  /\bsondermind\b/i,
  /\blyra\b/i,
  /\bspring health\b/i,
  /\btwo chairs\b/i,
  /\bmental health match\b/i,
  /\bquartet\b/i,
  /\btava\b/i,
  /\bga4\b/i,
  /\bgpt\b/i,
]

// Also exclude commits that mention lab or SENSE in the title
const EXCLUDED_CHANGELOG_TITLE_PATTERNS = [
  /\blab\b/i,
  /\bsense\b/i,
  /sensory/i,
  /clinician/i,
  /therapy session/i,
  // Infrastructure/rename commits
  /rename.*domain.*folder/i,
  /rename.*lesson.*file/i,
  /update.*mapping/i,
  // Content/lesson file additions (internal)
  /\bv4\b/i,
  /rtf.*source/i,
  /lesson.*files?/i,
  /infrastructure/i,
  /filter.*commit/i,
  /changelog.*filter/i,
  /hide.*commit/i,
  /remove.*github/i,
]

function normalizeChangelogAuthor(author: string | null | undefined): string | null {
  if (!author) return null
  const trimmed = author.trim()
  if (!trimmed) return null

  const normalized = trimmed.toLowerCase()
  if (CANONICAL_CHANGELOG_AUTHOR_ALIASES.has(normalized)) return CANONICAL_CHANGELOG_AUTHOR
  return trimmed
}

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function toApiEntriesFromFallback(entries: ChangelogEntry[]): ApiChangelogEntry[] {
  return entries.map((entry) => ({
    id: `${entry.date}-${entry.title}`,
    date: entry.date,
    title: sanitizeChangelogText(entry.title),
    body: sanitizeChangelogText(entry.body),
  }))
}

function sanitizeChangelogText(text: string): string {
  return text
    .replace(/examsGPT\//gi, 'exams folder')
    .replace(/\bexamsGPT\b/gi, 'exams folder')
}

function stripClaudeAttribution(message: string): string {
  const lines = (message || '').split('\n')
  const filtered = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return true

    const lower = trimmed.toLowerCase()
    if (trimmed.includes('claude.com/claude-code') || trimmed.includes('claude.ai/claude-code')) return false
    if (lower.includes('generated with') && lower.includes('claude code')) return false
    if (lower.startsWith('co-authored-by:') && (lower.includes('anthropic.com') || lower.includes('claude'))) return false

    return true
  })

  return filtered.join('\n').trim()
}

function normalizeCommitMessage(message: string): { title: string; body?: string } {
  const trimmed = stripClaudeAttribution(message).trim()
  if (!trimmed) return { title: 'Update' }
  const [firstLine, ...rest] = trimmed.split('\n')
  const title = sanitizeChangelogText((firstLine || '').trim())
  const body = sanitizeChangelogText(rest.join('\n').trim())
  return body ? { title, body } : { title }
}

function isMergeCommit(title: string): boolean {
  const t = title.trim().toLowerCase()
  return t.startsWith('merge ') || t.startsWith('merge:')
}

async function fetchCommitDetail(
  repo: string,
  sha: string,
  token: string,
): Promise<GitHubCommitDetail | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as GitHubCommitDetail
  } catch {
    return null
  }
}

function commitTouchesEppp(detail: GitHubCommitDetail | null): boolean {
  const files = detail?.files
  if (!files || files.length === 0) return false
  return files.some((f) =>
    typeof f.filename === 'string' &&
    EPPP_PATH_PREFIXES.some((prefix) => f.filename.startsWith(prefix)),
  )
}

function isUserRelevantEntry(entry: ApiChangelogEntry): boolean {
  const text = `${entry.title} ${entry.body || ''}`
  const normalizedText = text.toLowerCase()

  // Check keyword exclusions
  if (EXCLUDED_CHANGELOG_KEYWORDS.some(keyword => normalizedText.includes(keyword))) {
    return false
  }

  // Check brand/vendor exclusions
  if (EXCLUDED_CHANGELOG_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
    return false
  }

  // Check title pattern exclusions
  if (EXCLUDED_CHANGELOG_TITLE_PATTERNS.some(pattern => pattern.test(entry.title))) {
    return false
  }

  return true
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const days = clampInt(url.searchParams.get('days'), 30, 1, 90)
  const limit = clampInt(url.searchParams.get('limit'), 50, 1, 100)
  const includeMerges = url.searchParams.get('includeMerges') === '1'

  const repo = process.env.GITHUB_CHANGELOG_REPO || process.env.GITHUB_REPO || DEFAULT_REPO
  const token = process.env.GITHUB_CHANGELOG_TOKEN || process.env.GITHUB_TOKEN || ''

  const sinceIso = new Date(Date.now() - days * DAY_MS).toISOString()
  const apiUrl = new URL(`https://api.github.com/repos/${repo}/commits`)
  apiUrl.searchParams.set('since', sinceIso)
  apiUrl.searchParams.set('per_page', String(limit))

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const payload: ApiChangelogResponse = {
        entries: filterAndSanitizeChangelogEntries(toApiEntriesFromFallback(CHANGELOG_ENTRIES)),
        source: 'fallback',
        generatedAt: new Date().toISOString(),
        error: errorText || `GitHub API error (${response.status})`,
      }
      return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    const commits = (await response.json()) as GitHubCommit[]

    // Step 1: cheap exclusions first (merges, message-based filters) so we
    // don't fan out a detail fetch for commits we already know will be dropped.
    const prelim = (Array.isArray(commits) ? commits : [])
      .filter((commit) => !isExcludedChangelogAuthor(commit))
      .map((commit) => {
        const { title, body } = normalizeCommitMessage(commit.commit?.message || '')
        const author = normalizeChangelogAuthor(commit.author?.login || commit.commit?.author?.name || null)
        const entry: ApiChangelogEntry = {
          id: commit.sha,
          date: commit.commit?.author?.date || new Date().toISOString(),
          title,
          body,
          author,
        }
        return { commit, entry }
      })
      .filter(({ entry }) => (includeMerges ? true : !isMergeCommit(entry.title)))
      .filter(({ entry }) => isUserRelevantEntry(entry))

    // Step 2: fetch file lists in parallel and keep only EPPP-touching commits.
    const detailed = await Promise.all(
      prelim.map(async ({ commit, entry }) => ({
        entry,
        detail: await fetchCommitDetail(repo, commit.sha, token),
      })),
    )

    const entries: ApiChangelogEntry[] = detailed
      .filter(({ detail }) => commitTouchesEppp(detail))
      .map(({ entry }) => entry)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const payload: ApiChangelogResponse = {
      entries,
      source: 'github',
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    const payload: ApiChangelogResponse = {
      entries: filterAndSanitizeChangelogEntries(toApiEntriesFromFallback(CHANGELOG_ENTRIES)),
      source: 'fallback',
      generatedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Failed to load changelog',
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
