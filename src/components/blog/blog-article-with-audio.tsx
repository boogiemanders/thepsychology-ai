'use client'

import { useCallback, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rehypeReadAlongWords, buildReadAlongIndexMap } from '@/lib/rehype-read-along'
import { markdownToSpeakableText, normalizeTextForReadAlong } from '@/lib/speech-text'
import { WORD_REGEX } from '@/lib/audio-playback-utils'
import { BlogAudioPlayer } from './blog-audio-player'

interface BlogArticleWithAudioProps {
  content: string
  slug: string
}

export function BlogArticleWithAudio({ content, slug }: BlogArticleWithAudioProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const prevWordRef = useRef<number | null>(null)
  const alignmentMapRef = useRef<Array<number | null> | null>(null)

  // Build the LCS alignment map after render once DOM spans are available
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const spans = Array.from(root.querySelectorAll<HTMLSpanElement>('span.tt-word'))
    if (spans.length === 0) return

    // Build the spoken word list the same way the TTS pipeline does
    const speakable = markdownToSpeakableText(content)
    const normalized = normalizeTextForReadAlong(speakable)
    const spokenWords = Array.from(normalized.matchAll(WORD_REGEX)).map(
      (m) => m[0].toLowerCase()
    )

    if (spokenWords.length > 0) {
      alignmentMapRef.current = buildReadAlongIndexMap(spans, spokenWords)
    }
  }, [content])

  const handleWordProgress = useCallback((spokenWordIndex: number | null) => {
    const root = rootRef.current
    if (!root) return

    // Map from spoken-word index to DOM span index using LCS alignment
    let spanIndex: number | null = null
    if (spokenWordIndex !== null && alignmentMapRef.current) {
      spanIndex = alignmentMapRef.current[spokenWordIndex] ?? null
    }

    // Remove highlight from previous span
    if (prevWordRef.current !== null && prevWordRef.current !== spanIndex) {
      const prev = root.querySelector<HTMLSpanElement>(`[data-tt-word-index="${prevWordRef.current}"]`)
      prev?.classList.remove('tt-word-active')
    }

    prevWordRef.current = spanIndex

    if (spanIndex === null) {
      // Clear all highlights
      root.querySelectorAll('.tt-word-active').forEach((el) => el.classList.remove('tt-word-active'))
      return
    }

    const span = root.querySelector<HTMLSpanElement>(`[data-tt-word-index="${spanIndex}"]`)
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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeReadAlongWords]}
        >
          {content}
        </ReactMarkdown>
      </div>

      <BlogAudioPlayer markdown={content} slug={slug} onWordProgress={handleWordProgress} />
    </>
  )
}
