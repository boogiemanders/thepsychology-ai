'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { CHANGELOG_ENTRIES } from '@/lib/changelog'
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

export default function DashboardChangelogPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  if (!user) return null

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
          <p className="text-sm text-muted-foreground">Product updates and improvements.</p>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">What&apos;s new</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70dvh]">
              <div className="divide-y divide-border/60">
                {CHANGELOG_ENTRIES.map((entry) => (
                  <div key={`${entry.date}-${entry.title}`} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{entry.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatDate(entry.date)}</div>
                      </div>
                      {entry.tags?.length ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {entry.tags.map((tag) => (
                            <Badge key={`${entry.date}-${tag}`} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Markdown className="mt-4 space-y-2" components={CHANGELOG_MARKDOWN_COMPONENTS}>
                      {entry.body}
                    </Markdown>
                  </div>
                ))}
                {CHANGELOG_ENTRIES.length === 0 && (
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
