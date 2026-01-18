'use client'

import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type RatingType = 'stars' | 'thumbs'
type Feature = 'topic_teacher' | 'quizzer' | 'recover' | 'practice_exam' | 'diagnostic_exam'

interface FeatureRatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: Feature
  ratingType: RatingType
  sessionId?: string
  topic?: string
  domain?: string
  durationSeconds?: number
  onSubmit?: () => void
  title?: string
  description?: string
}

export function FeatureRatingDialog({
  open,
  onOpenChange,
  feature,
  ratingType,
  sessionId,
  topic,
  domain,
  durationSeconds,
  onSubmit,
  title,
  description,
}: FeatureRatingDialogProps) {
  const [rating, setRating] = useState<number>(ratingType === 'stars' ? 0 : -1)
  const [hoveredStar, setHoveredStar] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultTitle = feature === 'topic_teacher' ? 'Rate this lesson' : 'How was this quiz?'
  const defaultDescription =
    feature === 'topic_teacher'
      ? 'Your feedback helps us improve the learning experience.'
      : 'Was this quiz helpful for your learning?'

  const handleSubmit = async () => {
    if (ratingType === 'stars' && rating === 0) return
    if (ratingType === 'thumbs' && rating === -1) return

    setIsSubmitting(true)

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        console.error('[feature-rating] No auth token')
        onOpenChange(false)
        return
      }

      const response = await fetch('/api/feature-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feature,
          ratingType,
          ratingValue: rating,
          comment: comment.trim() || null,
          sessionId,
          topic,
          domain,
          durationSeconds,
        }),
      })

      if (!response.ok) {
        console.error('[feature-rating] Submit failed:', await response.text())
      }

      onSubmit?.()
      onOpenChange(false)
    } catch (error) {
      console.error('[feature-rating] Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  const resetState = () => {
    setRating(ratingType === 'stars' ? 0 : -1)
    setHoveredStar(0)
    setComment('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>{description || defaultDescription}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {ratingType === 'stars' ? (
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const isFilled = value <= (hoveredStar || rating)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredStar(value)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Button
                variant={rating === 0 ? 'default' : 'outline'}
                size="lg"
                onClick={() => setRating(0)}
                className={cn(
                  'flex-1 max-w-[140px]',
                  rating === 0 && 'bg-destructive hover:bg-destructive/90'
                )}
              >
                <ThumbsDown className="mr-2 h-5 w-5" />
                Not helpful
              </Button>
              <Button
                variant={rating === 1 ? 'default' : 'outline'}
                size="lg"
                onClick={() => setRating(1)}
                className={cn(
                  'flex-1 max-w-[140px]',
                  rating === 1 && 'bg-green-600 hover:bg-green-700'
                )}
              >
                <ThumbsUp className="mr-2 h-5 w-5" />
                Helpful
              </Button>
            </div>
          )}

          <div className="mt-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any additional feedback? (optional)"
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (ratingType === 'stars' && rating === 0) ||
              (ratingType === 'thumbs' && rating === -1)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
