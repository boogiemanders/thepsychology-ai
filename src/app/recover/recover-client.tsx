'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldAlert, RotateCcw, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '@/context/auth-context'
import { getRecoverInitialAssistantMessage } from '@/lib/recover'
import { supabase } from '@/lib/supabase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

type ChatSource = {
  citation: string
  similarity?: number
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  tag?: string
}

function newMessageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default function RecoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const entry = searchParams.get('entry')
  const returnToRaw = searchParams.get('returnTo')
  const returnTo = useMemo(() => {
    if (!returnToRaw) return null
    try {
      const decoded = decodeURIComponent(returnToRaw)
      if (decoded.startsWith('/')) return decoded
    } catch {
      if (returnToRaw.startsWith('/')) return returnToRaw
    }
    return null
  }, [returnToRaw])
  const initialMessage = useMemo(() => getRecoverInitialAssistantMessage(entry), [entry])

  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [showReturnBanner, setShowReturnBanner] = useState(false)
  const [sessionId, setSessionId] = useState<string>(newMessageId)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: newMessageId(), role: 'assistant', content: initialMessage },
  ])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const insightsInjectedRef = useRef(false)

  const canSend = useMemo(
    () => draft.trim().length > 0 && !isSending && disclaimerAccepted,
    [draft, isSending, disclaimerAccepted]
  )

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, router, user])

  useEffect(() => {
    setShowReturnBanner(false)
    if (entry !== 'quick-reset' || !returnTo) return
    const timer = window.setTimeout(() => setShowReturnBanner(true), 5 * 60 * 1000)
    return () => window.clearTimeout(timer)
  }, [entry, returnTo])

  useEffect(() => {
    if (!user?.id) return
    const sessionKey = `recover_session_${user.id}`
    const existingSession = localStorage.getItem(sessionKey)
    if (existingSession && isUuid(existingSession)) {
      setSessionId(existingSession.trim())
    } else {
      const nextSession = newMessageId()
      localStorage.setItem(sessionKey, nextSession)
      setSessionId(nextSession)
    }

    const key = `recover_disclaimer_ack_${user.id}`
    const value = localStorage.getItem(key)
    const accepted = value === '1'
    setDisclaimerAccepted(accepted)
    setDisclaimerOpen(!accepted)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || insightsInjectedRef.current) return

    const loadInsights = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        const token = data.session?.access_token
        if (!token) return

        const response = await fetch('/api/recover-insights', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load insights')
        }

        const insights = Array.isArray(payload?.insights) ? payload.insights : []
        if (insights.length === 0) return

        const nextMessages = insights
          .map((insight: any) => {
            const content = typeof insight?.message === 'string' ? insight.message.trim() : ''
            if (!content) return null
            return {
              id: newMessageId(),
              role: 'assistant' as const,
              content,
              tag: 'New Recommendation from Founder',
            }
          })
          .filter(Boolean) as ChatMessage[]

        if (nextMessages.length > 0) {
          setMessages((prev) => [...prev, ...nextMessages])
        }
      } catch (err) {
        console.error('[recover] Failed to load approved insights:', err)
      } finally {
        insightsInjectedRef.current = true
      }
    }

    void loadInsights()
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const resetChat = () => {
    setError(null)
    setDraft('')
    setMessages([{ id: newMessageId(), role: 'assistant', content: initialMessage }])
    if (user?.id) {
      const nextSession = newMessageId()
      localStorage.setItem(`recover_session_${user.id}`, nextSession)
      setSessionId(nextSession)
    } else {
      setSessionId(newMessageId())
    }
  }

  const sendMessage = async () => {
    const userText = draft.trim()
    if (!userText || isSending || !disclaimerAccepted) return

    setError(null)
    setIsSending(true)
    setDraft('')

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: newMessageId(), role: 'user', content: userText },
    ]

    setMessages(nextMessages)

    try {
      const response = await fetch('/api/recover-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          sessionId,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Failed to get a response.'
        throw new Error(message)
      }

      const assistantText = typeof data?.message === 'string' ? data.message : ''
      if (!assistantText) throw new Error('Empty response from assistant.')

      const sources = Array.isArray(data?.sources)
        ? (data.sources as Array<{ citation?: unknown; similarity?: unknown }>).flatMap((s) => {
            if (typeof s?.citation !== 'string' || !s.citation.trim()) return []
            const similarity = typeof s.similarity === 'number' ? s.similarity : undefined
            return [{ citation: s.citation.trim(), similarity }]
          })
        : undefined

      setMessages((prev) => [
        ...prev,
        { id: newMessageId(), role: 'assistant', content: assistantText, sources },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setIsSending(false)
      // Refocus the textarea after sending
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const acceptDisclaimer = () => {
    if (!user?.id) return
    localStorage.setItem(`recover_disclaimer_ack_${user.id}`, '1')
    setDisclaimerAccepted(true)
    setDisclaimerOpen(false)
  }

  return (
    <main className="h-dvh bg-background overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10 h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Recover</h1>
            </div>
            <p className="text-muted-foreground">
              Supportive chat informed by ACT and MI.
            </p>
          </div>
          <Button variant="outline" onClick={resetChat} className="shrink-0">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <div>
              Educational support tool, not diagnosis or treatment. If you’re in immediate danger or considering
              self-harm, call 911 or 988 (US), or your local emergency number. If you indicate imminent risk of harm,
              the site administrator may be notified for safety.
            </div>
          </div>
        </div>

        {showReturnBanner && returnTo && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-900/70 dark:text-amber-200/80">
            <Link
              href={returnTo}
              className="block transition-colors hover:text-amber-900 dark:hover:text-amber-100"
            >
              Ready to jump back in? Return to where you left off.
            </Link>
          </div>
        )}

        <AlertDialog open={disclaimerOpen} onOpenChange={setDisclaimerOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Before you start</AlertDialogTitle>
              <AlertDialogDescription>
                Recover is not psychotherapy and not mental health advice. It can’t provide diagnosis or treatment.
                If you’re in immediate danger or considering self-harm, call 911 or 988 (US), or your local emergency
                number.
                If you indicate imminent risk of harm, the site administrator may be notified for safety.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDisclaimerOpen(false)
                  router.push('/dashboard')
                }}
              >
                Go back
              </AlertDialogCancel>
              <AlertDialogAction onClick={acceptDisclaimer}>I understand</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
          <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm'
                          : 'max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm'
                      }
                    >
                      <div className="space-y-2">
                        {m.tag && (
                          <span className="inline-flex items-center rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {m.tag}
                          </span>
                        )}
                        <MarkdownMessage content={m.content} />
                      </div>
                      {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                        <details className="mt-2 text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">References ({m.sources.length})</summary>
                          <ul className="mt-1 list-disc pl-4">
                            {m.sources.map((source, idx) => (
                              <li key={`${source.citation}-${idx}`} className="break-words">
                                {source.citation}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-4 space-y-2">
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="w-full flex gap-2">
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for a new line)"
                className="min-h-[52px] max-h-[160px]"
                disabled={isSending || !disclaimerAccepted}
              />
              <Button onClick={sendMessage} disabled={!canSend} className="shrink-0">
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
