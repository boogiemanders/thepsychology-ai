'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { ConsentGate } from './consent-gate'

type ConsentState = 'loading' | 'needs_login' | 'needed' | 'granted' | 'error'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type CrisisBanner = {
  message: string
  resources: { label: string; href: string }[]
} | null

export function SessionZeroClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [consentState, setConsentState] = useState<ConsentState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const checkConsent = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setConsentState('needs_login')
        return
      }

      const res = await fetch('/api/therapy-chat/consent', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        setConsentState('needed')
        return
      }

      const data = await res.json()
      const granted =
        data?.consented_to_ai_disclosure === true &&
        data?.consented_to_crisis_escalation_protocol === true &&
        data?.age_verified_adult === true
      setConsentState(granted ? 'granted' : 'needed')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error')
      setConsentState('error')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setConsentState('needs_login')
      return
    }
    void checkConsent()
  }, [user, authLoading, checkConsent])

  if (authLoading || consentState === 'loading') {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
  }
  if (consentState === 'needs_login') {
    return (
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-6 text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Sign in to continue
        </p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
          Session Zero is gated to signed-in adults so sessions stay private and continuous.
        </p>
        <button
          onClick={() => router.push('/login?redirect=/lab/session-zero')}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-80 transition-opacity duration-150 cursor-pointer"
        >
          Sign in
        </button>
      </div>
    )
  }
  if (consentState === 'error') {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Something went wrong. {errorMessage}
      </p>
    )
  }
  if (consentState === 'needed') {
    return <ConsentGate onGranted={() => setConsentState('granted')} />
  }

  return <SessionZeroChat />
}

function SessionZeroChat() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [crisis, setCrisis] = useState<CrisisBanner>(null)
  const [starting, setStarting] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasStartedRef = useRef(false)

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  // Start a session on mount (guarded against React strict-mode double-fire)
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    void startSession()
  }, [])

  async function startSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Sign in expired. Refresh the page.')
        setStarting(false)
        return
      }
      const res = await fetch('/api/therapy-chat/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Could not start a session.')
        setStarting(false)
        return
      }
      const data = await res.json()
      setSessionId(data.session.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setStarting(false)
    }
  }

  async function sendMessage() {
    const content = input.trim()
    if (!content || !sessionId || isSending) return
    setError('')
    setInput('')
    setIsSending(true)

    const userMsgId = `u-${Date.now()}`
    setMessages((m) => [...m, { id: userMsgId, role: 'user', content }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Session expired. Refresh and sign in again.')
        return
      }

      const res = await fetch('/api/therapy-chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ session_id: sessionId, content }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Message failed.')
        return
      }

      const contentType = res.headers.get('content-type') || ''

      // Crisis path: JSON response
      if (contentType.includes('application/json')) {
        const body = await res.json()
        if (body?.crisis) {
          setCrisis({
            message: body.message,
            resources: body.resources || [],
          })
          setMessages((m) => [
            ...m,
            { id: `a-${Date.now()}`, role: 'assistant', content: body.message },
          ])
          return
        }
        setError('Unexpected response shape.')
        return
      }

      // Streaming path
      if (!res.body) {
        setError('No response body.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        setStreamingText(buffer)
      }

      if (buffer) {
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: 'assistant', content: buffer },
        ])
      }
      setStreamingText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  if (starting) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Starting session...</p>
  }

  if (!sessionId) {
    return (
      <div className="rounded-md border border-red-200 dark:border-red-900/40 p-5">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || 'Could not start a session. Refresh and try again.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        ref={scrollRef}
        className="min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4 rounded-md border border-zinc-200 dark:border-zinc-800 p-5"
      >
        {messages.length === 0 && !streamingText && (
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Hi. What is on your mind today? I am here to think with you, not to tell you what
            you want to hear.
          </p>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {streamingText && <MessageBubble role="assistant" content={streamingText} />}

        {crisis && (
          <div className="rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-red-700 dark:text-red-400">
              Crisis resources
            </p>
            <div className="flex flex-wrap gap-2">
              {crisis.resources.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors duration-150"
                >
                  {r.label}
                </a>
              ))}
              <button
                onClick={() => setCrisis(null)}
                className="rounded-md border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors duration-150 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex items-end gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSending ? 'Thinking...' : 'What is on your mind?'}
          disabled={isSending}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 max-h-40"
        />
        <button
          onClick={() => void sendMessage()}
          disabled={!input.trim() || isSending}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-150 cursor-pointer"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
        Talking to AI, not a therapist. In crisis?{' '}
        <a href="tel:988" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Call 988
        </a>{' '}
        ·{' '}
        <Link href="/lab/plan-match" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
          Talk to a real psychologist
        </Link>
      </p>
    </div>
  )
}

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
