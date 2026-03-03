'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/auth-context'
import { Video, MessageSquare, Users, Check, Clock, Copy, ImagePlus, ChevronDown, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type RewardStatus = 'pending' | 'approved' | 'rejected'
type RewardType = 'video' | 'testimonial' | 'referral'

interface Reward {
  id: string
  reward_type: RewardType
  status: RewardStatus
  submission_data: Record<string, string>
  created_at: string
}

interface RewardsState {
  rewards: Reward[]
  referralCode: string | null
  loading: boolean
}

function StatusBadge({ status }: { status: RewardStatus }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
        <Check className="w-2.5 h-2.5" /> +7 days
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
        <Clock className="w-2.5 h-2.5" /> Pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
      Rejected
    </span>
  )
}

const INPUT_CLASS = 'w-full px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand-coral/50'
const BUTTON_CLASS = 'w-full px-3 py-1.5 text-xs font-medium rounded-md brand-coral-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50'

const CARDS: { type: RewardType; icon: typeof Video; title: string; desc: string }[] = [
  { type: 'video', icon: Video, title: 'Post a Quick Video', desc: '30-sec clip on IG, TikTok, LinkedIn, or FB' },
  { type: 'testimonial', icon: MessageSquare, title: 'Share Your Experience', desc: 'Tell us how it helped your prep' },
  { type: 'referral', icon: Users, title: 'Invite a Colleague', desc: 'You both get 7 days of Pro' },
]

export function RewardsPanel() {
  const { userProfile } = useAuth()
  const [state, setState] = useState<RewardsState>({ rewards: [], referralCode: null, loading: true })
  const [expandedCard, setExpandedCard] = useState<RewardType | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [testimonialText, setTestimonialText] = useState('')
  const [testimonialName, setTestimonialName] = useState('')
  const [testimonialRole, setTestimonialRole] = useState('')
  const [testimonialPhoto, setTestimonialPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shouldShow = userProfile?.subscription_tier === 'free' && userProfile?.trial_ends_at

  const fetchRewards = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    try {
      const res = await fetch('/api/rewards/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setState({ rewards: data.rewards, referralCode: data.referralCode, loading: false })
      }
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  useEffect(() => {
    if (shouldShow) fetchRewards()
  }, [shouldShow, fetchRewards])

  if (!shouldShow) return null
  if (state.loading) return null

  const getReward = (type: string) => state.rewards.find((r) => r.reward_type === type)
  const approvedCount = state.rewards.filter((r) => r.status === 'approved').length

  const handleSubmit = async (rewardType: 'video' | 'testimonial') => {
    setError(null)
    setSubmitting(rewardType)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError('Please log in again.')
      setSubmitting(null)
      return
    }

    const data = rewardType === 'video'
      ? { video_url: videoUrl }
      : {
          text: testimonialText,
          name: testimonialName || undefined,
          role: testimonialRole || undefined,
          photo: testimonialPhoto || undefined,
        }

    try {
      const res = await fetch('/api/rewards/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rewardType, data }),
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Something went wrong.')
      } else {
        await fetchRewards()
        setExpandedCard(null)
        setVideoUrl('')
        setTestimonialText('')
        setTestimonialName('')
        setTestimonialRole('')
        setTestimonialPhoto(null)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(null)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setTestimonialPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const referralLink = state.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${state.referralCode}`
    : null

  const handleCopy = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getCardStatus = (type: RewardType): 'done' | 'pending' | 'available' => {
    const reward = getReward(type)
    if (!reward) return 'available'
    if (reward.status === 'approved') return 'done'
    return 'pending'
  }

  return (
    <div className="rounded-lg border border-brand-coral/30 bg-brand-coral/5 dark:border-brand-coral/20 dark:bg-brand-coral/10 p-3 md:p-4">
      {/* Compact header row */}
      <div className="flex items-center gap-3">
        <Gift className="w-4 h-4 text-brand-coral shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-foreground">Get Pro Back — Free</span>
          <span className="text-[10px] text-muted-foreground ml-2">
            {approvedCount}/3 activities = {approvedCount * 7} of 21 days earned
          </span>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {CARDS.map(({ type }) => {
            const s = getCardStatus(type)
            return (
              <div
                key={type}
                className={`w-2 h-2 rounded-full ${
                  s === 'done' ? 'bg-green-500' : s === 'pending' ? 'bg-amber-400' : 'bg-border'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Hover-expand card row */}
      <div className="grid gap-2 sm:grid-cols-3 mt-3">
        <Accordion
          type="single"
          collapsible
          value={expandedCard ?? ''}
          onValueChange={(v) => setExpandedCard((v as RewardType) || null)}
          className="contents"
        >
          {CARDS.map(({ type, icon: Icon, title, desc }) => {
            const reward = getReward(type)
            const isDone = reward?.status === 'approved'

            return (
              <AccordionItem
                key={type}
                value={type}
                className="relative rounded-md border border-border/50 bg-background !border-b"
                onMouseEnter={() => !isDone && !reward && setExpandedCard(type)}
                onMouseLeave={() => {
                  const active = document.activeElement
                  const isTyping = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA'
                  if (!isTyping) setExpandedCard(null)
                }}
              >
                {/* Header row — always visible */}
                <AccordionTrigger className="p-2.5 py-2.5 hover:no-underline [&>svg]:hidden">
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isDone ? 'text-green-500' : 'text-brand-coral'}`} />
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-xs font-medium block truncate">{title}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">{desc}</span>
                    </div>
                    {reward ? (
                      <StatusBadge status={reward.status} />
                    ) : (
                      <ChevronDown className={`w-3 h-3 text-muted-foreground shrink-0 transition-transform duration-200 ${expandedCard === type ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </AccordionTrigger>

                {/* Expanded form — accordion animation inside absolute overlay */}
                {!reward && (
                  <div className="absolute left-[-1px] right-[-1px] top-[calc(100%-1px)] z-20 rounded-b-md border border-border/50 bg-background shadow-md overflow-hidden">
                    <AccordionContent className="pb-0">
                      <div className="px-2.5 pb-2.5 space-y-2 pt-2">
                        {error && expandedCard === type && (
                          <p className="text-[10px] text-red-600 dark:text-red-400">{error}</p>
                        )}

                        {type === 'video' && (
                          <>
                            <input
                              type="url"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="Paste your video link"
                              className={INPUT_CLASS}
                            />
                            <button
                              onClick={() => handleSubmit('video')}
                              disabled={!videoUrl || submitting === 'video'}
                              className={BUTTON_CLASS}
                            >
                              {submitting === 'video' ? 'Submitting...' : 'Submit for Review'}
                            </button>
                          </>
                        )}

                        {type === 'testimonial' && (
                          <>
                            <textarea
                              value={testimonialText}
                              onChange={(e) => setTestimonialText(e.target.value)}
                              placeholder="What's been most helpful so far?"
                              rows={2}
                              className={`${INPUT_CLASS} resize-none`}
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                value={testimonialName}
                                onChange={(e) => setTestimonialName(e.target.value)}
                                placeholder="Name (optional)"
                                className={INPUT_CLASS}
                              />
                              <input
                                type="text"
                                value={testimonialRole}
                                onChange={(e) => setTestimonialRole(e.target.value)}
                                placeholder="Role (optional)"
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {testimonialPhoto ? (
                                  <>
                                    <img src={testimonialPhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
                                    <span>Change photo</span>
                                  </>
                                ) : (
                                  <>
                                    <ImagePlus className="w-3 h-3" />
                                    <span>Add photo (optional)</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => handleSubmit('testimonial')}
                              disabled={testimonialText.trim().length < 20 || submitting === 'testimonial'}
                              className={BUTTON_CLASS}
                            >
                              {submitting === 'testimonial' ? 'Submitting...' : 'Submit for Review'}
                            </button>
                          </>
                        )}

                        {type === 'referral' && referralLink && (
                          <>
                            <div className="flex items-center gap-1">
                              <input
                                readOnly
                                value={referralLink}
                                className="flex-1 px-3 py-1.5 text-xs rounded-md border border-border bg-muted/50 truncate"
                              />
                              <button
                                onClick={handleCopy}
                                className="shrink-0 p-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                                title="Copy link"
                              >
                                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {copied ? 'Copied!' : 'Auto-rewards when they sign up'}
                            </p>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </div>
                )}
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}
