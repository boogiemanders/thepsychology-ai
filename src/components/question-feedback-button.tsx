'use client'

import { useCallback, useMemo, useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { supabase } from '@/lib/supabase'

type ExamType = 'quiz' | 'diagnostic' | 'practice'

export type QuestionFeedbackButtonProps = {
  examType: ExamType
  questionId?: string | number | null
  question: string
  options?: string[] | null
  selectedAnswer?: string | null
  correctAnswer?: string | null
  wasCorrect?: boolean | null
  metadata?: Record<string, unknown> | null
  className?: string
}

const feedbackTags = [
  { value: 'confusing', label: 'Confusing' },
  { value: 'too-hard', label: 'Too hard' },
  { value: 'too-easy', label: 'Too easy' },
  { value: 'bad-options', label: 'Bad options' },
  { value: 'wrong-answer', label: 'Wrong answer' },
  { value: 'great-explanation', label: 'Great explanation' },
] as const

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 3
  return Math.max(1, Math.min(5, Math.round(value)))
}

export function QuestionFeedbackButton(props: QuestionFeedbackButtonProps) {
  const [open, setOpen] = useState(false)
  const [quality, setQuality] = useState<number>(3)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const payload = useMemo(
    () => ({
      examType: props.examType,
      questionId: props.questionId ?? null,
      question: props.question,
      options: Array.isArray(props.options) ? props.options : null,
      selectedAnswer: props.selectedAnswer ?? null,
      correctAnswer: props.correctAnswer ?? null,
      wasCorrect: typeof props.wasCorrect === 'boolean' ? props.wasCorrect : null,
      rating: clampRating(quality),
      confidence: null,
      comment: comment.trim().length > 0 ? comment.trim() : null,
      metadata: {
        ...(props.metadata ?? {}),
        tags,
      },
    }),
    [props, quality, comment, tags]
  )

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      const token = data.session?.access_token
      if (!token) {
        setError('Please sign in to submit feedback.')
        return
      }

      const response = await fetch('/api/question-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      setTimeout(() => setOpen(false), 450)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [payload, isSubmitting])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setSubmitted(false)
          setError(null)
          setQuality(3)
          setTags([])
          setComment('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={props.className ?? 'h-7 w-7'}
          title="Question feedback"
          aria-label="Question feedback"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Question feedback</DialogTitle>
          <DialogDescription className="text-xs">
            Quick slider + tags help tune question quality and difficulty.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Quality (question + answer choices)</div>
              <div className="text-xs tabular-nums text-muted-foreground">{clampRating(quality)}/5</div>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[clampRating(quality)]}
              onValueChange={(next) => setQuality(next?.[0] ?? 3)}
              className="text-[color:var(--brand-soft-blue)]"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Poor</span>
              <span>Great</span>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-xs text-muted-foreground">Tags</div>
            <ToggleGroup
              type="multiple"
              value={tags}
              onValueChange={(next) => setTags(Array.isArray(next) ? next : [])}
              className="flex flex-wrap justify-start gap-2"
            >
              {feedbackTags.map((tag) => (
                <ToggleGroupItem
                  key={tag.value}
                  value={tag.value}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  {tag.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Optional note</div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anything confusing, incorrect, or unclear?"
              className="min-h-[72px] text-xs"
            />
          </div>

          {error && <div className="text-xs text-red-500">{error}</div>}
          {submitted && <div className="text-xs text-green-600">Thanks — saved.</div>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button type="button" size="sm" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
