'use client'

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Source {
  id: string
  title: string
  doc: string
  category: string
  score: number
}

interface Turn {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  pending?: boolean
  error?: string
}

const DOC_LABEL: Record<string, string> = {
  'clinic-manual': 'Clinic Manual',
  'employee-handbook': 'Employee Handbook',
}

const CATEGORY_COLOR: Record<string, string> = {
  crisis: 'bg-[#d87758]/15 text-[#b3563a] border-[#d87758]/40 dark:text-[#e89477]',
  billing: 'bg-[#788c5d]/15 text-[#556a3f] border-[#788c5d]/40 dark:text-[#a3bc88]',
  booking: 'bg-[#6a9bcc]/15 text-[#497aae] border-[#6a9bcc]/40 dark:text-[#93bce0]',
  compliance: 'bg-zinc-400/10 text-zinc-600 border-zinc-400/40 dark:text-zinc-300',
  benefits: 'bg-amber-400/15 text-amber-700 border-amber-400/40 dark:text-amber-300',
  hr: 'bg-zinc-400/10 text-zinc-600 border-zinc-400/40 dark:text-zinc-300',
  'how-to': 'bg-violet-400/15 text-violet-700 border-violet-400/40 dark:text-violet-300',
  faq: 'bg-zinc-300/10 text-zinc-500 border-zinc-400/30 dark:text-zinc-400',
}

export function ChatbotShell({ sampleQuestions }: { sampleQuestions: string[] }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function ask(question: string) {
    if (!question.trim() || busy) return
    setBusy(true)
    setTurns(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', pending: true },
    ])
    setInput('')

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      setTurns(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last && last.pending) {
          next[next.length - 1] = {
            role: 'assistant',
            content: data.answer ?? '',
            sources: data.sources ?? [],
          }
        }
        return next
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setTurns(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last && last.pending) {
          next[next.length - 1] = { role: 'assistant', content: '', error: msg }
        }
        return next
      })
    } finally {
      setBusy(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 20)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    ask(input)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(input)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
          <Link href="/lab/inzinna/timeline" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Inzinna Lab
          </Link>
          <span>/</span>
          <span>Assistant</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          DIPS Assistant
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Ask the Clinic Manual and Employee Handbook. Internal use only. Every answer cites its source.
        </p>
      </header>

      {turns.length === 0 && (
        <section className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex-1 space-y-6">
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : ''}>
            {t.role === 'user' ? (
              <div className="inline-block max-w-[80%] rounded-2xl rounded-tr-sm bg-zinc-900 px-4 py-2.5 text-left text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                {t.content}
              </div>
            ) : (
              <div className="max-w-full">
                {t.pending ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]" />
                    <span className="ml-2">searching manual</span>
                  </div>
                ) : t.error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    {t.error}
                  </div>
                ) : (
                  <>
                    <div className="prose prose-sm prose-zinc max-w-none text-zinc-800 dark:prose-invert dark:text-zinc-200">
                      <ReactMarkdown>{t.content}</ReactMarkdown>
                    </div>
                    {t.sources && t.sources.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Sources</p>
                        <ol className="space-y-1.5">
                          {t.sources.map((s, idx) => (
                            <li key={s.id} className="flex items-start gap-2 text-xs">
                              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                {idx + 1}
                              </span>
                              <span className="text-zinc-800 dark:text-zinc-200">{s.title}</span>
                              <span className="text-zinc-500">· {DOC_LABEL[s.doc] ?? s.doc}</span>
                              <span
                                className={`rounded-full border px-1.5 py-px text-[10px] ${
                                  CATEGORY_COLOR[s.category] ?? CATEGORY_COLOR.faq
                                }`}
                              >
                                {s.category}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </section>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-0 mt-8 -mx-4 border-t border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/90"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything from the manual or handbook…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Ask
          </button>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500">
          Answers are grounded in the DIPS Clinic Manual + Employee Handbook. For clinical opinions, ask Greg or Bret. For admin,
          ask Carlos.
        </p>
      </form>
    </div>
  )
}
