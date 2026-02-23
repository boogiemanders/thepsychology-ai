'use client'

import { useRef, useState } from 'react'
import { Star, MessageSquare, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface InlineLessonRatingProps {
  feature: string
  topic?: string
  domain?: string
  durationSeconds?: number
  onSubmitted?: () => void
}

export function InlineLessonRating({
  feature,
  topic,
  domain,
  durationSeconds,
  onSubmitted,
}: InlineLessonRatingProps) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (selectedRating: number) => {
    if (isSubmitting || selectedRating === 0) return
    setIsSubmitting(true)

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return

      await fetch('/api/feature-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feature,
          ratingType: 'stars',
          ratingValue: selectedRating,
          comment: comment.trim() || null,
          topic,
          domain,
          durationSeconds,
        }),
      })

      setSubmitted(true)
      onSubmitted?.()
    } catch (error) {
      console.error('[inline-rating] Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
        Thanks for your feedback!
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Was this helpful?</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const isFilled = value <= (hoveredStar || rating)
            return (
              <button
                key={value}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setRating(value)
                  if (!showComment) {
                    handleSubmit(value)
                  }
                }}
                onMouseEnter={() => setHoveredStar(value)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded disabled:opacity-50"
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'
                  )}
                />
              </button>
            )
          })}
        </div>
        {!showComment ? (
          <button
            type="button"
            onClick={() => {
              setShowComment(true)
              setTimeout(() => textareaRef.current?.focus(), 50)
            }}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Feedback
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowComment(false)}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div
        className="w-full max-w-md grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: showComment ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm mt-1">
            <p className="text-sm font-medium mb-2">Leave a comment</p>
            <Textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could be improved?"
              className="min-h-[80px] resize-none text-sm mb-2"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((value) => {
                  const isFilled = value <= (hoveredStar || rating)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoveredStar(value)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-0.5 focus:outline-none"
                      aria-label={`Rate ${value} stars`}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'
                        )}
                      />
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isSubmitting || rating === 0}
                  onClick={() => handleSubmit(rating)}
                >
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
