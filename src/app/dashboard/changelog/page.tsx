'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Markdown } from '@/components/ui/markdown'
import type { Components } from 'react-markdown'

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const CHANGELOG_MARKDOWN_COMPONENTS: Partial<Components> = {
  p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm text-foreground/90">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm text-foreground/90">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  ),
}

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

export default function DashboardChangelogPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [entries, setEntries] = useState<ApiChangelogEntry[]>([])
  const [source, setSource] = useState<ApiChangelogResponse['source']>('github')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/changelog?days=31&limit=100')
        const data = (await response.json().catch(() => null)) as ApiChangelogResponse | null
        if (cancelled) return
        if (!response.ok || !data || !Array.isArray(data.entries)) {
          throw new Error(typeof (data as any)?.error === 'string' ? (data as any).error : 'Failed to load changelog.')
        }
        setEntries(data.entries)
        setSource(data.source)
        setError(typeof data.error === 'string' ? data.error : null)
      } catch (err) {
        if (cancelled) return
        setEntries([])
        setSource('fallback')
        setError(err instanceof Error ? err.message : 'Failed to load changelog.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [user])

  const displayEntries = useMemo(() => {
    return entries
      .filter((entry) => entry && typeof entry.title === 'string')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries])

  if (!user) return null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
          <p className="text-sm text-muted-foreground">Updates from the last month (auto-updates on new pushes).</p>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">What&apos;s new</CardTitle>
            <div className="flex items-center gap-2">
              {source === 'github' ? (
                <Badge variant="outline">Live</Badge>
              ) : (
                <Badge variant="secondary">Fallback</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70dvh]">
              <div className="divide-y divide-border/60">
                {isLoading && (
                  <div className="p-5 text-sm text-muted-foreground">Loading updates…</div>
                )}
                {!isLoading && error && (
                  <div className="p-5">
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                      {error}
                    </div>
                  </div>
                )}

                {!isLoading &&
                  displayEntries.map((entry) => (
                    <div key={entry.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          {entry.url ? (
                            <a href={entry.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                              {entry.title}
                            </a>
                          ) : (
                            entry.title
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatDate(entry.date)}</div>
                        {entry.author ? (
                          <div className="mt-1 text-xs text-muted-foreground/80">by {entry.author}</div>
                        ) : null}
                      </div>
                    </div>

                    {entry.body ? (
                      <Markdown className="mt-4 space-y-2" components={CHANGELOG_MARKDOWN_COMPONENTS}>
                        {entry.body}
                      </Markdown>
                    ) : null}
                  </div>
                  ))}

                {!isLoading && displayEntries.length === 0 && (
                  <div className="p-5 text-sm text-muted-foreground">No updates yet.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
