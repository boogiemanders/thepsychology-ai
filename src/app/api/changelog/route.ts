import { NextRequest, NextResponse } from 'next/server'
import { CHANGELOG_ENTRIES, type ChangelogEntry } from '@/lib/changelog'

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

const DEFAULT_REPO = 'boogiemanders/thepsychology-ai'
const DAY_MS = 24 * 60 * 60 * 1000
const CANONICAL_CHANGELOG_AUTHOR = 'Anders Chan, Psy.D.'
const CANONICAL_CHANGELOG_AUTHOR_ALIASES = new Set(['boogiemanders', 'anders chan'])

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
    title: entry.title,
    body: entry.body,
  }))
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
  const title = (firstLine || '').trim()
  const body = rest.join('\n').trim()
  return body ? { title, body } : { title }
}

function isMergeCommit(title: string): boolean {
  const t = title.trim().toLowerCase()
  return t.startsWith('merge ') || t.startsWith('merge:')
}

function isUserRelevantEntry(entry: ApiChangelogEntry): boolean {
  const text = `${entry.title} ${entry.body || ''}`.toLowerCase()

  // Check keyword exclusions
  if (EXCLUDED_CHANGELOG_KEYWORDS.some(keyword => text.includes(keyword))) {
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
        entries: toApiEntriesFromFallback(CHANGELOG_ENTRIES).filter(isUserRelevantEntry),
        source: 'fallback',
        generatedAt: new Date().toISOString(),
        error: errorText || `GitHub API error (${response.status})`,
      }
      return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      })
    }

    const commits = (await response.json()) as GitHubCommit[]
    const entries: ApiChangelogEntry[] = (Array.isArray(commits) ? commits : [])
      .map((commit) => {
        const { title, body } = normalizeCommitMessage(commit.commit?.message || '')
        const author = normalizeChangelogAuthor(commit.author?.login || commit.commit?.author?.name || null)
        return {
          id: commit.sha,
          date: commit.commit?.author?.date || new Date().toISOString(),
          title,
          body,
          // Intentionally omit url to prevent exposing GitHub repo to users
          author,
        }
      })
      .filter((entry) => (includeMerges ? true : !isMergeCommit(entry.title)))
      .filter(isUserRelevantEntry)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const payload: ApiChangelogResponse = {
      entries,
      source: 'github',
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    const payload: ApiChangelogResponse = {
      entries: toApiEntriesFromFallback(CHANGELOG_ENTRIES).filter(isUserRelevantEntry),
      source: 'fallback',
      generatedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Failed to load changelog',
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  }
}
