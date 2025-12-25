'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, RotateCcw, Send } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
}

function newMessageId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const INITIAL_ASSISTANT_MESSAGE =
  "How's studying been going?"

export default function RecoverPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: newMessageId(), role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE },
  ])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(
    () => draft.trim().length > 0 && !isSending && disclaimerAccepted,
    [draft, isSending, disclaimerAccepted]
  )

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, router, user])

  useEffect(() => {
    if (!user?.id) return
    const key = `recover_disclaimer_ack_${user.id}`
    const value = localStorage.getItem(key)
    const accepted = value === '1'
    setDisclaimerAccepted(accepted)
    setDisclaimerOpen(!accepted)
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const resetChat = () => {
    setError(null)
    setDraft('')
    setMessages([{ id: newMessageId(), role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE }])
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Recover</h1>
              <Badge variant="outline">Not psychotherapy</Badge>
            </div>
            <p className="text-muted-foreground">
              A supportive chat that blends Acceptance & Commitment Therapy (ACT) and Motivational Interviewing (MI).
            </p>
          </div>
          <Button variant="outline" onClick={resetChat} className="shrink-0">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Not psychotherapy or mental health advice</AlertTitle>
          <AlertDescription>
            This is an educational tool for general support and skill-building, not diagnosis or treatment. If you’re
            in immediate danger or considering self-harm, call 911 or 988 (US), or your local emergency number.
            If you indicate imminent risk of harm, the site administrator may be notified for safety.
          </AlertDescription>
        </Alert>

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

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[52vh]">
              <div className="p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm whitespace-pre-wrap'
                          : 'max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm whitespace-pre-wrap'
                      }
                    >
                      <div>{m.content}</div>
                      {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                        <details className="mt-2 text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">
                            References ({m.sources.length})
                          </summary>
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
