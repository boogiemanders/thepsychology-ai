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

function normalizeCommitMessage(message: string): { title: string; body?: string } {
  const trimmed = (message || '').trim()
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
        entries: toApiEntriesFromFallback(CHANGELOG_ENTRIES),
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
        return {
          id: commit.sha,
          date: commit.commit?.author?.date || new Date().toISOString(),
          title,
          body,
          url: commit.html_url,
          author: commit.author?.login || commit.commit?.author?.name || null,
        }
      })
      .filter((entry) => (includeMerges ? true : !isMergeCommit(entry.title)))
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
      entries: toApiEntriesFromFallback(CHANGELOG_ENTRIES),
      source: 'fallback',
      generatedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Failed to load changelog',
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  }
}

