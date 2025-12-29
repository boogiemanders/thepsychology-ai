'use client'

import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { X, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimplePromptInput } from '@/components/ui/simple-prompt-input'
import { TypographyH1, TypographyH2, TypographyH3, TypographyMuted } from '@/components/ui/typography'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { HexColorPicker } from 'react-colorful'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Kbd } from '@/components/ui/kbd'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getUserCurrentInterest, updateUserCurrentInterest, subscribeToUserInterestChanges, unsubscribeFromInterestChanges } from '@/lib/interests'
import {
  getUserLanguagePreference,
  subscribeToUserLanguagePreferenceChanges,
  unsubscribeFromLanguagePreferenceChanges,
  updateUserLanguagePreference,
} from '@/lib/language-preference'
import { getLessonDisplayName } from '@/lib/topic-display-names'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '@/context/auth-context'
import { getQuizResults, type WrongAnswer } from '@/lib/quiz-results-storage'
import { deriveTopicMetaFromQuestionSource } from '@/lib/topic-source-utils'
import { PulseSpinner } from '@/components/PulseSpinner'
import Lottie from 'lottie-react'
import textLoadingAnimation from '../../../public/animations/text-loading.json'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { MagicCard } from '@/components/ui/magic-card'
import { PulsatingButton } from '@/components/ui/pulsating-button'
import { InlineSvg } from '@/components/ui/inline-svg'
import { VariableStar } from '@/components/ui/variable-star'
import { recordStudySession } from '@/lib/study-sessions'
import { QuestionFeedbackButton } from '@/components/question-feedback-button'
import { SmartExplanationButton } from '@/components/smart-explanation-button'
import { getEntitledSubscriptionTier } from '@/lib/subscription-utils'
import { LessonAudioControls, type LessonAudioControlsHandle } from '@/components/topic-teacher/lesson-audio-controls'
import { normalizeTextForReadAlong } from '@/lib/speech-text'
import { markdownToSpeakableText } from '@/lib/speech-text'
import { TopicTeacherTourProvider, useTopicTeacherTour } from '@/components/onboarding/TopicTeacherTourProvider'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface HighlightData {
  recentlyWrongSections: string[]
  recentlyCorrectSections: string[]
  previouslyWrongNowCorrectSections: string[]
  quizWrongSections: string[]
  examWrongSections: string[]
}

interface PracticeExamQuestion {
  id?: number | string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  source_file?: string
  source_folder?: string
  topicName?: string
  domainId?: string
  relatedSections?: string[]
  [key: string]: any
}

interface WrongPracticeExamQuestion {
  questionIndex: number
  question: PracticeExamQuestion
  selectedAnswer: string
}

const GENERIC_SECTION_NAMES = new Set([
  'main content',
  'main concept',
  'sub-concept',
  'general overview',
  'overview',
  'topic overview',
  'topic summary',
  'full topic',
  'entire topic',
  'core content',
  'whole topic',
  'entire section',
  'lesson overview',
])

type HastNode = {
  type: string
  tagName?: string
  value?: string
  children?: HastNode[]
  properties?: Record<string, unknown>
}

const READ_ALONG_WORD_REGEX = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g
const READ_ALONG_SKIP_TAGS = new Set(['pre', 'script', 'style', 'svg', 'code'])
const READ_ALONG_SKIP_SELECTOR = Array.from(READ_ALONG_SKIP_TAGS).join(',')
const EPPP_WORD_REGEX = /\bE\.?P\.?P\.?P\.?\b/i
const ACRONYM_WORD_REGEX = /^[A-Z]{2,5}$/
const ACRONYM_VOWEL_REGEX = /[AEIOUY]/

function splitTextForReadAlong(value: string, wordIndexRef: { current: number }): HastNode[] {
  if (!value) return []

  const nodes: HastNode[] = []
  let lastIndex = 0
  READ_ALONG_WORD_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = READ_ALONG_WORD_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, match.index) })
    }

    const word = match[0]
    nodes.push({
      type: 'element',
      tagName: 'span',
      properties: {
        className: 'tt-word',
        'data-tt-word-index': String(wordIndexRef.current),
      },
      children: [{ type: 'text', value: word }],
    })
    wordIndexRef.current += 1
    lastIndex = match.index + word.length
  }

  if (lastIndex < value.length) {
    nodes.push({ type: 'text', value: value.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', value }]
}

function wrapReactNodeWords(node: React.ReactNode, wordIndexRef: { current: number }): React.ReactNode {
  if (node === null || node === undefined || typeof node === 'boolean') return node

  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node)
    if (!text) return node
    READ_ALONG_WORD_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    let lastIndex = 0
    const parts: React.ReactNode[] = []

    while ((match = READ_ALONG_WORD_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      const word = match[0]
      parts.push(
        <span
          key={`tt-word-${wordIndexRef.current}`}
          className="tt-word"
          data-tt-word-index={wordIndexRef.current}
        >
          {word}
        </span>
      )

      wordIndexRef.current += 1
      lastIndex = match.index + word.length
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  if (Array.isArray(node)) {
    const wrapped = node.flatMap((child) => {
      const next = wrapReactNodeWords(child, wordIndexRef)
      return Array.isArray(next) ? next : [next]
    })
    return wrapped.length > 0 ? wrapped : node
  }

  if (isValidElement(node)) {
    const type = node.type
    if (typeof type === 'string') {
      if (READ_ALONG_SKIP_TAGS.has(type)) return node
      if (type === 'span') {
        const className = typeof node.props?.className === 'string' ? node.props.className : ''
        if (className.includes('tt-word') || node.props?.['data-tt-word-index'] !== undefined) {
          return node
        }
      }
    }

    const wrappedChildren = wrapReactNodeWords(node.props?.children, wordIndexRef)
    return cloneElement(node, node.props, wrappedChildren)
  }

  return node
}

function wrapReadAlongWordsInContainer(container: HTMLElement): HTMLSpanElement[] {
  const wordIndexRef = { current: 0 }
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text)
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? ''
    if (!text.trim()) continue
    const parent = textNode.parentElement
    if (!parent) continue
    if (parent.closest(READ_ALONG_SKIP_SELECTOR)) continue
    if (parent.closest('span.tt-word')) continue

    READ_ALONG_WORD_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    let lastIndex = 0
    let hasWord = false
    const fragment = document.createDocumentFragment()

    while ((match = READ_ALONG_WORD_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.append(document.createTextNode(text.slice(lastIndex, match.index)))
      }

      const word = match[0]
      const span = document.createElement('span')
      span.className = 'tt-word'
      span.setAttribute('data-tt-word-index', String(wordIndexRef.current))
      span.textContent = word
      fragment.append(span)

      wordIndexRef.current += 1
      lastIndex = match.index + word.length
      hasWord = true
    }

    if (!hasWord) continue

    if (lastIndex < text.length) {
      fragment.append(document.createTextNode(text.slice(lastIndex)))
    }

    parent.replaceChild(fragment, textNode)
  }

  return Array.from(container.querySelectorAll<HTMLSpanElement>('span.tt-word'))
}

type ReadAlongWordEntry = { word: string; index: number }

function normalizeReadAlongWord(word: string): string {
  const normalized = word.trim().toLowerCase()
  return normalized.replace(/['\u2019]s$/i, '')
}

function buildSequentialReadAlongMap(spans: HTMLSpanElement[]): Array<number | null> {
  const map: Array<number | null> = []
  spans.forEach((span, index) => {
    const text = (span.textContent || '').trim()
    if (!text) return
    if (EPPP_WORD_REGEX.test(text)) {
      map.push(index, index, index)
    } else {
      map.push(index)
    }
  })
  return map
}

function buildReadAlongWordEntries(spans: HTMLSpanElement[]): ReadAlongWordEntry[] {
  const entries: ReadAlongWordEntry[] = []
  spans.forEach((span, index) => {
    const text = (span.textContent || '').trim()
    if (!text) return
    if (EPPP_WORD_REGEX.test(text)) {
      entries.push(
        { word: 'e', index },
        { word: 'triple', index },
        { word: 'p', index }
      )
    } else if (ACRONYM_WORD_REGEX.test(text) && !ACRONYM_VOWEL_REGEX.test(text)) {
      text.split('').forEach((letter) => {
        entries.push({ word: letter.toLowerCase(), index })
      })
    } else {
      entries.push({ word: normalizeReadAlongWord(text), index })
    }
  })
  return entries
}

function buildReadAlongIndexMap(
  spans: HTMLSpanElement[],
  spokenWords: string[]
): Array<number | null> {
  if (spans.length === 0 || spokenWords.length === 0) return []

  const entries = buildReadAlongWordEntries(spans)
  if (entries.length === 0) return []

  const displayWords = entries.map((entry) => entry.word)
  const n = spokenWords.length
  const m = displayWords.length

  if (n === 0 || m === 0) return []
  if (n > 65000 || m > 65000) {
    return new Array(spokenWords.length).fill(null)
  }

  const rowLen = m + 1
  const dirs = new Uint8Array((n + 1) * rowLen)
  let prev = new Uint16Array(rowLen)
  let curr = new Uint16Array(rowLen)

  for (let i = 1; i <= n; i += 1) {
    curr[0] = 0
    const spokenWord = spokenWords[i - 1]
    const baseIdx = i * rowLen
    for (let j = 1; j <= m; j += 1) {
      if (spokenWord === displayWords[j - 1]) {
        curr[j] = prev[j - 1] + 1
        dirs[baseIdx + j] = 1
      } else if (prev[j] >= curr[j - 1]) {
        curr[j] = prev[j]
        dirs[baseIdx + j] = 2
      } else {
        curr[j] = curr[j - 1]
        dirs[baseIdx + j] = 3
      }
    }
    const swap = prev
    prev = curr
    curr = swap
  }

  const map: Array<number | null> = new Array(spokenWords.length).fill(null)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const dir = dirs[i * rowLen + j]
    if (dir === 1) {
      map[i - 1] = entries[j - 1].index
      i -= 1
      j -= 1
    } else if (dir === 2) {
      i -= 1
    } else {
      j -= 1
    }
  }

  return map
}

function rehypeReadAlongWords() {
  return (tree: HastNode) => {
    const wordIndexRef = { current: 0 }

    const visit = (node: HastNode) => {
      if (!node || !node.children) return
      if (node.type === 'element' && node.tagName && READ_ALONG_SKIP_TAGS.has(node.tagName)) {
        return
      }

      const nextChildren: HastNode[] = []
      for (const child of node.children) {
        if (child.type === 'text') {
          nextChildren.push(...splitTextForReadAlong(child.value ?? '', wordIndexRef))
          continue
        }
        visit(child)
        nextChildren.push(child)
      }
      node.children = nextChildren
    }

    visit(tree)
  }
}

function extractTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('')
  if (isValidElement(node)) return extractTextFromReactNode(node.props.children)
  return ''
}

// Helper component for overlapping stars with shared hover state
function OverlappingStarButtons({
  examMatched,
  quizMatched,
  starColor,
  quizStarColor,
  setActiveMissedQuestion,
  setMissedQuestionDialogOpen,
  setActiveQuizQuestion,
  children,
  isH2Header = false
}: {
  examMatched: any
  quizMatched: any
  starColor: string
  quizStarColor: string
  setActiveMissedQuestion: (q: any) => void
  setMissedQuestionDialogOpen: (open: boolean) => void
  setActiveQuizQuestion: (q: any) => void
  children: React.ReactNode
  isH2Header?: boolean
}) {
  const [sharedHover, setSharedHover] = useState(false)
  const topClass = isH2Header ? 'top-10' : 'top-0'

  return (
    <div className="relative">
      {examMatched && (
        <button
          type="button"
          className={`apple-pulsate absolute -left-10 ${topClass} flex h-6 w-6 items-center justify-center rounded-full`}
          onClick={() => {
            setActiveMissedQuestion(examMatched)
            if (quizMatched) setActiveQuizQuestion(quizMatched)
            setMissedQuestionDialogOpen(true)
          }}
          aria-label={quizMatched ? "Review missed questions (exam + quiz)" : "Review missed practice exam question"}
          title={quizMatched ? "Review missed questions (exam + quiz)" : "Review missed practice exam question"}
        >
          <VariableStar
            color={starColor}
            externalHoverState={sharedHover}
            onHoverChange={setSharedHover}
          />
        </button>
      )}
      {quizMatched && (
        <button
          type="button"
          className={`apple-pulsate absolute -left-10 ${topClass} flex h-6 w-6 items-center justify-center rounded-full`}
          onClick={() => {
            setActiveQuizQuestion(quizMatched)
            if (examMatched) setActiveMissedQuestion(examMatched)
            setMissedQuestionDialogOpen(true)
          }}
          aria-label={examMatched ? "Review missed questions (quiz + exam)" : "Review missed quiz question"}
          title={examMatched ? "Review missed questions (quiz + exam)" : "Review missed quiz question"}
          style={examMatched ? { marginLeft: '4px', marginTop: '10px' } : {}}
        >
          <VariableStar
            color={quizStarColor}
            externalHoverState={sharedHover}
            onHoverChange={setSharedHover}
          />
        </button>
      )}
      {children}
    </div>
  )
}

// Tutorial button component - uses the tour hook from inside the provider
function TutorialButton() {
  const { startTour } = useTopicTeacherTour()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTour}
      className="h-8 px-2 text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="w-4 h-4 mr-1" />
      Tutorial
    </Button>
  )
}

// Tutorial star legend - shows fake stars during tutorial if user has none
interface TutorialStarLegendProps {
  hasRealStars: boolean
  starColor: string
  onStarClick: () => void
}

function TutorialStarLegend({ hasRealStars, starColor, onStarClick }: TutorialStarLegendProps) {
  const { showTutorialStars } = useTopicTeacherTour()

  // Only show tutorial stars if tour needs them AND user has no real stars
  if (!showTutorialStars || hasRealStars) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-4"
      data-tour="star-legend-top"
    >
      <p className="text-sm text-foreground/80">
        <VariableStar
          className="inline-block mr-1"
          onClick={onStarClick}
          title="Click to change star color"
          color={starColor}
        /> Most recent practice exam: <span className="italic text-muted-foreground">(Example for tutorial)</span>
      </p>
    </motion.div>
  )
}

// Tutorial section star - wraps a section header with a tutorial star when needed
interface TutorialSectionStarProps {
  hasRealStars: boolean
  starColor: string
  children: React.ReactNode
  isFirstSection: boolean
}

function TutorialSectionStar({ hasRealStars, starColor, children, isFirstSection }: TutorialSectionStarProps) {
  const { showTutorialStars } = useTopicTeacherTour()

  // Only show on first section, when tour needs stars, and user has no real stars
  const shouldShow = showTutorialStars && !hasRealStars && isFirstSection

  if (!shouldShow) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div
        className="absolute -left-10 top-0 flex h-6 w-6 items-center justify-center rounded-full opacity-70"
        title="Example star for tutorial"
      >
        <VariableStar color={starColor} />
      </div>
      {children}
    </div>
  )
}

export function TopicTeacherContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const domain = searchParams.get('domain')
  const topic = searchParams.get('topic')
  const hasExamResults = searchParams.get('hasExamResults') === 'true'
  const decodeParam = (value: string | null): string => {
    if (!value) return ''
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  const decodedTopic = decodeParam(topic)
  const displayLessonName = getLessonDisplayName(decodedTopic)
  const normalizedTopicName = decodedTopic ? decodedTopic.trim().toLowerCase() : ''

  const normalizeSectionName = (section?: string | null): string | null => {
    if (!section) return null
    const trimmed = section.trim()
    if (!trimmed) return null
    const normalized = trimmed.toLowerCase()

    // Drop truly generic labels from exam history; they aren't useful
    if (GENERIC_SECTION_NAMES.has(normalized)) {
      return null
    }

    return trimmed
  }

  const normalizeSections = (
    sections?: string[],
    options: { allowAll?: boolean } = {}
  ): string[] => {
    const { allowAll = true } = options
    if (!sections || sections.length === 0) return []

    const normalized = sections
      .map((section) => normalizeSectionName(section))
      .filter((section): section is string => Boolean(section))

    return normalized
  }

  const [messages, setMessages] = useState<Message[]>([])
  const lessonMarkdown = messages[0]?.role === 'assistant' ? messages[0].content : ''
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingMetaphors, setIsRefreshingMetaphors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)
  const [interestsInput, setInterestsInput] = useState('')
  const [currentInterestInput, setCurrentInterestInput] = useState('')
  const [savedInterests, setSavedInterests] = useState<string[]>([])
  const [userInterests, setUserInterests] = useState<string | null>(null)
  const [previousUserInterests, setPreviousUserInterests] = useState<string | null>(null)
  const [interestsLoaded, setInterestsLoaded] = useState(false)
  const [baseContent, setBaseContent] = useState<string>('')
  const [metaphorRanges, setMetaphorRanges] = useState<Array<{ start: number; end: number }>>([])
  const [personalizedCache, setPersonalizedCache] = useState<Record<string, string>>({})
  const [showColorPicker, setShowColorPicker] = useState(false)
  const lessonContentRef = useRef<HTMLDivElement | null>(null)
  const audioControlsRef = useRef<LessonAudioControlsHandle | null>(null)
  const wordSpansRef = useRef<HTMLSpanElement[]>([])
  const wordIndexMapRef = useRef<Array<number | null>>([])
  const displayToSpokenIndexRef = useRef<Array<number | null>>([])
  const activeWordIndexRef = useRef<number | null>(null)
  const autoScrollRef = useRef(false)
  const [readAlongReady, setReadAlongReady] = useState(false)
  const [readAlongEnabled, setReadAlongEnabled] = useState(true)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const readAlongWordCounterRef = useRef(0)
  const spokenWords = useMemo(() => {
    if (!lessonMarkdown.trim()) return []
    const speakable = normalizeTextForReadAlong(markdownToSpeakableText(lessonMarkdown))
    const matches = speakable.match(READ_ALONG_WORD_REGEX)
    return matches ? matches.map((word) => normalizeReadAlongWord(word)) : []
  }, [lessonMarkdown])

  const syncReadAlongSpans = (options: { updateState?: boolean } = {}) => {
    const container = lessonContentRef.current
    if (!container) {
      wordSpansRef.current = []
      wordIndexMapRef.current = []
      displayToSpokenIndexRef.current = []
      if (options.updateState) {
        setReadAlongReady(false)
      }
      return []
    }

    let spans = Array.from(
      container.querySelectorAll<HTMLSpanElement>('span.tt-word, span[data-tt-word-index]')
    )
    if (spans.length === 0 && typeof window !== 'undefined') {
      spans = wrapReadAlongWordsInContainer(container)
    }

    wordSpansRef.current = spans
    const alignedMap = buildReadAlongIndexMap(spans, spokenWords)
    const spokenToDisplay = alignedMap.length > 0 ? alignedMap : buildSequentialReadAlongMap(spans)
    wordIndexMapRef.current = spokenToDisplay
    const inverseMap: Array<number | null> = new Array(spans.length).fill(null)
    spokenToDisplay.forEach((spanIndex, spokenIndex) => {
      if (spanIndex === null || spanIndex === undefined) return
      if (inverseMap[spanIndex] === null) {
        inverseMap[spanIndex] = spokenIndex
      }
    })
    displayToSpokenIndexRef.current = inverseMap

    if (options.updateState) {
      setReadAlongReady(spans.length > 0)
    }

    return spans
  }

  useEffect(() => {
    if (!user?.id) return
    const start = Date.now()

    return () => {
      const end = Date.now()
      const durationSeconds = Math.round((end - start) / 1000)
      if (durationSeconds < 5) return
      recordStudySession({
        userId: user.id,
        feature: 'topic-teacher',
        startedAt: new Date(start),
        endedAt: new Date(end),
        durationSeconds,
        metadata: {
          topic: decodedTopic,
          domain,
        },
      })
    }
  }, [user?.id, decodedTopic, domain])

  useEffect(() => {
    autoScrollRef.current = readAlongEnabled && autoScrollEnabled
  }, [autoScrollEnabled, readAlongEnabled])

  useEffect(() => {
    const container = lessonContentRef.current
    if (!readAlongEnabled || !container || !lessonMarkdown.trim()) {
      wordSpansRef.current = []
      wordIndexMapRef.current = []
      displayToSpokenIndexRef.current = []
      activeWordIndexRef.current = null
      setReadAlongReady(false)
      return
    }

    const spans = syncReadAlongSpans({ updateState: true })
    activeWordIndexRef.current = null
    spans.forEach((span) => span.classList.remove('tt-word-active'))
  }, [lessonMarkdown, readAlongEnabled])

  const handleWordProgress = useCallback(
    (payload: { wordIndex: number | null; totalWords: number }) => {
      const container = lessonContentRef.current
      let spans = wordSpansRef.current
      let map = wordIndexMapRef.current

      const spansConnected =
        spans.length > 0 &&
        spans[0] instanceof HTMLElement &&
        spans[0].isConnected &&
        (!container || container.contains(spans[0]))

      if (spans.length === 0 || map.length === 0 || !spansConnected) {
        spans = syncReadAlongSpans()
        map = wordIndexMapRef.current
      }

      if (spans.length === 0) return
      if (map.length === 0) return

      const nextWordIndex = payload.wordIndex
      if (nextWordIndex === null || !Number.isFinite(nextWordIndex)) {
        if (activeWordIndexRef.current !== null) {
          spans[activeWordIndexRef.current]?.classList.remove('tt-word-active')
        }
        activeWordIndexRef.current = null
        return
      }

      const clampedWordIndex = Math.max(0, Math.min(Math.floor(nextWordIndex), map.length - 1))
      const spanIndex = map[clampedWordIndex]
      if (spanIndex === null || spanIndex === undefined) return
      if (activeWordIndexRef.current === spanIndex) return

      if (activeWordIndexRef.current !== null) {
        spans[activeWordIndexRef.current]?.classList.remove('tt-word-active')
      }

      const target = spans[spanIndex]
      if (!target) {
        activeWordIndexRef.current = null
        return
      }

      target.classList.add('tt-word-active')
      activeWordIndexRef.current = spanIndex

      if (!autoScrollRef.current || typeof window === 'undefined') return
      const rect = target.getBoundingClientRect()
      const topBuffer = 140
      const bottomBuffer = 220
      if (rect.top < topBuffer || rect.bottom > window.innerHeight - bottomBuffer) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    []
  )

  const handleReadAlongClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!readAlongEnabled) return
      const audioControls = audioControlsRef.current
      if (!audioControls) return

      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('a, button, input, textarea, select, label')) return

      const wordEl = target.closest('span.tt-word') as HTMLSpanElement | null
      if (!wordEl) return
      const indexAttr = wordEl.getAttribute('data-tt-word-index')
      if (!indexAttr) return
      const displayIndex = Number.parseInt(indexAttr, 10)
      if (!Number.isFinite(displayIndex)) return

      const inverseMap = displayToSpokenIndexRef.current
      let spokenIndex = inverseMap[displayIndex]

      if (spokenIndex === null || spokenIndex === undefined) {
        const maxDistance = 6
        for (let offset = 1; offset <= maxDistance; offset += 1) {
          const prev = inverseMap[displayIndex - offset]
          const next = inverseMap[displayIndex + offset]
          if (prev !== null && prev !== undefined) {
            spokenIndex = prev
            break
          }
          if (next !== null && next !== undefined) {
            spokenIndex = next
            break
          }
        }
      }

      if (spokenIndex === null || spokenIndex === undefined) {
        if (displayIndex >= 0 && displayIndex < spokenWords.length) {
          spokenIndex = displayIndex
        }
      }

      if (spokenIndex === null || spokenIndex === undefined) return
      audioControls.seekToWord(spokenIndex)
    },
    [readAlongEnabled, spokenWords.length]
  )
  const [starColor, setStarColor] = useState('#000000')
  const [showQuizColorPicker, setShowQuizColorPicker] = useState(false)
  const [quizStarColor, setQuizStarColor] = useState('#000000')
  const [highlightData, setHighlightData] = useState<HighlightData>({
    recentlyWrongSections: [],
    recentlyCorrectSections: [],
    previouslyWrongNowCorrectSections: [],
    quizWrongSections: [],
    examWrongSections: [],
  })
  const [practiceExamWrongQuestions, setPracticeExamWrongQuestions] = useState<
    WrongPracticeExamQuestion[]
  >([])
  const [isLoadingPracticeExamWrongQuestions, setIsLoadingPracticeExamWrongQuestions] =
    useState(false)
  const [practiceExamWrongQuestionsError, setPracticeExamWrongQuestionsError] =
    useState<string | null>(null)
  const [quizWrongAnswers, setQuizWrongAnswers] = useState<WrongAnswer[]>([])
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<WrongAnswer | null>(null)
  const [matchedExamTerms, setMatchedExamTerms] = useState<string[]>([])
  // Map from question index to best matched term (keeps only one term per question)
  const matchedExamTermsRef = useRef<Map<number, string>>(new Map())
  // Map from quiz question ID to best matched term (keeps only one star per quiz question)
  const matchedQuizTermsRef = useRef<Map<number, string>>(new Map())
  // Track when we're inside the "Key Takeaways for the EPPP" section
  const isInKeyTakeawaysSection = useRef(false)
  // Track when we're inside an intro "Why X Matters" section - skip matching there
  const isInIntroSection = useRef(false)
  // Track if we've shown the first tutorial star (reset when tour changes)
  const hasShownTutorialStar = useRef(false)
  const [missedQuestionDialogOpen, setMissedQuestionDialogOpen] = useState(false)
  const [activeMissedQuestion, setActiveMissedQuestion] =
    useState<WrongPracticeExamQuestion | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSectionRef = useRef<string>('')
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const languageSubscriptionRef = useRef<RealtimeChannel | null>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [languagePreference, setLanguagePreference] = useState<string | null>(null)
  const [languageInput, setLanguageInput] = useState('')
  const [lastTranslationCacheKey, setLastTranslationCacheKey] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const assistantEnglishContentRef = useRef<Record<number, string>>({})
  const translationControllerRef = useRef<AbortController | null>(null)
  const translationPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const translationSessionRef = useRef(0)
  const interestSnapshotRef = useRef<string>('')
  const [isMetaphorUpdating, setIsMetaphorUpdating] = useState(false)

  const buildTranslationCacheKey = (
    topicName?: string | null,
    domainName?: string | null,
    language?: string | null,
    interests?: string | null
  ): string | null => {
    if (!topicName || !language) return null
    const normalizedTopic = topicName.trim().toLowerCase()
    const normalizedLanguage = language.trim().toLowerCase()
    if (!normalizedTopic || !normalizedLanguage) return null
    const normalizedDomain = domainName?.trim().toLowerCase() || 'none'
    const normalizedInterests = interests?.trim().toLowerCase() || 'none'
    return `tt_translation__${normalizedTopic}__${normalizedDomain}__${normalizedLanguage}__${normalizedInterests}`
  }

  const normalizeLanguageInput = (raw: string): string | null => {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const lower = trimmed.toLowerCase()
    if (lower === 'english' || lower === 'en' || lower === 'eng') return null
    return trimmed
  }

  const getCachedTranslation = (cacheKey: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(cacheKey)
    } catch (error) {
      console.debug('Unable to read translation cache:', error)
      return null
    }
  }

  const storeCachedTranslation = (cacheKey: string, content: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(cacheKey, content)
    } catch (error) {
      console.debug('Unable to cache translation:', error)
    }
  }

  const restoreAssistantEnglishContent = () => {
    setMessages((prev) => {
      let changed = false
      const next = prev.map((message, idx) => {
        if (message.role !== 'assistant') return message
        const english = assistantEnglishContentRef.current[idx]
        if (!english || message.content === english) return message
        changed = true
        return { ...message, content: english }
      })
      return changed ? next : prev
    })
  }

  const queueTranslationTask = (
    task: (sessionId: number) => Promise<void>
  ) => {
    const sessionId = translationSessionRef.current
    translationPromiseRef.current = translationPromiseRef.current
      .then(() => task(sessionId))
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') {
          console.error('Translation queue error:', error)
        }
      })
    return translationPromiseRef.current
  }

  const startMessageTranslation = async (
    messageIndex: number,
    englishContent: string,
    targetLanguage: string,
    cacheKey: string | null,
    sessionId: number,
    options: { streamImmediately?: boolean } = {}
  ) => {
    if (!englishContent.trim()) return
    if (translationSessionRef.current !== sessionId) return

    if (cacheKey) {
      const cached = getCachedTranslation(cacheKey)
      if (cached) {
        if (translationSessionRef.current !== sessionId) return
        setMessages((prev) => {
          const next = [...prev]
          if (!next[messageIndex] || next[messageIndex].role !== 'assistant') {
            return prev
          }
          next[messageIndex] = { ...next[messageIndex], content: cached }
          return next
        })
        setLastTranslationCacheKey(cacheKey)
        return
      }
    }

    const controller = new AbortController()
    translationControllerRef.current = controller
    const streamImmediately = options.streamImmediately !== false
    let bufferedTranslation = ''

    try {
      setIsTranslating(true)
      const response = await fetch('/api/topic-teacher/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: englishContent,
          languagePreference: targetLanguage,
        }),
        signal: controller.signal,
      })

      if (translationSessionRef.current !== sessionId) {
        controller.abort()
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to translate content')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let translated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        translated += decoder.decode(value, { stream: true })

        if (translationSessionRef.current !== sessionId) {
          controller.abort()
          return
        }

        const currentContent = translated
        if (streamImmediately) {
          setMessages((prev) => {
            const next = [...prev]
            if (!next[messageIndex] || next[messageIndex].role !== 'assistant') {
              return prev
            }
            next[messageIndex] = { ...next[messageIndex], content: currentContent }
            return next
          })
        } else {
          bufferedTranslation = currentContent
        }
      }

      if (translationSessionRef.current !== sessionId) {
        return
      }

      const finalContent = streamImmediately ? translated : bufferedTranslation || translated
      if (!streamImmediately) {
        setMessages((prev) => {
          const next = [...prev]
          if (!next[messageIndex] || next[messageIndex].role !== 'assistant') {
            return prev
          }
          next[messageIndex] = { ...next[messageIndex], content: finalContent }
          return next
        })
      }

      if (cacheKey) {
        storeCachedTranslation(cacheKey, finalContent)
        setLastTranslationCacheKey(cacheKey)
      }
      return finalContent
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      console.error('Translation stream error:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to translate content'
      )
    } finally {
      if (translationControllerRef.current === controller) {
        translationControllerRef.current = null
      }
      setIsTranslating(false)
    }
    return null
  }

  const captureAssistantEnglishContent = (index: number, content: string) => {
    assistantEnglishContentRef.current[index] = content

    const targetLanguageRaw = languagePreference?.trim()
    if (
      !targetLanguageRaw ||
      ['english', 'en', 'eng'].includes(targetLanguageRaw.toLowerCase())
    ) {
      return
    }

    const interestsSnapshot =
      savedInterests.length > 0 ? savedInterests.join(', ') : userInterests || null
    const cacheKey =
      index === 0
        ? buildTranslationCacheKey(
            decodedTopic,
            domain,
            targetLanguageRaw,
            interestsSnapshot
          )
        : null

    setTimeout(() => {
      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          index,
          content,
          targetLanguageRaw,
          cacheKey,
          sessionId
        )
      )
    }, 0)
  }

  // Disabled auto-scroll - keep at top of page
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }

  // useEffect(() => {
  //   scrollToBottom()
  // }, [messages])

  // Check for user interests and language preference on mount, and subscribe to interest changes
  useEffect(() => {
    const loadUserInterest = async () => {
      if (!user?.id) {
        setShowInterestsModal(true)
        setInterestsLoaded(true)
        return
      }

      try {
        let currentInterest = await getUserCurrentInterest(user.id)
        let currentLanguage = await getUserLanguagePreference(user.id)

        // Fallback to localStorage if Supabase returns nothing
        if (!currentInterest && typeof window !== 'undefined') {
          currentInterest = localStorage.getItem(`interests_${user.id}`)
        }

        setUserInterests(currentInterest)

        // If user already has an interest, pre-populate the inputs
        if (currentInterest) {
          setInterestsInput(currentInterest)
          // Parse and display as saved interests
          const interestsList = currentInterest
            .split(',')
            .map((i) => i.trim())
            .filter((i) => i.length > 0)
          setSavedInterests(interestsList)
          setCurrentInterestInput('')
        } else {
          // Only show modal if user hasn't filled out interests yet
          setShowInterestsModal(true)
        }

        // Load language preference with localStorage fallback
        if (currentLanguage == null && typeof window !== 'undefined') {
          currentLanguage = localStorage.getItem(`language_pref_${user.id}`)
        }
        if (currentLanguage && currentLanguage.trim().length > 0) {
          setLanguagePreference(currentLanguage)
          setLanguageInput('')
        } else {
          setLanguagePreference(null)
          setLanguageInput('')
        }

        // Subscribe to real-time interest changes
        const channel = subscribeToUserInterestChanges(user.id, (newInterest) => {
          setUserInterests(newInterest)
          if (newInterest) {
            setInterestsInput(newInterest)
            // Also update localStorage and saved interests display
            if (typeof window !== 'undefined') {
              localStorage.setItem(`interests_${user.id}`, newInterest)
            }
            const interestsList = newInterest
              .split(',')
              .map((i) => i.trim())
              .filter((i) => i.length > 0)
            setSavedInterests(interestsList)
            setCurrentInterestInput('')
          }
        })
        subscriptionRef.current = channel
      } catch (error) {
        console.debug('Error loading user interest or language preference:', error)
        setShowInterestsModal(true)
      } finally {
        // Mark interests as loaded regardless of outcome
        setInterestsLoaded(true)
      }
    }

    loadUserInterest()

    // Clean up subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromInterestChanges(subscriptionRef.current)
      }
    }
  }, [user?.id])

  // Load saved star colors from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('starColor')
    if (savedColor) {
      setStarColor(savedColor)
    }
    const savedQuizColor = localStorage.getItem('quizStarColor')
    if (savedQuizColor) {
      setQuizStarColor(savedQuizColor)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const channel = subscribeToUserLanguagePreferenceChanges(user.id, (newLanguage) => {
      setLanguagePreference(newLanguage)
      setLanguageInput('')

      if (typeof window !== 'undefined') {
        if (newLanguage && newLanguage.trim().length > 0) {
          localStorage.setItem(`language_pref_${user.id}`, newLanguage)
        } else {
          localStorage.removeItem(`language_pref_${user.id}`)
        }
      }
    })

    languageSubscriptionRef.current = channel

    return () => {
      if (languageSubscriptionRef.current) {
        unsubscribeFromLanguagePreferenceChanges(languageSubscriptionRef.current)
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (!messagesEndRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsNearBottom(entry?.isIntersecting ?? false)
      },
      {
        root: null,
        threshold: 0.9,
      }
    )

    const node = messagesEndRef.current
    if (node) {
      observer.observe(node)
    }

    return () => {
      if (node) observer.unobserve(node)
      observer.disconnect()
    }
  }, [messages.length])

  const formatSectionList = (sections: string[]) => {
    if (!sections || sections.length === 0) return ''
    if (sections.includes('__ALL__')) return 'All sections'

    // Filter out generic section headers that shouldn't be displayed
    const filtered = sections.filter(section => {
      const lower = section.toLowerCase()
      return !lower.includes('key takeaways') &&
             !lower.includes('practice tips') &&
             !lower.includes('comparing the theories') &&
             !lower.includes('evolution of thinking')
    })

    return filtered.length > 0 ? filtered.join('; ') : ''
  }

  // Load quiz/exam results and compute highlight data
  useEffect(() => {
    if (decodedTopic) {
      let allWrongSections: string[] = []
      let allCorrectSections: string[] = []
      let allPreviouslyWrongNowCorrect: string[] = []
      let hasAnyResults = false
      let quizWrongSections: string[] = []

	      // Always check for quiz results
      const quizResults = getQuizResults(decodedTopic)
      if (quizResults && quizResults.wrongAnswers && quizResults.wrongAnswers.length > 0) {
        // Filter to only unresolved wrong answers (like practice exam stars)
        const unresolvedWrongAnswers = quizResults.wrongAnswers.filter(wa => wa.isResolved !== true)

        // Store quiz wrong answers for dialog display
        setQuizWrongAnswers(unresolvedWrongAnswers)

        quizWrongSections = normalizeSections(
          unresolvedWrongAnswers.flatMap((wa) => wa.relatedSections || []),
          { allowAll: true }
        )

        // Guard for correctAnswers - may be undefined in malformed/old data
        if (quizResults.correctAnswers && Array.isArray(quizResults.correctAnswers)) {
          const quizCorrectSections = normalizeSections(
            quizResults.correctAnswers
              .filter((ca) => !(ca as any).wasPreviouslyWrong)
              .flatMap((ca) => ca.relatedSections || []),
            { allowAll: false }
          )
          const quizPreviouslyWrongNowCorrect = normalizeSections(
            quizResults.correctAnswers
              .filter((ca) => (ca as any).wasPreviouslyWrong)
              .flatMap((ca) => ca.relatedSections || []),
            { allowAll: false }
          )

          if (quizCorrectSections.length > 0) {
            allCorrectSections = [...allCorrectSections, ...quizCorrectSections]
          }

          if (quizPreviouslyWrongNowCorrect.length > 0) {
            allPreviouslyWrongNowCorrect = [
              ...allPreviouslyWrongNowCorrect,
              ...quizPreviouslyWrongNowCorrect,
            ]
          }
        }

        if (quizWrongSections.length > 0) {
          allWrongSections = [...allWrongSections, ...quizWrongSections]
          hasAnyResults = true
        }
      }

	      // Always check for exam results (from diagnostic/practice exams)
	      const { getExamWrongSections } = require('@/lib/unified-question-results')
	      const examWrongSections = normalizeSections(
	        getExamWrongSections(decodedTopic),
	        { allowAll: true }
	      )
	      if (examWrongSections.length > 0) {
	        allWrongSections = [...allWrongSections, ...examWrongSections]
	        hasAnyResults = true
      }

      // If this topic was reached from exam-based recommendations but
      // we don't have granular section data, treat the whole topic as
      // needing review so the content is highlighted.
      if (hasExamResults && !hasAnyResults) {
        setHighlightData({
          recentlyWrongSections: ['__ALL__'],
          recentlyCorrectSections: [],
          previouslyWrongNowCorrectSections: [],
          quizWrongSections: [],
          examWrongSections: ['__ALL__'],
        })
        return
      }

      // Set highlight data with combined results
      if (hasAnyResults && allWrongSections.length > 0) {
        const dedupedWrong = [...new Set(allWrongSections)]
        const dedupedQuizWrong = [...new Set(quizWrongSections)]
        const dedupedExamWrong = [...new Set(examWrongSections)]

        setHighlightData({
          recentlyWrongSections: dedupedWrong,
          recentlyCorrectSections: [...new Set(allCorrectSections)],
          previouslyWrongNowCorrectSections: [
            ...new Set(allPreviouslyWrongNowCorrect),
          ],
          quizWrongSections: dedupedQuizWrong,
          examWrongSections: dedupedExamWrong,
        })
      }
    }
  }, [decodedTopic, hasExamResults])

  // Load latest practice-exam wrong questions for table-row 🍏 mapping
  // Always fetch when user is logged in - API returns 404 if no results (handled gracefully)
  useEffect(() => {
    if (!user?.id || !decodedTopic) return

    // Reset matched terms when topic changes
    matchedExamTermsRef.current.clear()
    setMatchedExamTerms([])
    matchedQuizTermsRef.current.clear()

    let cancelled = false
    const controller = new AbortController()

    const loadPracticeExamWrongQuestions = async () => {
      try {
        setIsLoadingPracticeExamWrongQuestions(true)
        setPracticeExamWrongQuestionsError(null)

        const response = await fetch(
          `/api/get-exam-results/latest?userId=${encodeURIComponent(user.id)}`,
          { signal: controller.signal },
        )

        if (response.status === 404) {
          if (!cancelled) {
            setPracticeExamWrongQuestions([])
          }
          return
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load practice exam results')
        }

        const data = await response.json()
        if (!data?.success || !data.results) {
          throw new Error(data?.error || 'Failed to load practice exam results')
        }

        const questions: PracticeExamQuestion[] = Array.isArray(data.results.questions)
          ? data.results.questions
          : []
        const selectedAnswers: Record<string, string> = data.results.selectedAnswers || {}

        const wrong: WrongPracticeExamQuestion[] = []

        // Normalize topic names for comparison (remove punctuation, extra spaces)
        const normalizeTopic = (s: string) =>
          s.toLowerCase()
            .replace(/[,.:;'"!?()]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

        const normalizedUrlTopic = normalizeTopic(decodedTopic || '')

        questions.forEach((question, index) => {
          const selectedAnswer =
            selectedAnswers[index as any] ?? selectedAnswers[String(index)] ?? null

          if (!selectedAnswer) return
          if (selectedAnswer === question.correct_answer) return

          const meta = deriveTopicMetaFromQuestionSource(question)
          const questionTopic = (question.topicName || meta?.topicName || '').trim()
          if (!questionTopic) return

          const normalizedQuestionTopic = normalizeTopic(questionTopic)
          const topicMatches = normalizedQuestionTopic === normalizedUrlTopic
          if (!topicMatches) return

          wrong.push({
            questionIndex: index,
            question,
            selectedAnswer,
          })
        })

        if (!cancelled) {
          setPracticeExamWrongQuestions(wrong)

          // Extract relatedSections from wrong questions and update highlightData
          // This replaces the ['__ALL__'] fallback with actual section names
          if (wrong.length > 0 && hasExamResults) {
            const sectionsFromQuestions = wrong
              .flatMap(w => w.question.relatedSections || [])
              .filter((section, idx, arr) => arr.indexOf(section) === idx) // dedupe

            if (sectionsFromQuestions.length > 0) {
              setHighlightData(prev => ({
                ...prev,
                examWrongSections: sectionsFromQuestions,
                recentlyWrongSections: prev.recentlyWrongSections.includes('__ALL__')
                  ? sectionsFromQuestions
                  : prev.recentlyWrongSections,
              }))
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('[Topic Teacher] Failed to load practice exam wrong questions:', error)
        if (!cancelled) {
          setPracticeExamWrongQuestionsError(
            error instanceof Error ? error.message : 'Failed to load practice exam results',
          )
          setPracticeExamWrongQuestions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPracticeExamWrongQuestions(false)
        }
      }
    }

    loadPracticeExamWrongQuestions()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [user?.id, decodedTopic])

  // Initialize with lesson
  useEffect(() => {
    if (!initialized && topic && interestsLoaded && !authLoading) {
      initializeLesson()
    }
  }, [topic, initialized, interestsLoaded, authLoading])

  // Watch for interest changes and refresh metaphors
  useEffect(() => {
    if (!initialized || !interestsLoaded) return
    if (isRefreshingMetaphors) return

    // Check if interests actually changed
    const currentInterestsStr = savedInterests.length > 0 ? savedInterests.join(', ') : null

    if (currentInterestsStr !== previousUserInterests) {
      // Interests changed - refresh metaphors
      if (currentInterestsStr) {
        console.log('Interests changed, refreshing metaphors:', currentInterestsStr)
        refreshMetaphors(currentInterestsStr)
      } else {
        // User removed all interests - show base content
        if (baseContent && messages.length > 0) {
          setMessages([
            {
              role: 'assistant',
              content: baseContent,
            },
          ])
          setPreviousUserInterests(null)
          setLastTranslationCacheKey(null)
          captureAssistantEnglishContent(0, baseContent)
        }
      }
    }
  }, [savedInterests, initialized, interestsLoaded])

  // Watch for language preference changes and refresh translated content (with caching)
  useEffect(() => {
    const rawPreference = languagePreference?.trim()
    const normalized = rawPreference?.toLowerCase()

    const resetToEnglish = () => {
      translationSessionRef.current += 1
      translationPromiseRef.current = Promise.resolve()
      translationControllerRef.current?.abort()
      setIsTranslating(false)
      restoreAssistantEnglishContent()
      setLastTranslationCacheKey(null)
      setIsMetaphorUpdating(false)
    }

    if (
      !rawPreference ||
      !normalized ||
      normalized === 'english' ||
      normalized === 'en' ||
      normalized === 'eng'
    ) {
      resetToEnglish()
      return
    }

    translationSessionRef.current += 1
    translationPromiseRef.current = Promise.resolve()
    translationControllerRef.current?.abort()
    restoreAssistantEnglishContent()

    const interestsForCache =
      interestSnapshotRef.current && interestSnapshotRef.current.length > 0
        ? interestSnapshotRef.current
        : null
    const englishMap = assistantEnglishContentRef.current
    const indices = Object.keys(englishMap)
      .map(Number)
      .sort((a, b) => a - b)

    indices.forEach((idx) => {
      const english = englishMap[idx]
      if (!english) return
      const cacheKey =
        idx === 0
          ? buildTranslationCacheKey(
              decodedTopic,
              domain,
              rawPreference,
              interestsForCache
            )
          : null
      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          idx,
          english,
          rawPreference,
          cacheKey,
          sessionId
        )
      )
    })
  }, [languagePreference, decodedTopic, domain])

  const initializeLesson = async () => {
    if (!topic || authLoading) return
    const subscriptionTier = getEntitledSubscriptionTier(userProfile) ?? 'free'
    assistantEnglishContentRef.current = {}
    translationSessionRef.current += 1
    translationPromiseRef.current = Promise.resolve()
    translationControllerRef.current?.abort()

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/topic-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          domain,
          messageHistory: [],
          isInitial: true,
          userInterests,
          languagePreference: null,
          subscriptionTier,
          userId: user?.id ?? null,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`API Error (${response.status}): ${errorText || 'Unknown error'}`)
      }

      // Extract base content from response headers
      const baseContentHeader = response.headers.get('X-Base-Content')
      if (baseContentHeader) {
        try {
          // Decode from base64
          const decodedBaseContent = atob(baseContentHeader)
          setBaseContent(decodedBaseContent)
          console.log('[Topic Teacher] ✅ Stored base content from API headers')
        } catch (error) {
          console.warn('[Topic Teacher] Failed to decode base content from headers:', error)
        }
      }

      const metaphorRangesHeader = response.headers.get('X-Metaphor-Ranges')
      if (metaphorRangesHeader) {
        try {
          const decodedRangesJson = atob(metaphorRangesHeader)
          const parsed = JSON.parse(decodedRangesJson)
          if (Array.isArray(parsed)) {
            const normalized = parsed
              .map((r) => ({
                start: typeof r?.start === 'number' ? r.start : NaN,
                end: typeof r?.end === 'number' ? r.end : NaN,
              }))
              .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.start >= 0 && r.end >= r.start)
            setMetaphorRanges(normalized)
          }
        } catch (error) {
          console.warn('[Topic Teacher] Failed to decode metaphor ranges header:', error)
        }
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let lessonContent = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        lessonContent += text
      }

      if (!lessonContent) {
        throw new Error('No lesson content received from API')
      }

      setMessages([
        {
          role: 'assistant',
          content: lessonContent,
        },
      ])
      captureAssistantEnglishContent(0, lessonContent)
      setInitialized(true)
      setPreviousUserInterests(userInterests)
      setLastTranslationCacheKey(null)
    } catch (err) {
      console.error('Error loading lesson:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load lesson'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh metaphors when interests change (after initial load)
  const refreshMetaphors = async (newInterests: string) => {
    if (!topic || !initialized) return
    const subscriptionTier = getEntitledSubscriptionTier(userProfile) ?? 'free'

    // Create cache key from topic + interests
    const cacheKey = `${topic}__${newInterests || 'none'}`

    // Check cache first
    if (personalizedCache[cacheKey]) {
      console.log('[Topic Teacher] ⚡ Using cached personalized content for:', newInterests)
      const cachedLesson = personalizedCache[cacheKey]
      assistantEnglishContentRef.current[0] = cachedLesson
      const normalizedLang = languagePreference?.trim()
      const normalizedLower = normalizedLang?.toLowerCase()

      if (!normalizedLang || normalizedLower === 'english' || normalizedLower === 'en' || normalizedLower === 'eng') {
        setMessages([
          {
            role: 'assistant',
            content: cachedLesson,
          },
        ])
        setPreviousUserInterests(newInterests)
        setLastTranslationCacheKey(null)
        return
      }

      setIsMetaphorUpdating(true)
      const interestsForCache =
        interestSnapshotRef.current && interestSnapshotRef.current.length > 0
          ? interestSnapshotRef.current
          : null

      const translationCacheKey = buildTranslationCacheKey(
        decodedTopic,
        domain,
        normalizedLang,
        interestsForCache
      )

      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          0,
          cachedLesson,
          normalizedLang,
          translationCacheKey,
          sessionId,
          { streamImmediately: false }
        )
      )
        .then(() => {
          if (languagePreference !== normalizedLang) return
          setPreviousUserInterests(newInterests)
        })
        .finally(() => {
          setIsMetaphorUpdating(false)
        })
      return
    }

    try {
      setIsRefreshingMetaphors(true)
      setIsMetaphorUpdating(true)
      setError(null)

      console.log('[Topic Teacher] 🔄 Generating personalized metaphors for:', newInterests)
      const startTime = Date.now()

      const response = await fetch('/api/topic-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          domain,
          messageHistory: [],
          isInitial: true,
          userInterests: newInterests,
          languagePreference: null,
          subscriptionTier,
          userId: user?.id ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh metaphors')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let lessonContent = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value} = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        lessonContent += text
      }

      const duration = Date.now() - startTime
      console.log(`[Topic Teacher] ✅ Personalization complete in ${duration}ms`)

      // Cache the personalized content
      setPersonalizedCache(prev => ({
        ...prev,
        [cacheKey]: lessonContent
      }))

      const normalizedLang = languagePreference?.trim()
      const normalizedLower = normalizedLang?.toLowerCase()
      assistantEnglishContentRef.current[0] = lessonContent

      if (!normalizedLang || normalizedLower === 'english' || normalizedLower === 'en' || normalizedLower === 'eng') {
        setMessages([
          {
            role: 'assistant',
            content: lessonContent,
          },
        ])
        setPreviousUserInterests(newInterests)
        setLastTranslationCacheKey(null)
        setIsMetaphorUpdating(false)
        return
      }

      const interestsForCache =
        interestSnapshotRef.current && interestSnapshotRef.current.length > 0
          ? interestSnapshotRef.current
          : null
      const translationCacheKey = buildTranslationCacheKey(
        decodedTopic,
        domain,
        normalizedLang,
        interestsForCache
      )

      queueTranslationTask((sessionId) =>
        startMessageTranslation(
          0,
          lessonContent,
          normalizedLang,
          translationCacheKey,
          sessionId,
          { streamImmediately: false }
        )
      )
        .then(() => {
          if (languagePreference !== normalizedLang) return
          setPreviousUserInterests(newInterests)
        })
        .finally(() => {
          setIsMetaphorUpdating(false)
        })
    } catch (err) {
      console.error('Error refreshing metaphors:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to refresh metaphors'
      )
      setIsMetaphorUpdating(false)
    } finally {
      setIsRefreshingMetaphors(false)
    }
  }

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !topic) return
    const subscriptionTier = getEntitledSubscriptionTier(userProfile) ?? 'free'

    // Add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/topic-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          domain,
          messageHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage,
          isInitial: false,
          userInterests,
          languagePreference,
          subscriptionTier,
          userId: user?.id ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let assistantMessage = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const text = decoder.decode(value)
        assistantMessage += text
      }

      setMessages((prev) => {
        const next = [...prev, { role: 'assistant', content: assistantMessage }]
        const newIndex = next.length - 1
        captureAssistantEnglishContent(newIndex, assistantMessage)
        return next
      })
    } catch (err) {
      console.error('Error sending message:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to send message'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const snapshot =
      savedInterests.length > 0 ? savedInterests.join(', ') : userInterests || ''
    interestSnapshotRef.current = snapshot
  }, [savedInterests, userInterests])

  const normalizeLabel = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const preparedPracticeExamWrongQuestions = useMemo(() => {
    const normalize = (value: string): string => {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const prepared = practiceExamWrongQuestions.map((entry) => {
      const { question } = entry
      return {
        entry,
        stem: ` ${normalize(question.question || '')} `,
        correctAnswer: ` ${normalize(question.correct_answer || '')} `,
        explanation: ` ${normalize(question.explanation || '')} `,
        options: ` ${normalize(
          Array.isArray(question.options) ? question.options.join(' ') : ''
        )} `,
      }
    })

    return prepared
  }, [practiceExamWrongQuestions])

  const isAcronymLikeTerm = (term: string): boolean => {
    const trimmed = term.trim()
    if (trimmed.length > 5) return false
    return /^[A-Z0-9]+$/.test(trimmed)
  }

  const findBestWrongPracticeExamQuestionForTableTerm = (
    tableTerm: string
  ): WrongPracticeExamQuestion | null => {
    const raw = tableTerm.trim()
    if (!raw) return null

    // Avoid accidental matches for super-short non-acronyms (e.g., "to", "in")
    if (raw.length <= 3 && !isAcronymLikeTerm(raw)) return null

    const term = normalizeLabel(raw)
    if (!term) return null

    const needle = ` ${term} `

    // Also extract significant words (4+ chars) for partial matching
    const significantWords = term.split(/\s+/).filter(w => w.length >= 4)

    let best: WrongPracticeExamQuestion | null = null
    let bestScore = 0

    for (const prepared of preparedPracticeExamWrongQuestions) {
      let score = 0

      // Exact phrase matching (original logic)
      if (prepared.stem.includes(needle)) score += 4
      if (prepared.correctAnswer.includes(needle)) score += 3
      if (prepared.explanation.includes(needle)) score += 2
      if (prepared.options.includes(needle)) score += 1

      // Partial word matching: if most significant words from table term appear in question
      if (score === 0 && significantWords.length >= 2) {
        const matchedWords = significantWords.filter(word =>
          prepared.stem.includes(` ${word} `) ||
          prepared.stem.includes(` ${word}s `) ||  // plural
          prepared.explanation.includes(` ${word} `)
        )
        // If at least 2/3 of significant words match, give partial score
        if (matchedWords.length >= Math.ceil(significantWords.length * 0.6)) {
          score = 2 // explanation-level hit
        }
      }

      if (score > bestScore) {
        bestScore = score
        best = prepared.entry
      }
    }

    // Track matched terms for the header display (one best term per question)
    if (bestScore >= 2 && best) {
      const genericTerms = ['workers', 'theory', 'management', 'supervisor', 'employee', 'work', 'motivation', 'behavior']
      const normalizedRaw = raw.toLowerCase().trim()
      const words = normalizedRaw.split(/\s+/)

      // Only track if NOT a generic single word
      const isGeneric = genericTerms.includes(normalizedRaw) ||
                        (words.length === 1 && normalizedRaw.length < 8 && !normalizedRaw.includes('/'))

      if (!isGeneric) {
        const questionIndex = best.questionIndex
        const existingTerm = matchedExamTermsRef.current.get(questionIndex)

        // Keep the longer/more specific term for each question
        if (!existingTerm || raw.length > existingTerm.length) {
          matchedExamTermsRef.current.set(questionIndex, raw)
          // Batch state updates to avoid too many re-renders
          setTimeout(() => {
            setMatchedExamTerms(Array.from(matchedExamTermsRef.current.values()))
          }, 0)
        }
      }
    }

    // Require at least an explanation-level hit.
    return bestScore >= 2 ? best : null
  }

  const extractTextFromMarkdownNode = (node: any): string => {
    if (!node) return ''
    if (node.type === 'text' && typeof node.value === 'string') {
      return node.value
    }
    if (Array.isArray(node.children)) {
      return node.children.map(extractTextFromMarkdownNode).join('')
    }
    return ''
  }

  // Extract potential terms from paragraph text for matching against wrong questions
  // Only extract specific terms (proper nouns, Theory X/Y patterns) - NOT generic words
  const extractPotentialTerms = (text: string): string[] => {
    if (!text) return []

    const terms = new Set<string>()

    // Match possessive proper nouns followed by theory/concept (e.g., "McGregor's Theory X/Y")
    const possessivePatterns = text.match(/[A-Z][a-z]+'s\s+(?:Theory|Concept|Model|Approach|Hierarchy|Effect)(?:\s+[A-Z](?:\/[A-Z])?)?/g)
    if (possessivePatterns) {
      possessivePatterns.forEach(pattern => terms.add(pattern))
    }

    // Match "Theory X", "Theory Y", "Theory X/Y" patterns (specific letter designations)
    const theoryLetterPatterns = text.match(/Theory\s+[A-Z](?:\s*\/\s*[A-Z])?/gi)
    if (theoryLetterPatterns) {
      theoryLetterPatterns.forEach(pattern => terms.add(pattern))
    }

    // Match known psychologist/researcher names (specific proper nouns)
    const properNouns = text.match(/\b(McGregor|Maslow|Herzberg|Vroom|Locke|Adams|Bandura|Skinner|Freud|Jung|Piaget|Erikson|Kohlberg|Ainsworth|Bowlby)\b/g)
    if (properNouns) {
      properNouns.forEach(name => terms.add(name))
    }

    return Array.from(terms)
  }

  // Check if a term is too generic to trigger a paragraph match
  const isGenericTerm = (term: string): boolean => {
    const generic = ['workers', 'theory', 'management', 'supervisor', 'employee', 'work', 'motivation', 'behavior', 'mayo', 'hawthorne']
    const normalized = term.toLowerCase().trim()
    // "Mayo" and "Hawthorne" are generic here because they refer to different studies, not the wrong question's topic
    return generic.includes(normalized)
  }

  // Check if a paragraph matches any wrong practice exam question
  // Used for inline text/tables, NOT for headers (headers use pre-calculated map)
  const findBestWrongPracticeExamQuestionForParagraph = (
    paragraphText: string
  ): WrongPracticeExamQuestion | null => {
    if (!paragraphText || preparedPracticeExamWrongQuestions.length === 0) return null

    // Extract potential terms and match against question content
    const potentialTerms = extractPotentialTerms(paragraphText)

    for (const term of potentialTerms) {
      // Skip generic terms that would cause false positives
      if (isGenericTerm(term)) continue

      // Use the existing matching function
      const matched = findBestWrongPracticeExamQuestionForTableTerm(term)
      if (matched) return matched
    }

    return null
  }

  // Quiz question matching functions
  const findBestQuizWrongAnswerForContent = (
    contentText: string
  ): WrongAnswer | null => {
    if (!contentText || quizWrongAnswers.length === 0) {
      return null
    }

    // Find quiz wrong answers that match this content, and score them by specificity
    // Returns the BEST (most specific) match, not just the first match
    let bestMatch: WrongAnswer | null = null
    let bestScore = 0

    for (const answer of quizWrongAnswers) {
      for (const section of answer.relatedSections) {
        if (labelsMatch(contentText, section)) {
          // Score based on length of the relatedSection (longer = more specific = better)
          // Also prefer exact matches over prefix matches
          const normalizedContent = normalizeLabel(contentText)
          const normalizedSection = normalizeLabel(section)

          let score = normalizedSection.length

          // Bonus points for exact match
          if (normalizedContent === normalizedSection) {
            score += 100
          }

          // Bonus points if contentText contains the section name fully
          if (normalizedContent.includes(normalizedSection)) {
            score += 50
          }

          if (score > bestScore) {
            bestScore = score
            bestMatch = answer
          }
        }
      }
    }

    return bestMatch
  }

  // Flexible matching for list items in Key Takeaways and Practice Tips sections
  // Matches based on key terms (author names) rather than exact text
  const findQuizMatchForListItem = (listItemText: string): WrongAnswer | null => {
    if (!listItemText || quizWrongAnswers.length === 0) return null

    const normalizedText = listItemText.toLowerCase()

    // Extract key author/theory names from the list item
    const keyTerms = ['weber', 'taylor', 'mayo', 'mcgregor', 'katz', 'kahn']
    const foundTerms = keyTerms.filter(term => normalizedText.includes(term))

    if (foundTerms.length === 0) return null

    // Find quiz questions whose relatedSections mention the same terms
    for (const answer of quizWrongAnswers) {
      if (answer.isResolved) continue

      for (const section of answer.relatedSections) {
        const normalizedSection = section.toLowerCase()

        // Check if the section mentions any of the same key terms
        const hasMatchingTerm = foundTerms.some(term => normalizedSection.includes(term))

        if (hasMatchingTerm) {
          return answer
        }
      }
    }

    return null
  }

  // Matching for practice exam questions in list items (Key Takeaways)
  // ONLY uses keyword matching - requires the exact correct answer word (8+ chars) to appear
  // No header-based or term extraction matching (those cause too many false positives)
  const findPracticeExamMatchForListItem = (listItemText: string): WrongPracticeExamQuestion | null => {
    if (!listItemText || practiceExamWrongQuestions.length === 0) return null

    const normalizedText = listItemText.toLowerCase().replace(/[^a-z0-9\s]/g, '')

    // Only use keyword-based matching (correct answer words like "atomoxetine", "donepezil")
    // Requires 8+ character keywords to avoid false positives from short generic words
    for (const wrongQ of practiceExamWrongQuestions) {
      const keywords = practiceExamQuestionKeywords.get(wrongQ.questionIndex) || []

      // Check if list item contains any keywords from the correct answer
      for (const keyword of keywords) {
        if (keyword.length >= 8 && normalizedText.includes(keyword)) {
          return wrongQ
        }
      }
    }

    return null
  }

  const getAnswerLabel = (
    question: PracticeExamQuestion,
    answerText?: string | null
  ): string | null => {
    if (!answerText) return null
    const options = Array.isArray(question.options) ? question.options : []
    const index = options.findIndex((option) => option === answerText)
    if (index < 0) return answerText
    const letter = String.fromCharCode(65 + index)
    return `${letter}. ${answerText}`
  }

  const labelsMatch = (headerText: string, sectionName: string): boolean => {
    const h = normalizeLabel(headerText)
    const s = normalizeLabel(sectionName)
    if (!h || !s) return false

    if (h === s) return true
    if (h.startsWith(s) || s.startsWith(h)) return true

    return false
  }

  const getHighlightFlags = (text: string) => {
    if (!text || text.trim().length === 0) {
      return {
        quizWrong: false,
        examWrong: false,
        recovered: false,
        recentlyCorrect: false,
      }
    }

    const quizWrong = highlightData.quizWrongSections.some((section) =>
      labelsMatch(text, section)
    )
    const examWrong = highlightData.examWrongSections.some((section) =>
      labelsMatch(text, section)
    )
    const recovered = highlightData.previouslyWrongNowCorrectSections.some((section) =>
      labelsMatch(text, section)
    )
    const recentlyCorrect = highlightData.recentlyCorrectSections.some((section) =>
      labelsMatch(text, section)
    )

    return {
      quizWrong,
      examWrong,
      recovered,
      recentlyCorrect,
    }
  }

  // Pre-calculate the best header match for each quiz question
  // This runs ONCE per content change, not during render
  const quizQuestionToBestHeader = useMemo(() => {
    const result = new Map<number, string>() // questionId -> best header text

    if (quizWrongAnswers.length === 0 || !baseContent) return result

    // Extract all h2/h3 headers from the markdown content
    const headers: Array<{ text: string; level: 2 | 3 }> = []
    const lines = baseContent.split('\n')
    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/)
      const h3Match = line.match(/^###\s+(.+)$/)
      if (h2Match) headers.push({ text: h2Match[1].trim(), level: 2 })
      else if (h3Match) headers.push({ text: h3Match[1].trim(), level: 3 })
    }

    // For each quiz question, find ALL matching headers and pick the best one
    for (const question of quizWrongAnswers) {
      if (question.isResolved) continue // Skip resolved questions

      let bestHeader: string | null = null
      let bestScore = 0

      for (const headerInfo of headers) {
        const header = headerInfo.text
        // Skip section headers where list items should show stars instead
        // Also skip generic overview/comparison headers and intro "why X matters" headers
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('key takeaways') ||
            lowerHeader.includes('practice tips') ||
            lowerHeader.includes('evolution of thinking') ||
            lowerHeader.includes('comparing the theories') ||
            (lowerHeader.includes('why') && lowerHeader.includes('matter'))) continue

        // Check if this header matches any of the question's relatedSections
        for (const section of question.relatedSections) {
          if (labelsMatch(header, section)) {
            // Score this match - prefer longer, more specific headers
            const normalizedHeader = normalizeLabel(header)
            const normalizedSection = normalizeLabel(section)

            // Base score: header length (longer headers are more specific)
            let score = normalizedHeader.length

            // Major bonus for exact match between header and section
            if (normalizedHeader === normalizedSection) {
              score += 10000
            }

            // Bonus based on how much of the header the section covers
            // Higher ratio = section is more specific to this header
            const matchRatio = normalizedSection.length / normalizedHeader.length
            score += matchRatio * 1000

            // Prefer h3 headers over h2 when all else is equal (more specific)
            if (headerInfo.level === 3) {
              score += 250
            }

            // Penalty for generic comparison/overview headers
            const lowerHeader = header.toLowerCase()
            if (lowerHeader.includes('comparing') || lowerHeader.includes('evolution') ||
                lowerHeader.includes('overview') || lowerHeader.includes('introduction')) {
              score -= 5000
            }

            // Update best match if this is better
            if (score > bestScore) {
              bestScore = score
              bestHeader = header
            }
          }
        }
      }

      // Content-based matching fallback (and override) for when relatedSections are noisy.
      // This prevents cases like "Cue Exposure Therapy" being starred for an "Implosive therapy" question.
      const stopWords = new Set([
        'the',
        'a',
        'an',
        'and',
        'or',
        'of',
        'to',
        'in',
        'on',
        'for',
        'with',
        'from',
        'by',
        'is',
        'are',
      ])
      const questionText = (question.question || '').toLowerCase()
      const explanation = (question.explanation || '').toLowerCase()
      const combinedText = `${questionText} ${explanation}`.replace(/[^a-z0-9\s]/g, ' ')

      let bestContentHeader: string | null = null
      let bestContentScore = 0

      for (const headerInfo of headers) {
        const header = headerInfo.text
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('key takeaways') ||
            lowerHeader.includes('practice tips') ||
            lowerHeader.includes('evolution of thinking') ||
            lowerHeader.includes('comparing the theories') ||
            (lowerHeader.includes('why') && lowerHeader.includes('matter'))) continue

        const headerWordsRaw = lowerHeader
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .map((w) => w.trim())
          .filter(Boolean)

        const topicWord = headerWordsRaw.find((w) => !stopWords.has(w)) ?? null
        const topicWordMatches = Boolean(topicWord && combinedText.includes(topicWord))

        const significantWords = [...new Set(
          headerWordsRaw.filter((w) => w.length >= 4 && !stopWords.has(w))
        )]
        const matchingWords = significantWords.filter((word) => combinedText.includes(word))

        const ratioThreshold = Math.ceil(significantWords.length * 0.5)
        const hasStrongOverlap =
          significantWords.length > 0 &&
          matchingWords.length >= 2 &&
          matchingWords.length >= ratioThreshold

        if (!topicWordMatches && !hasStrongOverlap) continue

        let score = 0
        if (topicWordMatches) score += 20000
        score += matchingWords.length * 200

        const normalizedExplanation = explanation.replace(/[^a-z0-9\s]/g, ' ')
        const explanationWords = significantWords.filter((word) => normalizedExplanation.includes(word))
        if (significantWords.length > 0 && explanationWords.length >= ratioThreshold) {
          score += 5000
        }

        if (headerInfo.level === 3) score += 250

        if (score > bestContentScore) {
          bestContentScore = score
          bestContentHeader = header
        }
      }

      if (bestContentHeader && bestContentScore > bestScore) {
        bestScore = bestContentScore
        bestHeader = bestContentHeader
      }

      if (bestHeader) {
        result.set(question.questionId, bestHeader)
      }
    }

    return result
  }, [baseContent, quizWrongAnswers])

  // Pre-calculate the best header match for each practice exam question
  // This runs ONCE per content change, not during render
  const practiceExamQuestionToBestHeader = useMemo(() => {
    const result = new Map<number, string>() // questionIndex -> best header text

    if (practiceExamWrongQuestions.length === 0 || !baseContent) return result

    // Extract all h2/h3 headers from the markdown content
    const headers: string[] = []
    const lines = baseContent.split('\n')
    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/)
      const h3Match = line.match(/^###\s+(.+)$/)
      if (h2Match) headers.push(h2Match[1].trim())
      else if (h3Match) headers.push(h3Match[1].trim())
    }

    // For each practice exam question, find ALL matching headers and pick the best one
    for (const wrongQ of practiceExamWrongQuestions) {
      const sections = wrongQ.question.relatedSections
      if (!sections || !Array.isArray(sections)) continue

      console.log('🔍 Processing question:', wrongQ.questionIndex, wrongQ.question.question?.substring(0, 80))
      console.log('   relatedSections:', sections)

      let bestHeader: string | null = null
      let bestScore = 0

      for (const header of headers) {
        // Skip section headers where list items should show stars instead
        // Also skip intro "why X matters" headers - questions aren't about lesson importance
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('key takeaways') ||
            lowerHeader.includes('practice tips') ||
            (lowerHeader.includes('why') && lowerHeader.includes('matter'))) continue

        // Check if this header matches any of the question's relatedSections
        for (const section of sections) {
          if (section === '__ALL__') continue // Skip generic fallback

          if (labelsMatch(header, section)) {
            // Score this match - prefer longer, more specific headers
            const normalizedHeader = normalizeLabel(header)
            const normalizedSection = normalizeLabel(section)

            // Base score: header length (longer headers are more specific)
            let score = normalizedHeader.length

            // Major bonus for exact match between header and section
            if (normalizedHeader === normalizedSection) {
              score += 10000
            }

            // Bonus based on how much of the header the section covers
            // Higher ratio = section is more specific to this header
            const matchRatio = normalizedSection.length / normalizedHeader.length
            score += matchRatio * 1000

            // Penalty for generic comparison/overview headers
            if (lowerHeader.includes('comparing') || lowerHeader.includes('evolution') ||
                lowerHeader.includes('overview') || lowerHeader.includes('introduction')) {
              score -= 5000
            }

            console.log(`   📊 relatedSections match: "${header}" score=${score}`)

            // Update best match if this is better
            if (score > bestScore) {
              bestScore = score
              bestHeader = header
            }
          }
        }
      }

      console.log(`   ✅ Best relatedSections match: "${bestHeader}" score=${bestScore}`)

      // ALWAYS try content-based matching to compare against relatedSections match
      // This ensures we pick the most specific header even when relatedSections is generic
      const questionText = (wrongQ.question.question || '').toLowerCase()
      const explanation = (wrongQ.question.explanation || '').toLowerCase()
      // Normalize text by removing punctuation so "alzheimer's" matches "alzheimers" in headers
      const combinedText = `${questionText} ${explanation}`.replace(/[^a-z0-9\s]/g, '')

      console.log('   📝 Question text:', questionText.substring(0, 100))
      console.log('   📝 Explanation:', explanation.substring(0, 100))

      let bestContentMatch: string | null = null
      let bestContentScore = 0

      for (const header of headers) {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('key takeaways') || lowerHeader.includes('practice tips')) continue

        // Extract significant words from header (4+ chars), strip punctuation, and deduplicate
        // Deduplication prevents headers like "Prion Disease (Creutzfeldt-Jakob Disease)"
        // from getting inflated match counts because "disease" appears twice
        const headerWords = [...new Set(
          lowerHeader
            .split(/\s+/)
            .map(w => w.replace(/[^a-z0-9]/g, '')) // Remove all non-alphanumeric characters
            .filter(w => w.length >= 4)
        )]

        // Get the topic word (first significant word) - handles headers like "Barbiturates: The Old Guard"
        const topicWord = headerWords[0]
        const topicWordMatches = topicWord && combinedText.includes(topicWord)

        // Check if most header words appear in question/explanation
        const matchingWords = headerWords.filter(word => combinedText.includes(word))

        // Allow match if:
        // 1. Standard: 50% of words match AND at least 2 words match
        // 2. OR: The topic word (first word) matches - handles "Barbiturates: The Old Guard" matching "barbiturates"
        if ((matchingWords.length >= Math.ceil(headerWords.length * 0.5) && matchingWords.length >= 2) || topicWordMatches) {
          // Score this match
          let score = matchingWords.length * 100

          // BONUS: Give huge boost if explanation directly mentions header topic
          // e.g., "Interference theory" in explanation should strongly match "Interference Theory: The Real Culprit"
          const normalizedExplanation = explanation.replace(/[^a-z0-9\s]/g, '')
          const explanationWords = headerWords.filter(word => normalizedExplanation.includes(word))
          if (explanationWords.length >= Math.ceil(headerWords.length * 0.5)) {
            score += 10000 // Major bonus for explanation match
            console.log(`   🎯 Content match with explanation bonus: "${header}" score=${score} (matching: ${matchingWords.join(', ')})`)
          } else {
            console.log(`   📊 Content match: "${header}" score=${score} (matching: ${matchingWords.join(', ')})`)
          }

          // Prefer longer/more specific headers
          score += header.length

          if (score > bestContentScore) {
            bestContentScore = score
            bestContentMatch = header
          }
        }
      }

      console.log(`   ✅ Best content match: "${bestContentMatch}" score=${bestContentScore}`)

      // Use content-based match if it scored higher than relatedSections match
      // This allows explanation-driven matching to override generic relatedSections
      if (bestContentMatch && bestContentScore > bestScore) {
        console.log(`   🏆 WINNER: Content-based match "${bestContentMatch}" (${bestContentScore} > ${bestScore})`)
        result.set(wrongQ.questionIndex, bestContentMatch)
        matchedExamTermsRef.current.set(wrongQ.questionIndex, bestContentMatch)
      } else if (bestHeader) {
        console.log(`   🏆 WINNER: relatedSections match "${bestHeader}" (${bestScore} >= ${bestContentScore})`)
        result.set(wrongQ.questionIndex, bestHeader)
        matchedExamTermsRef.current.set(wrongQ.questionIndex, bestHeader)
      }
    }

    // Update the displayed matched terms (deduplicate since multiple questions may match same header)
    if (result.size > 0) {
      setTimeout(() => {
        const uniqueHeaders = [...new Set(matchedExamTermsRef.current.values())]
        setMatchedExamTerms(uniqueHeaders)
      }, 0)
    }

    return result
  }, [baseContent, practiceExamWrongQuestions])

  // Extract significant words from correct answers for paragraph-level matching
  // For single-word answers (e.g., "Donepezil"), use the word directly
  // For phrase answers (e.g., "Definitive diagnosis requires..."), extract distinctive words
  const practiceExamQuestionKeywords = useMemo(() => {
    const result = new Map<number, string[]>() // questionIndex -> keywords

    // Common words to skip - these appear too frequently to be useful for matching
    // Including generic medical terms that appear throughout content
    const skipWords = new Set([
      'the', 'and', 'that', 'this', 'with', 'from', 'have', 'been', 'were', 'are',
      'was', 'will', 'would', 'could', 'should', 'which', 'their', 'there', 'where',
      'what', 'when', 'most', 'more', 'than', 'other', 'into', 'only', 'also',
      'diagnosis', 'disease', 'treatment', 'symptoms', 'patients', 'clinical',
      'typically', 'usually', 'often', 'common', 'requires', 'showing',
      // Generic medical terms that cause false positives
      'associated', 'protein', 'amyloid', 'cognitive', 'disorder', 'disorders',
      'alzheimers', 'memory', 'brain', 'neurocognitive', 'characteristic',
      // Drug-related terms that appear across multiple categories
      'overdose', 'effects', 'causes', 'leading', 'impairment',
      // Common words that appear in explanations but aren't specific to the topic
      'especially', 'commonly', 'prescribed', 'considered', 'including',
      // Alzheimer's/dementia-related terms that appear throughout NCD content
      'plaques', 'tangles', 'insidious', 'accounts', 'features', 'involves',
      'depression', 'responds', 'patterns', 'reversible', 'cortical', 'subcortical',
      'frontotemporal', 'personality', 'language', 'initially', 'distinguishes',
      'pseudodementia', 'delirium', 'fluctuating', 'physiological', 'identification'
    ])

    for (const wrongQ of practiceExamWrongQuestions) {
      const correctAnswer = (wrongQ.question.correct_answer || '')

      // Extract significant words (6+ chars) from the answer
      const words = correctAnswer
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length >= 6 && !skipWords.has(w))

      // Dedupe and store
      result.set(wrongQ.questionIndex, [...new Set(words)])
    }

    return result
  }, [practiceExamWrongQuestions])

  if (!topic) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/topic-selector">Lessons</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Topic Teacher</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">No lesson selected</h1>
            <p className="text-muted-foreground mb-6">
              Please select a lesson from Lessons
            </p>
            <Link href="/topic-selector">
              <Button>Go to Lessons</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <TopicTeacherTourProvider>
    <main className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <div className="flex-1 flex flex-col w-full mx-auto px-4 py-6 pb-40 max-w-[800px]">
        {/* 1. Breadcrumb - above audio bar */}
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/topic-selector">Lessons</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayLessonName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <TutorialButton />
        </div>

        {/* 2. Audio Controls */}
        <LessonAudioControls
          ref={audioControlsRef}
          lessonMarkdown={lessonMarkdown}
          baseLessonMarkdown={baseContent}
          metaphorRanges={metaphorRanges}
          topic={displayLessonName}
          domain={domain}
          userId={user?.id ?? null}
          userInterests={savedInterests.length > 0 ? savedInterests.join(', ') : userInterests}
          languagePreference={languagePreference}
          readAlongEnabled={readAlongEnabled}
          onReadAlongToggle={() => setReadAlongEnabled((prev) => !prev)}
          onWordProgress={readAlongEnabled ? handleWordProgress : undefined}
          autoScrollEnabled={readAlongEnabled ? autoScrollEnabled : false}
          onAutoScrollToggle={
            readAlongEnabled ? () => setAutoScrollEnabled((prev) => !prev) : undefined
          }
          disabledReason={
            isLoading
              ? 'Loading lesson...'
              : isMetaphorUpdating || isRefreshingMetaphors
                ? 'Personalizing metaphors...'
                : languagePreference && isTranslating
                  ? `Translating to ${languagePreference}...`
                  : null
          }
        />

        {/* 3. Interest & Language Inputs */}
        <div className="mb-4 w-full max-w-[800px] flex flex-col sm:flex-row gap-4">
          {/* Interest Tags Input */}
          <div className="flex-1" data-tour="interests-input">
            <div className="relative">
            <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {/* Display saved interests as tags */}
              {savedInterests.map((interest, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                >
                  <span>{interest}</span>
                  <button
                    onClick={() => {
                      const newInterests = savedInterests.filter((_, i) => i !== index)
                      setSavedInterests(newInterests)
                      if (user?.id) {
                        const joined = newInterests.join(', ')
                        // Persist to Supabase (best-effort) and localStorage
                        updateUserCurrentInterest(user.id, joined)
                        if (typeof window !== 'undefined') {
                          if (joined) {
                            localStorage.setItem(`interests_${user.id}`, joined)
                          } else {
                            localStorage.removeItem(`interests_${user.id}`)
                          }
                        }
                      }
                    }}
                    className="hover:opacity-70 transition-opacity"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}

              {/* Input field */}
              <input
                type="text"
                placeholder={savedInterests.length === 0 ? "Add your interests/hobbies/fandoms..." : "Add another interest..."}
                value={currentInterestInput}
                onChange={(e) => setCurrentInterestInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentInterestInput.trim() && user?.id) {
                    e.preventDefault()
                    const newInterest = currentInterestInput.trim()
                    const updatedInterests = [...savedInterests, newInterest]
                    setSavedInterests(updatedInterests)
                    setCurrentInterestInput('')
                    const joined = updatedInterests.join(', ')
                    // Persist to Supabase (best-effort) and localStorage
                    updateUserCurrentInterest(user.id, joined)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`interests_${user.id}`, joined)
                    }
                  }
                }}
                className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
              />

              {/* Enter key indicator */}
              {currentInterestInput.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"
                >
                  <Kbd className="text-xs px-1.5 py-0.5">Enter</Kbd>
                </motion.div>
              )}
            </div>
            {languagePreference && isTranslating && (
              <div className="mt-2 text-xs text-muted-foreground px-1">
                Translating to {languagePreference}...
              </div>
            )}
            </div>
          </div>

          {/* Language Preference Input */}
          <div className="flex-1 sm:max-w-xs" data-tour="language-input">
            <div className="relative">
            <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {/* Display language preference as a single tag */}
              {languagePreference && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                >
                  <span>{languagePreference}</span>
                  <button
                    onClick={async () => {
                      setLanguagePreference(null)
                      setLanguageInput('')
                      setIsTranslating(false)
                      setLastTranslationCacheKey(null)
                      if (user?.id) {
                        try {
                          await updateUserLanguagePreference(user.id, '')
                        } catch (error) {
                          console.debug('Failed to clear language preference:', error)
                        } finally {
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem(`language_pref_${user.id}`)
                          }
                        }
                      }
                      const cacheKeyToRemove = buildTranslationCacheKey(
                        decodedTopic,
                        domain,
                        languagePreference,
                        savedInterests.length > 0 ? savedInterests.join(', ') : userInterests || null
                      )
                      if (cacheKeyToRemove && typeof window !== 'undefined') {
                        localStorage.removeItem(cacheKeyToRemove)
                      }
                    }}
                    className="hover:opacity-70 transition-opacity"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              {/* Input field */}
              {!languagePreference && (
                <input
                  type="text"
                  placeholder="Preferred language (e.g., Spanish)..."
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && languageInput.trim() && user?.id) {
                      e.preventDefault()
                      const newLanguage = normalizeLanguageInput(languageInput)
                      setLanguagePreference(newLanguage)
                      setLastTranslationCacheKey(null)
                      setIsTranslating(false)
                      setLanguageInput('')
                      try {
                        await updateUserLanguagePreference(user.id, newLanguage ?? '')
                        if (typeof window !== 'undefined') {
                          if (newLanguage) {
                            localStorage.setItem(`language_pref_${user.id}`, newLanguage)
                          } else {
                            localStorage.removeItem(`language_pref_${user.id}`)
                          }
                        }
                      } catch (error) {
                        console.debug('Failed to save language preference:', error)
                      }
                    }
                  }}
                  className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
                />
              )}

              {/* Enter key indicator */}
              {!languagePreference && languageInput.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"
                >
                  <Kbd className="text-xs px-1.5 py-0.5">Enter</Kbd>
                </motion.div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* 3. Title - after inputs */}
        <div className="mb-6">
          <TypographyH1>{displayLessonName}</TypographyH1>
        </div>

        {/* 5. Metaphor updating message */}
        {isMetaphorUpdating && (
          <div className="mb-4 rounded-md border border-dashed border-primary/50 bg-primary/5 px-4 py-2 text-sm text-primary">
            Personalizing metaphors for your interests...
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  onClick={initializeLesson}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Tutorial stars - only shown during tutorial if user has no real stars */}
        <TutorialStarLegend
          hasRealStars={highlightData.examWrongSections.length > 0 || matchedExamTerms.length > 0 || highlightData.quizWrongSections.length > 0}
          starColor={starColor}
          onStarClick={() => setShowColorPicker(true)}
        />

        {(highlightData.examWrongSections.length > 0 || matchedExamTerms.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
            data-tour="star-legend-top"
          >
            <p className="text-sm text-foreground/80">
              <VariableStar
                className="inline-block mr-1"
                onClick={() => setShowColorPicker(true)}
                title="Click to change star color"
                color={starColor}
              /> Most recent practice exam
              {matchedExamTerms.length > 0
                ? `: ${matchedExamTerms.join(', ')}`
                : highlightData.examWrongSections.length > 0
                  ? `: ${formatSectionList(highlightData.examWrongSections)}`
                  : ''}
              {isLoadingPracticeExamWrongQuestions ? (
                <span className="ml-2 text-muted-foreground">
                  Loading missed questions…
                </span>
              ) : practiceExamWrongQuestionsError ? (
                <span className="ml-2 text-destructive">
                  Couldn&apos;t load missed questions
                </span>
              ) : null}
	            </p>
	          </motion.div>
	        )}
        {highlightData.quizWrongSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              <VariableStar
                className="inline-block mr-1"
                onClick={() => setShowQuizColorPicker(true)}
                title="Click to change quiz star color"
                color={quizStarColor}
              /> Most recent quiz
              {highlightData.quizWrongSections.length > 0
                ? `: ${formatSectionList(highlightData.quizWrongSections)}`
                : ''}
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 mb-6 rounded-lg p-4" data-tour="lesson-content">
          {messages.length === 0 && !initialized && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground animate-pulse">
                  Loading your lesson...
                </p>
              </div>
            </div>
          )}

          {messages.map((message, idx) => {
            const shouldWrapReadAlong = readAlongEnabled && message.role === 'assistant' && idx === 0
            if (shouldWrapReadAlong) {
              readAlongWordCounterRef.current = 0
            }
            // Reset tutorial star tracking for first assistant message
            if (message.role === 'assistant' && idx === 0) {
              hasShownTutorialStar.current = false
            }

            const wrapReadAlongChildren = (children: React.ReactNode) =>
              shouldWrapReadAlong ? wrapReactNodeWords(children, readAlongWordCounterRef) : children

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`${message.role === 'user' ? 'px-4' : 'pl-12 pr-4'} py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground max-w-2xl'
                      : 'text-foreground w-full'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div
                      ref={message.role === 'assistant' && idx === 0 ? lessonContentRef : undefined}
                      onClick={shouldWrapReadAlong ? handleReadAlongClick : undefined}
                      className="text-base leading-relaxed max-w-none prose prose-invert
                      [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1:not(:first-child)]:mt-12 [&_h1:not(:first-child)]:mb-6
                      [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h2:not(:first-child)]:mb-4 [&_h2:not(:first-child)]:border-t [&_h2:not(:first-child)]:border-border/20 [&_h2:not(:first-child)]:pt-8 [&_h2:not(:first-child)]:mt-0
                      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-snug [&_h3:not(:first-child)]:mt-7 [&_h3:not(:first-child)]:mb-3
                      [&_p]:my-4 [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-foreground/90
                      [&_ul]:my-5 [&_ul]:ml-0 [&_ul]:pl-5 [&_ul>li]:my-2.5 [&_ul>li]:text-base [&_ul>li]:leading-relaxed
                      [&_ol]:my-5 [&_ol]:ml-0 [&_ol]:pl-5 [&_ol>li]:my-2.5 [&_ol>li]:text-base [&_ol>li]:leading-relaxed
                      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_a:hover]:no-underline
                      [&_hr]:my-8 [&_hr]:border-border/30
                      [&_img]:my-6
                      [&_code]:bg-secondary/50 [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                      [&_pre]:bg-secondary/30 [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre_code]:bg-transparent [&_pre_code]:text-foreground
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-5 [&_blockquote]:text-foreground/80
                      [&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:my-5 [&_table]:text-sm [&_table]:overflow-visible
                      [&_th]:border [&_th]:border-border [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
                      [&_td]:border [&_td]:border-border [&_td]:p-3 [&_td]:text-foreground/90 [&_td]:overflow-visible"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={message.role === 'assistant' && idx === 0 && readAlongEnabled ? [rehypeReadAlongWords] : []}
                        components={{
                          h1: ({ children }) => {
                            const text = extractTextFromReactNode(children)

                            // Skip if this h1 matches the topic name (avoid duplicate)
                            const decodedTopic = topic ? decodeURIComponent(topic) : ''
                            const normalizedText = text.trim().toLowerCase()
                            const normalizedTopic = decodedTopic.trim().toLowerCase()
                            if (normalizedText === normalizedTopic) {
                              return null
                            }

                            return (
                              <TypographyH1>
                                {wrapReadAlongChildren(children)}
                              </TypographyH1>
                            )
                          },
                          h2: ({ children }) => {
                            const text = extractTextFromReactNode(children)

                            currentSectionRef.current = text
                            const lowerText = text.toLowerCase()

                            // Track if we're entering/leaving sections where list items should show quiz stars
                            if (lowerText.includes('key takeaways for the eppp') ||
                                lowerText.includes('key takeaways') ||
                                lowerText.includes('practice tips for remembering') ||
                                lowerText.includes('practice tips')) {
                              isInKeyTakeawaysSection.current = true
                              isInIntroSection.current = false
                            } else if (lowerText.includes('why') && lowerText.includes('matter')) {
                              // Track intro "why X matters" sections - don't match paragraphs here
                              isInIntroSection.current = true
                              isInKeyTakeawaysSection.current = false
                            } else if (text) {
                              // New h2 header means we've left these sections
                              isInKeyTakeawaysSection.current = false
                              isInIntroSection.current = false
                            }

                            // Check if THIS header is the best match for any practice exam question
                            const examMatched = practiceExamWrongQuestions.find(
                              (q) => practiceExamQuestionToBestHeader.get(q.questionIndex) === text
                            )

                            // Check if THIS header is the best match for any quiz question
                            const quizMatched = quizWrongAnswers.find(
                              (q) => !q.isResolved && quizQuestionToBestHeader.get(q.questionId) === text
                            )

                            if (examMatched || quizMatched) {
                              return (
                                <OverlappingStarButtons
                                  isH2Header={true}
                                  examMatched={examMatched}
                                  quizMatched={quizMatched}
                                  starColor={starColor}
                                  quizStarColor={quizStarColor}
                                  setActiveMissedQuestion={setActiveMissedQuestion}
                                  setMissedQuestionDialogOpen={setMissedQuestionDialogOpen}
                                  setActiveQuizQuestion={setActiveQuizQuestion}
                                >
                                  <TypographyH2>{wrapReadAlongChildren(children)}</TypographyH2>
                                </OverlappingStarButtons>
                              )
                            }

                            return (
                              <TypographyH2>
                                {wrapReadAlongChildren(children)}
                              </TypographyH2>
                            )
                          },
                          h3: ({ children }) => {
                            const text = extractTextFromReactNode(children)

                            currentSectionRef.current = text

                            // Track if we're entering/leaving sections where list items should show quiz stars
                            const lowerText = text.toLowerCase()
                            if (lowerText.includes('key takeaways for the eppp') ||
                                lowerText.includes('key takeaways') ||
                                lowerText.includes('practice tips for remembering') ||
                                lowerText.includes('practice tips')) {
                              isInKeyTakeawaysSection.current = true
                              isInIntroSection.current = false
                            } else if (text) {
                              // New h3 header means we've left these sections
                              isInKeyTakeawaysSection.current = false
                              // Also reset intro section flag - intro content is only at the very beginning
                              isInIntroSection.current = false
                            }

                            // Check if THIS header is the best match for any practice exam question
                            const examMatched = practiceExamWrongQuestions.find(
                              (q) => practiceExamQuestionToBestHeader.get(q.questionIndex) === text
                            )

                            // Check if THIS header is the best match for any quiz question
                            const quizMatched = quizWrongAnswers.find(
                              (q) => !q.isResolved && quizQuestionToBestHeader.get(q.questionId) === text
                            )

                            if (examMatched || quizMatched) {
                              return (
                                <OverlappingStarButtons
                                  examMatched={examMatched}
                                  quizMatched={quizMatched}
                                  starColor={starColor}
                                  quizStarColor={quizStarColor}
                                  setActiveMissedQuestion={setActiveMissedQuestion}
                                  setMissedQuestionDialogOpen={setMissedQuestionDialogOpen}
                                  setActiveQuizQuestion={setActiveQuizQuestion}
                                >
                                  <TypographyH3>{wrapReadAlongChildren(children)}</TypographyH3>
                                </OverlappingStarButtons>
                              )
                            }

                            // Check if this should be the first tutorial star (when user has no real stars)
                            const hasRealStars = highlightData.examWrongSections.length > 0 ||
                                                 matchedExamTerms.length > 0 ||
                                                 highlightData.quizWrongSections.length > 0
                            const isFirstForTutorial = !hasShownTutorialStar.current && !isInIntroSection.current

                            if (isFirstForTutorial) {
                              hasShownTutorialStar.current = true
                              return (
                                <TutorialSectionStar
                                  hasRealStars={hasRealStars}
                                  starColor={starColor}
                                  isFirstSection={true}
                                >
                                  <TypographyH3>{wrapReadAlongChildren(children)}</TypographyH3>
                                </TutorialSectionStar>
                              )
                            }

                            return (
                              <TypographyH3>
                                {wrapReadAlongChildren(children)}
                              </TypographyH3>
                            )
                          },
                          p: ({ children }) => {
                            const rawText = extractTextFromReactNode(children)
                            if (rawText.includes('[LOADING_METAPHORS]')) {
                              return (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                  <div className="w-24 h-24">
                                    <Lottie animationData={textLoadingAnimation} loop={true} />
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Personalizing metaphors for your interests...
                                  </p>
                                </div>
                              )
                            }

                            const wrappedChildren = wrapReadAlongChildren(children)

                            // Check for term-based match (clickable apple for wrong practice exam questions)
                            let termMatch = findBestWrongPracticeExamQuestionForParagraph(rawText)

                            // Skip paragraph matches for questions that already have a header match
                            // This prevents e.g. barbiturate question from matching benzodiazepine paragraphs
                            // because both mention "drowsiness" - the star should be on the header instead
                            if (termMatch && practiceExamQuestionToBestHeader.get(termMatch.questionIndex)) {
                              termMatch = null
                            }

                            // Also check if this paragraph is in a section that matches a question
                            // and contains key terms from the question/explanation
                            // Skip intro "why matters" sections
                            if (!termMatch && currentSectionRef.current && !isInIntroSection.current) {
                              const normalizedParagraph = rawText.toLowerCase()

                              for (const wrongQ of practiceExamWrongQuestions) {
                                const bestHeader = practiceExamQuestionToBestHeader.get(wrongQ.questionIndex)

                                // Check if we're in the section that matches this question
                                if (bestHeader && labelsMatch(currentSectionRef.current, bestHeader)) {
                                  // Extract key terms from question content
                                  const questionText = (wrongQ.question.question || '').toLowerCase()
                                  const explanation = (wrongQ.question.explanation || '').toLowerCase()
                                  const combinedQuestionText = `${questionText} ${explanation}`

                                  // Extract significant phrases (3+ word sequences)
                                  const phrases = combinedQuestionText.match(/\b\w+(?:\s+\w+){2,}\b/g) || []

                                  // Check if paragraph contains any significant phrases from the question
                                  const hasMatchingPhrase = phrases.some(phrase => {
                                    const words = phrase.split(/\s+/)
                                    // Require at least 60% of words from the phrase to appear in paragraph
                                    const matchingWords = words.filter(w => w.length > 3 && normalizedParagraph.includes(w))
                                    return matchingWords.length >= Math.ceil(words.length * 0.6) && matchingWords.length >= 2
                                  })

                                  if (hasMatchingPhrase) {
                                    termMatch = wrongQ
                                    break
                                  }
                                }
                              }
                            }

                            // Keyword-based matching: find paragraphs containing answer keywords (e.g., "donepezil")
                            // Only match outside Key Takeaways and intro "why matters" sections
                            // Only for questions that DON'T have a header match (to avoid duplicate stars)
                            if (!termMatch && !isInKeyTakeawaysSection.current && !isInIntroSection.current) {
                              const normalizedParagraph = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, '')

                              for (const wrongQ of practiceExamWrongQuestions) {
                                // Skip questions that already have a header match
                                if (practiceExamQuestionToBestHeader.get(wrongQ.questionIndex)) continue

                                const keywords = practiceExamQuestionKeywords.get(wrongQ.questionIndex) || []

                                // Check if paragraph contains any key terms (minimum 6 chars to avoid false positives)
                                for (const keyword of keywords) {
                                  if (keyword.length >= 6 && normalizedParagraph.includes(keyword)) {
                                    termMatch = wrongQ
                                    break
                                  }
                                }
                                if (termMatch) break
                              }
                            }

                            if (termMatch) {
                              return (
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="apple-pulsate absolute -left-10 top-0 flex h-6 w-6 items-center justify-center rounded-full"
                                    onClick={() => {
                                      setActiveMissedQuestion(termMatch)
                                      setMissedQuestionDialogOpen(true)
                                    }}
                                    aria-label="Review missed practice exam question"
                                    title="Review missed practice exam question"
                                  >
                                    <VariableStar color={starColor} />
                                  </button>
                                  <p className="m-0">{wrappedChildren}</p>
                                </div>
                              )
                            }

                            // Fall back to section-based highlighting
                            const { quizWrong, examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = examWrong || recentlyCorrect || recovered

                            return (
                              <div className={`transition-colors ${showIcon ? 'relative' : ''}`}>
                                {showIcon && (
                                  <span className="absolute -left-10 top-0 w-8 flex items-center justify-center text-base leading-none">
                                    {examWrong && <VariableStar className="ml-0.5" color={starColor} />}
                                  </span>
                                )}
                                <p className="m-0">{wrappedChildren}</p>
                              </div>
                            )
                          },
                          ul: ({ children }) => {
                            const { examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = examWrong || recentlyCorrect || recovered

                            return (
                              <div className={`transition-colors ${showIcon ? 'relative' : ''}`}>
                                {showIcon && (
                                  <span className="absolute -left-10 top-0 w-8 flex items-center justify-center text-base leading-none">
                                    {examWrong && <VariableStar className="ml-0.5" color={starColor} />}
                                  </span>
                                )}
                                <ul>{children}</ul>
                              </div>
                            )
                          },
                          ol: ({ children }) => {
                            const { quizWrong, examWrong, recentlyCorrect, recovered } =
                              getHighlightFlags(currentSectionRef.current)

                            const showIcon = examWrong || recentlyCorrect || recovered

                            return (
                              <div className={`transition-colors ${showIcon ? 'relative' : ''}`}>
                                {showIcon && (
                                  <span className="absolute -left-10 top-0 w-8 flex items-center justify-center text-base leading-none">
                                    {examWrong && <VariableStar className="ml-0.5" color={starColor} />}
                                  </span>
                                )}
                                <ol>{children}</ol>
	                              </div>
	                            )
	                          },
	                          li: ({ children }) => {
	                            // Extract text content from children to check for highlighting
	                            const getTextContent = (node: any): string => {
	                              if (typeof node === 'string') return node
	                              if (Array.isArray(node)) return node.map(getTextContent).join(' ')
	                              if (node?.props?.children) return getTextContent(node.props.children)
	                              return ''
	                            }

	                            const textContent = getTextContent(children)

	                            // Check for quiz match ONLY if we're in Key Takeaways/Practice Tips sections
	                            const quizMatch = isInKeyTakeawaysSection.current
	                              ? findQuizMatchForListItem(textContent)
	                              : null

	                            // Check for practice exam match ONLY if we're in Key Takeaways/Practice Tips sections
	                            const examMatch = isInKeyTakeawaysSection.current
	                              ? findPracticeExamMatchForListItem(textContent)
	                              : null

	                            const showIcon = !!quizMatch || !!examMatch
                              const wrappedChildren = wrapReadAlongChildren(children)

	                            // Use overlapping stars component if both matches exist
	                            if (quizMatch && examMatch) {
	                              return (
	                                <li className="relative">
	                                  <OverlappingStarButtons
	                                    examMatched={examMatch}
	                                    quizMatched={quizMatch}
	                                    starColor={starColor}
	                                    quizStarColor={quizStarColor}
	                                    setActiveMissedQuestion={setActiveMissedQuestion}
	                                    setMissedQuestionDialogOpen={setMissedQuestionDialogOpen}
	                                    setActiveQuizQuestion={setActiveQuizQuestion}
	                                  >
	                                    {wrappedChildren}
	                                  </OverlappingStarButtons>
	                                </li>
	                              )
	                            }

	                            return (
	                              <li className={showIcon ? 'relative' : ''}>
	                                {showIcon && (
	                                  <span className="absolute -left-10 top-0 w-8 flex items-start justify-center text-base leading-none">
	                                    {quizMatch && (
	                                      <button
	                                        type="button"
	                                        onClick={() => {
	                                          setActiveQuizQuestion(quizMatch)
	                                          setMissedQuestionDialogOpen(true)
	                                        }}
	                                        className="cursor-pointer"
	                                      >
	                                        <VariableStar color={quizStarColor} />
	                                      </button>
	                                    )}
	                                    {examMatch && (
	                                      <button
	                                        type="button"
	                                        onClick={() => {
	                                          setActiveMissedQuestion(examMatch)
	                                          setMissedQuestionDialogOpen(true)
	                                        }}
	                                        className="cursor-pointer"
	                                      >
	                                        <VariableStar color={starColor} />
	                                      </button>
	                                    )}
	                                  </span>
	                                )}
	                                {wrappedChildren}
	                              </li>
	                            )
	                          },
	                          table: ({ node, children }) => {
	                            // Check if any cell in the table matches a wrong practice exam question
	                            const checkForMatches = (n: any): boolean => {
	                              if (n?.tagName === 'td') {
	                                const cellText = extractTextFromMarkdownNode(n).trim()
	                                return !!findBestWrongPracticeExamQuestionForParagraph(cellText)
	                              }
	                              if (n?.children) {
	                                return n.children.some((child: any) => checkForMatches(child))
	                              }
	                              return false
	                            }

	                            const hasMatch = checkForMatches(node)

	                            if (hasMatch) {
	                              return (
	                                <div className="relative">
	                                  <div style={{ position: 'absolute', left: '-40px', top: '8px' }}>
	                                    <VariableStar color={starColor} />
	                                  </div>
	                                  <table>{children}</table>
	                                </div>
	                              )
	                            }

	                            return <table>{children}</table>
	                          },
	                          td: ({ children }) => <td>{wrapReadAlongChildren(children)}</td>,
	                          tr: ({ node, children }) => {
	                            const rowChildren = Array.isArray((node as any)?.children)
	                              ? ((node as any).children as any[])
	                              : []
	
	                            // Header rows (thead) shouldn't have apples.
	                            if (rowChildren.some((child) => child?.tagName === 'th')) {
	                              return <tr>{children}</tr>
	                            }
	
	                            // For tables, don't add stars - they interfere with table structure
	                            return <tr>{children}</tr>
	                          },
	                          thead: ({ children }) => {
	                            return (
	                              <thead>
	                                {children}
                              </thead>
                            )
                          },
                          th: ({ children }) => {
                            return (
                              <th className="border-b-2 border-border">
                                {wrapReadAlongChildren(children)}
                              </th>
                            )
                          },
                          img: ({ src, alt }) => {
                            const readAlongAlt =
                              shouldWrapReadAlong && alt ? (
                                <span className="sr-only">{wrapReadAlongChildren(alt)}</span>
                              ) : null
                            // Use InlineSvg for SVG files to enable theme-aware styling
                            if (src && src.endsWith('.svg')) {
                              return (
                                <>
                                  <InlineSvg
                                    src={src}
                                    alt={alt || ''}
                                    className="my-6 max-w-full"
                                  />
                                  {readAlongAlt}
                                </>
                              )
                            }
                            // Add theory-diagram class for images that need dark mode inversion
                            const needsDarkModeInvert = src && (
                              src.includes('organizational-theories') ||
                              src.includes('/images/topics/')
                            )
                            // Topic illustration images should be smaller
                            const isTopicIllustration = src && src.includes('/images/topics/')
                            // Regular images
                            return (
                              <>
                                <img
                                  src={src}
                                  alt={alt || ''}
                                  className={`my-6 ${isTopicIllustration ? 'max-w-[420px]' : 'max-w-full'} ${needsDarkModeInvert ? 'theory-diagram' : ''}`}
                                />
                                {readAlongAlt}
                              </>
                            )
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}

          {isMetaphorUpdating && (
            <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Personalizing metaphors...
            </div>
          )}

          {isLoading && <PulseSpinner message="Loading your lesson..." fullScreen={false} />}

          <div ref={messagesEndRef} />
      </div>

	      <div className="sticky bottom-0 z-30 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-[0_-12px_35px_rgba(0,0,0,0.12)]">
	        <div
	          className={`mx-auto w-full max-w-4xl px-6 overflow-hidden transition-all duration-300 ease-out ${
	            isNearBottom ? 'py-4' : 'py-1.5'
	          }`}
          style={{ maxHeight: isNearBottom ? 240 : 140 }}
        >
          <div className="flex items-end gap-3">
            <div data-tour="question-input" className="flex-1 min-w-0">
              <MagicCard
                gradientColor="rgba(255,255,255,0.15)"
                gradientOpacity={0.35}
                gradientFrom="#91A3FF"
                gradientTo="#B4FFE6"
                className="rounded-2xl border border-brand-soft-blue/40"
              >
                <SimplePromptInput
                  className="flex-1 min-w-0 border-none bg-transparent shadow-none"
                  onSubmit={handleSendMessage}
                  placeholder="Ask a follow-up question..."
                  isLoading={isLoading || !initialized}
                  compact={!isNearBottom}
                  framed={false}
                />
              </MagicCard>
            </div>

            {initialized && messages.length > 0 && (
              <div data-tour="quiz-button">
                <PulsatingButton
                  className="flex-shrink-0 [--pulse-color:rgba(0,0,0,0.45)] dark:[--pulse-color:rgba(255,255,255,0.85)]"
                  duration="1.8s"
                  active={isNearBottom}
                >
                <InteractiveHoverButton
                  type="button"
                  size="sm"
                  className="px-5 py-2 text-base font-medium text-foreground bg-transparent border border-border shadow-md"
                  dotClassName="bg-foreground dark:bg-white"
                  hoverTextClassName="text-primary-foreground"
                  onClick={() => {
                    const reviewParam = quizWrongAnswers.length > 0 ? '&review=wrong' : ''
                    const quizPath = `/quizzer?topic=${encodeURIComponent(decodedTopic)}${domain ? `&domain=${encodeURIComponent(domain)}` : ''}${reviewParam}`
                    router.push(quizPath)
                  }}
                  hoverText="Start"
                >
                  Quiz
                </InteractiveHoverButton>
              </PulsatingButton>
              </div>
            )}
          </div>
	        </div>
	      </div>

        <Dialog
          open={missedQuestionDialogOpen}
          onOpenChange={(open) => {
            setMissedQuestionDialogOpen(open)
            if (!open) {
              setActiveMissedQuestion(null)
              setActiveQuizQuestion(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Review missed {activeMissedQuestion && activeQuizQuestion ? 'questions' : 'question'}</DialogTitle>
              <DialogDescription>
                {activeMissedQuestion && activeQuizQuestion
                  ? 'From your practice exam and recent quiz.'
                  : activeMissedQuestion
                  ? 'From your most recent practice exam.'
                  : 'From your most recent quiz.'}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {/* Practice Exam Question */}
              {activeMissedQuestion && (
                <div className="space-y-4">
                  {activeQuizQuestion && (
                    <h3 className="font-semibold text-base border-b pb-2">Practice Exam Question</h3>
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="font-semibold text-sm">Question</h4>
                      <QuestionFeedbackButton
                        examType={
                          activeMissedQuestion.question.examType === 'diagnostic'
                            ? 'diagnostic'
                            : 'practice'
                        }
                        questionId={activeMissedQuestion.question.id ?? null}
                        question={activeMissedQuestion.question.question}
                        options={activeMissedQuestion.question.options}
                        selectedAnswer={activeMissedQuestion.selectedAnswer ?? null}
                        correctAnswer={activeMissedQuestion.question.correct_answer ?? null}
                        wasCorrect={false}
                        metadata={{
                          topic: activeMissedQuestion.question.topicName ?? null,
                          domain: activeMissedQuestion.question.domainId ?? null,
                          relatedSections: activeMissedQuestion.question.relatedSections ?? [],
                          sourceFile: activeMissedQuestion.question.source_file ?? null,
                          sourceFolder: activeMissedQuestion.question.source_folder ?? null,
                          source: 'topic-teacher-missed-exam',
                        }}
                        className="h-7 w-7"
                      />
                    </div>
                    <p className="text-sm text-foreground">
                      {activeMissedQuestion.question.question}
                    </p>
                  </div>

                  {Array.isArray(activeMissedQuestion.question.options) &&
                    activeMissedQuestion.question.options.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Options</h4>
                        <div className="space-y-1">
                          {activeMissedQuestion.question.options.map((option, optIdx) => {
                            const isCorrect = option === activeMissedQuestion.question.correct_answer
                            const isSelected = option === activeMissedQuestion.selectedAnswer
                            const optionLetter = String.fromCharCode(65 + optIdx)

                            return (
                              <div
                                key={optIdx}
                                className={`text-sm p-2 rounded flex items-start gap-2 ${
                                  isCorrect ? 'brand-pill-olive' : ''
                                } ${
                                  isSelected && !isCorrect
                                    ? 'brand-pill-dusty-rose'
                                    : ''
                                }`}
                              >
                                <span className="font-semibold flex-shrink-0">
                                  {optionLetter}.
                                </span>
                                <span className="break-words">
                                  {option}
                                  {isCorrect && (
                                    <span className="font-semibold ml-2">✓ Correct</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="font-semibold ml-2">✗ Your answer</span>
                                  )}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  {activeMissedQuestion.question.explanation ? (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                      <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                        {activeMissedQuestion.question.explanation}
                      </p>
                    </div>
                  ) : null}

                  {/* Smart Explanation for missed exam questions */}
                  {activeMissedQuestion.selectedAnswer &&
                   activeMissedQuestion.selectedAnswer !== activeMissedQuestion.question.correct_answer &&
                   activeMissedQuestion.question.topicName && (
                    <SmartExplanationButton
                      question={activeMissedQuestion.question.question}
                      options={activeMissedQuestion.question.options}
                      correctAnswer={activeMissedQuestion.question.correct_answer}
                      selectedAnswer={activeMissedQuestion.selectedAnswer}
                      topicName={activeMissedQuestion.question.topicName}
                      domain={activeMissedQuestion.question.domainId || ''}
                      userId={user?.id}
                    />
                  )}
                </div>
              )}

              {/* Quiz Question */}
              {activeQuizQuestion && (
                <div className="space-y-4">
                  {activeMissedQuestion && (
                    <h3 className="font-semibold text-base border-b pb-2 mt-4">Quiz Question</h3>
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="font-semibold text-sm">Question</h4>
                      <QuestionFeedbackButton
                        examType="quiz"
                        questionId={activeQuizQuestion.questionId ?? null}
                        question={activeQuizQuestion.question}
                        options={activeQuizQuestion.options ?? null}
                        selectedAnswer={activeQuizQuestion.selectedAnswer ?? null}
                        correctAnswer={activeQuizQuestion.correctAnswer ?? null}
                        wasCorrect={false}
                        metadata={{
                          relatedSections: activeQuizQuestion.relatedSections ?? [],
                          source: 'topic-teacher-missed-quiz',
                        }}
                        className="h-7 w-7"
                      />
                    </div>
                    <p className="text-sm text-foreground">
                      {activeQuizQuestion.question}
                    </p>
                  </div>

                  {Array.isArray(activeQuizQuestion.options) && activeQuizQuestion.options.length > 0 ? (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Options</h4>
                      <div className="space-y-1">
                        {activeQuizQuestion.options.map((option, optIdx) => {
                          const isCorrect = option === activeQuizQuestion.correctAnswer
                          const isSelected = option === activeQuizQuestion.selectedAnswer
                          const optionLetter = String.fromCharCode(65 + optIdx)

                          return (
                            <div
                              key={optIdx}
                              className={`text-sm p-2 rounded flex items-start gap-2 ${
                                isCorrect ? 'brand-pill-olive' : ''
                              } ${
                                isSelected && !isCorrect ? 'brand-pill-dusty-rose' : ''
                              }`}
                            >
                              <span className="font-semibold flex-shrink-0">
                                {optionLetter}.
                              </span>
                              <span className="break-words">
                                {option}
                                {isCorrect && (
                                  <span className="font-semibold ml-2">✓ Correct</span>
                                )}
                                {isSelected && !isCorrect && (
                                  <span className="font-semibold ml-2">✗ Your answer</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Answers</h4>
                      <div className="space-y-1">
                        <div className="text-sm p-2 rounded flex items-start gap-2 brand-pill-dusty-rose">
                          <span className="break-words">
                            {activeQuizQuestion.selectedAnswer}
                            <span className="font-semibold ml-2">✗ Your answer</span>
                          </span>
                        </div>
                        <div className="text-sm p-2 rounded flex items-start gap-2 brand-pill-olive">
                          <span className="break-words">
                            {activeQuizQuestion.correctAnswer}
                            <span className="font-semibold ml-2">✓ Correct</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeQuizQuestion.explanation && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                      <p className="text-sm text-foreground bg-muted/50 p-3 rounded">
                        {activeQuizQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {/* Smart Explanation for missed quiz questions */}
                  {activeQuizQuestion.selectedAnswer &&
                   activeQuizQuestion.selectedAnswer !== activeQuizQuestion.correctAnswer &&
                   decodedTopic && (
                    <SmartExplanationButton
                      question={activeQuizQuestion.question}
                      options={activeQuizQuestion.options || []}
                      correctAnswer={activeQuizQuestion.correctAnswer}
                      selectedAnswer={activeQuizQuestion.selectedAnswer}
                      topicName={decodedTopic}
                      domain={domain || ''}
                      userId={user?.id}
                    />
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMissedQuestionDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Color Picker Dialog */}
        <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
          <DialogContent className="max-w-lg bg-background/95 backdrop-blur">
            <DialogHeader>
              <DialogTitle className="text-lg">Choose Star Color</DialogTitle>
              <DialogDescription className="text-sm opacity-70">Pick any color for your stars</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <HexColorPicker
                  color={starColor}
                  onChange={(newColor) => {
                    setStarColor(newColor)
                    localStorage.setItem('starColor', newColor)
                  }}
                  style={{ width: '100%', height: '250px' }}
                />
                <div className="flex items-center justify-between w-full px-2">
                  <span className="text-sm text-muted-foreground">Selected color:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-border shadow-sm"
                      style={{ backgroundColor: starColor }}
                    />
                    <span className="text-sm font-mono font-semibold">{starColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStarColor('#000000')
                  localStorage.setItem('starColor', '#000000')
                }}
              >
                Reset to Default
              </Button>
              <Button onClick={() => setShowColorPicker(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quiz Star Color Picker Dialog */}
        <Dialog open={showQuizColorPicker} onOpenChange={setShowQuizColorPicker}>
          <DialogContent className="max-w-lg bg-background/95 backdrop-blur">
            <DialogHeader>
              <DialogTitle className="text-lg">Choose Quiz Star Color</DialogTitle>
              <DialogDescription className="text-sm opacity-70">Pick any color for quiz stars</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <HexColorPicker
                  color={quizStarColor}
                  onChange={(newColor) => {
                    setQuizStarColor(newColor)
                    localStorage.setItem('quizStarColor', newColor)
                  }}
                  style={{ width: '100%', height: '250px' }}
                />
                <div className="flex items-center justify-between w-full px-2">
                  <span className="text-sm text-muted-foreground">Selected color:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-border shadow-sm"
                      style={{ backgroundColor: quizStarColor }}
                    />
                    <span className="text-sm font-mono font-semibold">{quizStarColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuizStarColor('#000000')
                  localStorage.setItem('quizStarColor', '#000000')
                }}
              >
                Reset to Default
              </Button>
              <Button onClick={() => setShowQuizColorPicker(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

	        {/* Interests Modal - Disabled since inline input is now visible on page */}
	        {false && savedInterests.length === 0 && (
	          <Dialog open={showInterestsModal} onOpenChange={setShowInterestsModal}>
	            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tell us about your interests</DialogTitle>
                <DialogDescription>
                  Share your hobbies, fandoms, or interests so we can personalize your lessons with relevant examples.
                </DialogDescription>
              </DialogHeader>

              {/* Interest Tags Input - Same as topic selector */}
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 p-2 pl-3 border border-input rounded-md bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  {/* Display saved interests as tags */}
                  {savedInterests.map((interest, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <span>{interest}</span>
                      <button
                        onClick={() => {
                          const newInterests = savedInterests.filter((_, i) => i !== index)
                          setSavedInterests(newInterests)
                          if (user?.id && newInterests.length > 0) {
                            updateUserCurrentInterest(user.id, newInterests.join(', '))
                          }
                        }}
                        className="hover:opacity-70 transition-opacity"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}

                  {/* Input field */}
                  <input
                    type="text"
                    placeholder={savedInterests.length === 0 ? "Add your interests/hobbies/fandoms..." : "Add another interest..."}
                    value={currentInterestInput}
                    onChange={(e) => setCurrentInterestInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentInterestInput.trim() && user?.id) {
                        e.preventDefault()
                        const newInterest = currentInterestInput.trim()
                        const updatedInterests = [...savedInterests, newInterest]
                        setSavedInterests(updatedInterests)
                        setCurrentInterestInput('')
                        updateUserCurrentInterest(user.id, updatedInterests.join(', '))
                      }
                    }}
                    className="flex-1 min-w-[200px] bg-transparent outline-none text-sm"
                  />

                  {/* Enter key indicator */}
                  {currentInterestInput.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"
                    >
                      <Kbd className="text-xs px-1.5 py-0.5">Enter</Kbd>
                    </motion.div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInterestsModal(false)
                  }}
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => {
                    setShowInterestsModal(false)
                  }}
                  disabled={savedInterests.length === 0}
                >
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
    </TopicTeacherTourProvider>
  )
}
