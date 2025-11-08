'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, BookOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getUserInterests, saveUserInterests, hasUserInterests } from '@/lib/interests-storage'
import { getQuizResults, WrongAnswer } from '@/lib/quiz-results-storage'
import { PulseSpinner } from '@/components/PulseSpinner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface HighlightData {
  recentlyWrongSections: string[]
  recentlyCorrectSections: string[]
  previouslyWrongNowCorrectSections: string[]
}

export default function TopicTeacherPage() {
  const searchParams = useSearchParams()
  const domain = searchParams.get('domain')
  const topic = searchParams.get('topic')
  const hasQuizResults = searchParams.get('hasQuizResults') === 'true'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)
  const [interestsInput, setInterestsInput] = useState('')
  const [userInterests, setUserInterests] = useState<string | null>(null)
  const [highlightData, setHighlightData] = useState<HighlightData>({
    recentlyWrongSections: [],
    recentlyCorrectSections: [],
    previouslyWrongNowCorrectSections: [],
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentSectionRef = useRef<string>('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check for user interests on mount
  useEffect(() => {
    const interests = getUserInterests()
    setUserInterests(interests)
    if (!interests) {
      setShowInterestsModal(true)
    }
  }, [])

  // Load quiz results and compute highlight data
  useEffect(() => {
    if (hasQuizResults && topic) {
      const decodedTopic = decodeURIComponent(topic)
      const quizResults = getQuizResults(decodedTopic)

      if (quizResults && quizResults.wrongAnswers && quizResults.wrongAnswers.length > 0) {
        const recentlyWrongSections = quizResults.wrongAnswers.flatMap(
          (wa) => wa.relatedSections || []
        )
        const recentlyCorrectSections = quizResults.correctAnswers
          .filter((ca) => !(ca as any).wasPreviouslyWrong)
          .flatMap((ca) => ca.relatedSections || [])
        const previouslyWrongNowCorrectSections = quizResults.correctAnswers
          .filter((ca) => (ca as any).wasPreviouslyWrong)
          .flatMap((ca) => ca.relatedSections || [])

        setHighlightData({
          recentlyWrongSections: [...new Set(recentlyWrongSections)],
          recentlyCorrectSections: [...new Set(recentlyCorrectSections)],
          previouslyWrongNowCorrectSections: [
            ...new Set(previouslyWrongNowCorrectSections),
          ],
        })
      }
    }
  }, [hasQuizResults, topic])

  // Initialize with lesson
  useEffect(() => {
    if (!initialized && topic && userInterests !== undefined) {
      initializeLesson()
    }
  }, [topic, initialized, userInterests])

  const initializeLesson = async () => {
    if (!topic) return

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
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load lesson')
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

      setMessages([
        {
          role: 'assistant',
          content:
            lessonContent ||
            'Lesson loaded. Feel free to ask follow-up questions!',
        },
      ])
      setInitialized(true)
    } catch (err) {
      console.error('Error loading lesson:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load lesson'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || !topic) return

    const userMessage = input.trim()
    setInput('')

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

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to send message'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    // Exact match
    if (s1 === s2) return 1

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.9

    // Word matching - check if key words overlap
    const words1 = s1.split(/\s+/).filter(w => w.length > 2)
    const words2 = s2.split(/\s+/).filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) {
      // If no words, check character overlap
      let matchingChars = 0
      for (let char of s2) {
        if (s1.includes(char)) matchingChars++
      }
      return matchingChars / Math.max(s1.length, s2.length)
    }

    const matchedWords = words1.filter(w1 =>
      words2.some(w2 => w2.startsWith(w1.substring(0, 3)) || w1.startsWith(w2.substring(0, 3)))
    )

    return matchedWords.length > 0 ? (matchedWords.length / Math.min(words1.length, words2.length)) : 0
  }

  const getHighlightType = (text: string): 'recently-wrong' | 'previously-wrong-now-correct' | 'recently-correct' | null => {
    if (!hasQuizResults || (highlightData.recentlyWrongSections.length === 0 &&
        highlightData.previouslyWrongNowCorrectSections.length === 0 &&
        highlightData.recentlyCorrectSections.length === 0)) {
      return null
    }

    if (!text || text.trim().length === 0) {
      return null
    }

    const SIMILARITY_THRESHOLD = 0.25

    // Check if this header matches recently wrong sections
    for (const section of highlightData.recentlyWrongSections) {
      const similarity = calculateSimilarity(text, section)
      if (similarity > SIMILARITY_THRESHOLD) {
        return 'recently-wrong'
      }
    }

    // Check if this header matches previously wrong, now correct
    for (const section of highlightData.previouslyWrongNowCorrectSections) {
      const similarity = calculateSimilarity(text, section)
      if (similarity > SIMILARITY_THRESHOLD) {
        return 'previously-wrong-now-correct'
      }
    }

    // Check if this header matches recently correct
    for (const section of highlightData.recentlyCorrectSections) {
      const similarity = calculateSimilarity(text, section)
      if (similarity > SIMILARITY_THRESHOLD) {
        return 'recently-correct'
      }
    }

    return null
  }

  const getHeaderHighlightClass = (text: string): string => {
    const highlightType = getHighlightType(text)

    if (highlightType === 'recently-wrong') {
      return 'bg-blue-500/30 border-l-4 border-blue-500 !pl-4'
    } else if (highlightType === 'previously-wrong-now-correct') {
      return 'bg-amber-500/25 border-l-4 border-amber-500 !pl-4'
    } else if (highlightType === 'recently-correct') {
      return '!opacity-40'
    }

    return ''
  }

  if (!topic) {
    return (
      <main className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tools/topic-selector"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft size={18} />
            Back to Topics
          </Link>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">No topic selected</h1>
            <p className="text-muted-foreground mb-6">
              Please select a topic from Topics
            </p>
            <Link href="/tools/topic-selector">
              <Button>Go to Topics</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col w-full mx-auto p-6 max-w-4xl">
        <Link
          href="/tools/topic-selector"
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft size={18} />
          Back to Topics
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{decodeURIComponent(topic)}</h1>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4"
          >
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={initializeLesson}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Retry
            </Button>
          </motion.div>
        )}

        {highlightData.recentlyWrongSections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-foreground/80">
              🍏 Highlighting sections: {highlightData.recentlyWrongSections.join(', ')}
            </p>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 rounded-lg p-4">
          {messages.length === 0 && !initialized && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={24} />
                </div>
                <p className="text-muted-foreground">
                  Loading your lesson...
                </p>
              </div>
            </div>
          )}

          {messages.map((message, idx) => {
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
                  className={`px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground max-w-2xl'
                      : 'text-foreground w-full'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-base leading-relaxed max-w-none prose prose-invert
                      [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1:not(:first-child)]:mt-12 [&_h1:not(:first-child)]:mb-6
                      [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h2:not(:first-child)]:mb-4 [&_h2:not(:first-child)]:border-t [&_h2:not(:first-child)]:border-border/20 [&_h2:not(:first-child)]:pt-8 [&_h2:not(:first-child)]:mt-0
                      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-snug [&_h3:not(:first-child)]:mt-7 [&_h3:not(:first-child)]:mb-3
                      [&_p]:my-4 [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-foreground/90
                      [&_ul]:my-5 [&_ul]:ml-5 [&_ul>li]:my-2.5 [&_ul>li]:text-base [&_ul>li]:leading-relaxed
                      [&_ol]:my-5 [&_ol]:ml-5 [&_ol>li]:my-2.5 [&_ol>li]:text-base [&_ol>li]:leading-relaxed
                      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_a:hover]:no-underline
                      [&_hr]:my-8 [&_hr]:border-border/30
                      [&_img]:rounded-lg [&_img]:my-6 [&_img]:shadow-md
                      [&_code]:bg-secondary/50 [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                      [&_pre]:bg-secondary/30 [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre_code]:bg-transparent [&_pre_code]:text-foreground
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-5 [&_blockquote]:text-foreground/80
                      [&_table]:w-full [&_table]:border-collapse [&_table]:my-5 [&_table]:text-sm
                      [&_th]:border [&_th]:border-border [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
                      [&_td]:border [&_td]:border-border [&_td]:p-3 [&_td]:text-foreground/90">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => {
                            let text = ''
                            if (typeof children === 'string') {
                              text = children
                            } else if (Array.isArray(children)) {
                              text = children
                                .map((c) => {
                                  if (typeof c === 'string') return c
                                  if (c?.props?.children) {
                                    if (typeof c.props.children === 'string') return c.props.children
                                    if (Array.isArray(c.props.children)) {
                                      return c.props.children.filter(x => typeof x === 'string').join('')
                                    }
                                  }
                                  return ''
                                })
                                .join('')
                            }

                            // Skip if this h1 matches the topic name (avoid duplicate)
                            const decodedTopic = topic ? decodeURIComponent(topic) : ''
                            const normalizedText = text.trim().toLowerCase()
                            const normalizedTopic = decodedTopic.trim().toLowerCase()
                            if (normalizedText === normalizedTopic) {
                              return null
                            }

                            return (
                              <h1
                                className="!text-3xl !font-bold !leading-tight"
                              >
                                {children}
                              </h1>
                            )
                          },
                          h2: ({ children }) => {
                            let text = ''
                            if (typeof children === 'string') {
                              text = children
                            } else if (Array.isArray(children)) {
                              text = children
                                .map((c) => {
                                  if (typeof c === 'string') return c
                                  if (c?.props?.children) {
                                    if (typeof c.props.children === 'string') return c.props.children
                                    if (Array.isArray(c.props.children)) {
                                      return c.props.children.filter(x => typeof x === 'string').join('')
                                    }
                                  }
                                  return ''
                                })
                                .join('')
                            }

                            currentSectionRef.current = text
                            return (
                              <h2
                                className="!text-2xl !font-semibold !leading-snug"
                              >
                                {children}
                              </h2>
                            )
                          },
                          h3: ({ children }) => {
                            let text = ''
                            if (typeof children === 'string') {
                              text = children
                            } else if (Array.isArray(children)) {
                              text = children
                                .map((c) => {
                                  if (typeof c === 'string') return c
                                  if (c?.props?.children) {
                                    if (typeof c.props.children === 'string') return c.props.children
                                    if (Array.isArray(c.props.children)) {
                                      return c.props.children.filter(x => typeof x === 'string').join('')
                                    }
                                  }
                                  return ''
                                })
                                .join('')
                            }

                            currentSectionRef.current = text
                            return (
                              <h3
                                className="!text-lg !font-semibold !leading-snug"
                              >
                                {children}
                              </h3>
                            )
                          },
                          p: ({ children }) => {
                            const highlightType = getHighlightType(currentSectionRef.current)
                            let className = ''
                            if (highlightType === 'recently-wrong') {
                              className = 'flex gap-2 items-start'
                            }
                            return (
                              <p className={className}>
                                {highlightType === 'recently-wrong' && <span className="flex-shrink-0 mt-0.5">🍏</span>}
                                <span>{children}</span>
                              </p>
                            )
                          },
                          ul: ({ children }) => {
                            const highlightType = getHighlightType(currentSectionRef.current)
                            let className = ''
                            if (highlightType === 'recently-wrong') {
                              className = 'flex gap-2 items-start'
                            }
                            return (
                              <ul className={className}>
                                {highlightType === 'recently-wrong' && <span className="flex-shrink-0">🍏</span>}
                                <div>{children}</div>
                              </ul>
                            )
                          },
                          ol: ({ children }) => {
                            const highlightType = getHighlightType(currentSectionRef.current)
                            let className = ''
                            if (highlightType === 'recently-wrong') {
                              className = 'flex gap-2 items-start'
                            }
                            return (
                              <ol className={className}>
                                {highlightType === 'recently-wrong' && <span className="flex-shrink-0">🍏</span>}
                                <div>{children}</div>
                              </ol>
                            )
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
                                {children}
                              </th>
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

          {isLoading && <PulseSpinner message="Loading your lesson..." fullScreen={false} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex items-start gap-3 -mx-6 px-6 pl-12 pr-32">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !initialized}
            placeholder="Ask a follow-up question..."
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim() || !initialized}
            size="icon"
          >
            <Send size={20} />
          </Button>
        </form>

        {initialized && messages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border -mx-6 px-6 pl-12 pr-32">
            <Link href={`/tools/quizzer?topic=${encodeURIComponent(decodeURIComponent(topic))}`}>
              <Button variant="minimal" className="w-full">
                Take Quiz on This Topic →
              </Button>
            </Link>
          </div>
        )}

        {/* Interests Modal */}
        {showInterestsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-background border border-border rounded-lg p-8 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tell us about your interests</h2>
                <button
                  onClick={() => {
                    setShowInterestsModal(false)
                    setUserInterests('')
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Share your hobbies, fandoms, or interests so we can personalize your lessons with relevant examples.
              </p>

              <textarea
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g., gaming, Marvel movies, cooking, anime, basketball..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
              />

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInterestsModal(false)
                    setUserInterests('')
                  }}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    if (interestsInput.trim()) {
                      saveUserInterests(interestsInput)
                      setUserInterests(interestsInput)
                      setShowInterestsModal(false)
                    }
                  }}
                  disabled={!interestsInput.trim()}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
