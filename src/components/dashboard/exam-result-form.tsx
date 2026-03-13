'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { EPPP_DOMAINS } from '@/lib/eppp-data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { GraduationCap, PartyPopper, Heart, Upload, ImageIcon, X } from 'lucide-react'

type ExamResult = {
  id: string
  user_id: string
  passed: boolean
  scaled_score: number | null
  exam_date: string | null
  attempt_number: number
  weak_domains: string[]
  testimonial_interest: boolean
  testimonial_text: string | null
  testimonial_display_name: string | null
  score_report_path: string | null
  notes: string | null
}

interface ExamResultFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
  existingResult?: ExamResult | null
}

export function ExamResultForm({ open, onOpenChange, userId, userEmail, existingResult }: ExamResultFormProps) {
  const [passed, setPassed] = useState<boolean | null>(null)
  const [scaledScore, setScaledScore] = useState('')
  const [examDate, setExamDate] = useState('')
  const [attemptNumber, setAttemptNumber] = useState('1')
  const [weakDomains, setWeakDomains] = useState<string[]>([])
  const [testimonialInterest, setTestimonialInterest] = useState(false)
  const [testimonialText, setTestimonialText] = useState('')
  const [testimonialDisplayName, setTestimonialDisplayName] = useState('')
  const [notes, setNotes] = useState('')
  const [scoreReportFile, setScoreReportFile] = useState<File | null>(null)
  const [scoreReportPreview, setScoreReportPreview] = useState<string | null>(null)
  const [existingScoreReportPath, setExistingScoreReportPath] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (open && existingResult) {
      setPassed(existingResult.passed)
      setScaledScore(existingResult.scaled_score?.toString() ?? '')
      setExamDate(existingResult.exam_date ?? '')
      setAttemptNumber(existingResult.attempt_number?.toString() ?? '1')
      setWeakDomains(existingResult.weak_domains ?? [])
      setTestimonialInterest(existingResult.testimonial_interest ?? false)
      setTestimonialText(existingResult.testimonial_text ?? '')
      setTestimonialDisplayName(existingResult.testimonial_display_name ?? '')
      setNotes(existingResult.notes ?? '')
      setScoreReportFile(null)
      setScoreReportPreview(null)
      setExistingScoreReportPath(existingResult.score_report_path ?? null)
      setSubmitState('idle')
    } else if (open) {
      setPassed(null)
      setScaledScore('')
      setExamDate('')
      setAttemptNumber('1')
      setWeakDomains([])
      setTestimonialInterest(false)
      setTestimonialText('')
      setTestimonialDisplayName(userEmail.split('@')[0])
      setNotes('')
      setScoreReportFile(null)
      setScoreReportPreview(null)
      setExistingScoreReportPath(null)
      setSubmitState('idle')
    }
  }, [open, existingResult, userEmail])

  const toggleDomain = (domainId: string) => {
    setWeakDomains(prev =>
      prev.includes(domainId) ? prev.filter(d => d !== domainId) : [...prev, domainId]
    )
  }

  const handleScoreReportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScoreReportFile(file)
    const url = URL.createObjectURL(file)
    setScoreReportPreview(url)
  }

  const removeScoreReport = () => {
    setScoreReportFile(null)
    if (scoreReportPreview) URL.revokeObjectURL(scoreReportPreview)
    setScoreReportPreview(null)
  }

  const handleSubmit = async () => {
    if (passed === null) return
    setIsSubmitting(true)
    setSubmitState('idle')

    try {
      let scoreReportPath = existingScoreReportPath

      if (scoreReportFile) {
        const extensionFromType = scoreReportFile.type?.split('/').pop()
        const extensionFromName = scoreReportFile.name.split('.').pop()
        const extension = extensionFromType || extensionFromName || 'png'
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const storagePath = `${userId}/${uniqueSuffix}.${extension}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('score-reports')
          .upload(storagePath, scoreReportFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: scoreReportFile.type || undefined,
          })
        if (uploadError) throw uploadError
        scoreReportPath = uploadData?.path || storagePath
      }

      const data = {
        user_id: userId,
        passed,
        scaled_score: scaledScore ? parseInt(scaledScore, 10) : null,
        exam_date: examDate || null,
        attempt_number: parseInt(attemptNumber, 10),
        weak_domains: weakDomains,
        testimonial_interest: passed ? testimonialInterest : false,
        testimonial_text: passed && testimonialInterest ? testimonialText || null : null,
        testimonial_display_name: passed && testimonialInterest ? testimonialDisplayName || null : null,
        score_report_path: scoreReportPath,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }

      if (existingResult) {
        const { error } = await supabase
          .from('eppp_exam_results')
          .update(data)
          .eq('id', existingResult.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('eppp_exam_results')
          .insert(data)
        if (error) throw error
      }
      setSubmitState('success')
    } catch (err) {
      console.error('Error submitting exam result:', err)
      setSubmitState('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitState === 'success') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            {passed ? (
              <>
                <PartyPopper className="w-12 h-12 text-green-500" />
                <h3 className="text-xl font-bold">Congratulations!</h3>
                <p className="text-muted-foreground">
                  You passed the EPPP! That&apos;s a huge achievement. Thank you for sharing your result with us.
                </p>
                {testimonialInterest && (
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll reach out about your testimonial soon.
                  </p>
                )}
              </>
            ) : (
              <>
                <Heart className="w-12 h-12 text-rose-400" />
                <h3 className="text-xl font-bold">Thank you for sharing</h3>
                <p className="text-muted-foreground">
                  Many people pass on their second or third attempt. Your weak domain data helps us improve our study materials for you and others.
                </p>
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            {existingResult ? 'Update My EPPP Result' : 'Report My EPPP Result'}
          </DialogTitle>
          <DialogDescription>
            Share your real exam result. This helps your study materials improve for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Pass / Fail */}
          <div className="space-y-2">
            <Label>Did you pass?</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPassed(true)}
                className={`flex-1 rounded-lg border-2 py-3 text-sm font-semibold transition-colors ${
                  passed === true
                    ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'border-border hover:border-green-500/50'
                }`}
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => setPassed(false)}
                className={`flex-1 rounded-lg border-2 py-3 text-sm font-semibold transition-colors ${
                  passed === false
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'border-border hover:border-red-500/50'
                }`}
              >
                Did Not Pass
              </button>
            </div>
          </div>

          {/* Score & Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scaled-score">Scaled Score (optional)</Label>
              <Input
                id="scaled-score"
                type="number"
                min={200}
                max={800}
                placeholder="200–800"
                value={scaledScore}
                onChange={(e) => setScaledScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attempt-number">Attempt</Label>
              <select
                id="attempt-number"
                value={attemptNumber}
                onChange={(e) => setAttemptNumber(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="1">1st attempt</option>
                <option value="2">2nd attempt</option>
                <option value="3">3rd attempt</option>
                <option value="4">4th+ attempt</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-date">Exam Date (optional)</Label>
            <Input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          {/* Weak Domains */}
          <div className="space-y-2">
            <Label>Which domains felt hardest? (optional)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto rounded-md border border-border p-3">
              {EPPP_DOMAINS.map((domain) => (
                <label key={domain.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={weakDomains.includes(domain.id)}
                    onCheckedChange={() => toggleDomain(domain.id)}
                  />
                  {domain.name}
                </label>
              ))}
            </div>
          </div>

          {/* Score Report Photo */}
          <div className="space-y-2">
            <Label>Upload score report photo (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload a photo of your domain score bars — we&apos;ll use it to identify which areas need the most help.
            </p>
            {scoreReportPreview || existingScoreReportPath ? (
              <div className="relative rounded-lg border border-border overflow-hidden">
                {scoreReportPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scoreReportPreview} alt="Score report preview" className="w-full max-h-48 object-contain bg-muted/30" />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Score report uploaded</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={removeScoreReport}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-foreground/30 p-6 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload a photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScoreReportSelect}
                />
              </label>
            )}
          </div>

          {/* Testimonial (only if passed) */}
          {passed === true && (
            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={testimonialInterest}
                  onCheckedChange={(checked) => setTestimonialInterest(checked === true)}
                />
                <span className="text-sm font-medium">I&apos;d like to share a testimonial</span>
              </label>
              {testimonialInterest && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="testimonial-text">Your testimonial</Label>
                    <Textarea
                      id="testimonial-text"
                      placeholder="How did ThePsychology.AI help you prepare?"
                      value={testimonialText}
                      onChange={(e) => setTestimonialText(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display name</Label>
                    <Input
                      id="display-name"
                      placeholder="How you'd like to be credited"
                      value={testimonialDisplayName}
                      onChange={(e) => setTestimonialDisplayName(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Anything else? (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional thoughts about your exam experience..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          {submitState === 'error' && (
            <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={passed === null || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : existingResult ? 'Update Result' : 'Submit Result'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
