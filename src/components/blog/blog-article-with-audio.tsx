'use client'

import { useCallback, useEffect, useRef } from 'react'
import type React from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rehypeReadAlongWords, buildReadAlongIndexMap } from '@/lib/rehype-read-along'
import { markdownToSpeakableText, normalizeTextForReadAlong } from '@/lib/speech-text'
import { WORD_REGEX } from '@/lib/audio-playback-utils'
import { BlogAudioPlayer } from './blog-audio-player'

function TitleWordSpans({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const regex = /\d+(?:\.\d+)+|[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g
  let last = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(<span key={match.index} className="tt-word">{match[0]}</span>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

interface BlogArticleWithAudioProps {
  content: string
  slug: string
  title: string
  author: string
  publishedDate: string | null
  tags: string[]
}

export function BlogArticleWithAudio({ content, slug, title, author, publishedDate, tags }: BlogArticleWithAudioProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const spansRef = useRef<HTMLSpanElement[]>([])
  const prevWordRef = useRef<number | null>(null)
  const alignmentMapRef = useRef<Array<number | null> | null>(null)

  // Build the LCS alignment map after render once DOM spans are available
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const spans = Array.from(root.querySelectorAll<HTMLSpanElement>('span.tt-word'))
    if (spans.length === 0) return
    spansRef.current = spans

    // Build the spoken word list the same way the TTS pipeline does
    const speakable = markdownToSpeakableText((title ? title + '\n\n' : '') + content)
    const normalized = normalizeTextForReadAlong(speakable)
    const spokenWords = Array.from(normalized.matchAll(WORD_REGEX)).map(
      (m) => m[0].toLowerCase()
    )

    if (spokenWords.length > 0) {
      alignmentMapRef.current = buildReadAlongIndexMap(spans, spokenWords)
    }
  }, [content])

  const handleWordProgress = useCallback((spokenWordIndex: number | null) => {
    const spans = spansRef.current

    // Map from spoken-word index to DOM span index using LCS alignment
    let spanIndex: number | null = null
    if (spokenWordIndex !== null && alignmentMapRef.current) {
      spanIndex = alignmentMapRef.current[spokenWordIndex] ?? null
    }

    // Remove highlight from previous span (direct array lookup, not attribute query)
    if (prevWordRef.current !== null && prevWordRef.current !== spanIndex) {
      spans[prevWordRef.current]?.classList.remove('tt-word-active')
    }

    prevWordRef.current = spanIndex

    if (spanIndex === null) {
      // Clear all highlights
      spans.forEach((el) => el.classList.remove('tt-word-active'))
      return
    }

    const span = spans[spanIndex]
    if (!span) return

    span.classList.add('tt-word-active')

    // Auto-scroll to keep active word visible
    const rect = span.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const playerHeight = 72 // approximate sticky bar height

    if (rect.bottom > viewportHeight - playerHeight || rect.top < 80) {
      span.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  return (
    <>
      <div ref={rootRef} className="tt-read-along-root prose prose-neutral dark:prose-invert max-w-none blog-article-with-audio">
        {/* Header rendered inside read-along root so title gets highlighted */}
        <div className="not-prose mb-10 space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/blog" className="underline underline-offset-4">Blog</Link>
            {' / '}
            <span className="text-foreground">{title}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <TitleWordSpans text={title} />
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{author}</span>
            {publishedDate && (
              <>
                <span aria-hidden="true">|</span>
                <time>{publishedDate}</time>
              </>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeReadAlongWords]}
        >
          {content}
        </ReactMarkdown>
      </div>

      <BlogAudioPlayer markdown={(title ? title + '\n\n' : '') + content} slug={slug} onWordProgress={handleWordProgress} />
    </>
  )
}
