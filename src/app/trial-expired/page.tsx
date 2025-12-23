'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { FeedbackInputBox } from '@/components/ui/feedback-input-box'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { useStripeCheckout } from '@/hooks/use-stripe-checkout'
import { trackFunnelEvent } from '@/lib/funnel-events'

export default function TrialExpiredPage() {
  const { user } = useAuth()
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'success' | 'error' | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const { startCheckout, checkoutTier, checkoutError } = useStripeCheckout()

  useEffect(() => {
    trackFunnelEvent(user?.id ?? null, 'paywall_viewed', {
      page: 'trial-expired',
    })
  }, [user?.id])

  const handleSendFeedback = async (message: string, screenshotFile?: File | null) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage && !screenshotFile) {
      setFeedbackMessage('Please include a quick note or screenshot.')
      setFeedbackStatus('error')
      return
    }

    setIsSubmittingFeedback(true)
    setFeedbackMessage('')
    setFeedbackStatus(null)

    try {
      let screenshotPath: string | null = null

      if (screenshotFile) {
        const extensionFromType = screenshotFile.type?.split('/').pop()
        const extensionFromName = screenshotFile.name.split('.').pop()
        const extension = extensionFromType || extensionFromName || 'png'
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const storagePath = `${user?.id || 'anonymous'}/${uniqueSuffix}.${extension}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback-screenshot')
          .upload(storagePath, screenshotFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: screenshotFile.type || undefined,
          })

        if (uploadError) throw uploadError

        screenshotPath = uploadData?.path || storagePath
      }

      const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/trial-expired'
      const payloadMessage = trimmedMessage || (screenshotFile ? '[Screenshot attached]' : '')

      const shouldForceAnonymous = !user
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: isAnonymous || shouldForceAnonymous ? null : user?.id ?? null,
          user_email: isAnonymous || shouldForceAnonymous ? null : user?.email ?? null,
          message: payloadMessage,
          page_path: pagePath,
          screenshot_path: screenshotPath,
          is_anonymous: isAnonymous || shouldForceAnonymous,
          status: 'new',
        })
        .select()

      if (error) {
        console.error('Feedback insert error (trial-expired):', error)
        throw error
      } else {
        console.log('Feedback successfully saved from trial-expired page:', data)
      }

      setFeedbackMessage('Thanks! Your note just landed with Dr. Chan.')
      setFeedbackStatus('success')
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setFeedbackMessage('Could not send feedback. Please try again.')
      setFeedbackStatus('error')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#07090f] to-black py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      >
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-3">
            <Badge className="w-fit gap-2 bg-red-500/15 text-red-200">
              <AlertCircle className="h-4 w-4" />
              Trial Ended
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight text-white">
              Your 7-day trial just wrapped up
            </CardTitle>
            <CardDescription className="text-base text-slate-300">
              Thank you for trying our program! Continue your rhythm by unlocking the full program.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {siteConfig.pricing.pricingItems
                .filter((tier) => tier.name !== '7-Day Free Trial')
                .map((tier) => {
                  const [displayAmount, displayPeriod] = tier.displayPrice
                    ? tier.displayPrice.split('/').map((part) => part.trim())
                    : [tier.price, tier.period]
                  const planTier =
                    tier.name === 'Pro'
                      ? 'pro'
                      : tier.name === 'Pro + Coaching'
                        ? 'pro_coaching'
                        : null
                  const isPaidTier = Boolean(planTier)
                  const isLoading = Boolean(planTier && checkoutTier === planTier)

                  return (
                    <div
                      key={tier.name}
                      className={cn(
                        'flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4',
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-100">{tier.name}</p>
                          {tier.isPopular && (
                            <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-semibold text-white">{displayAmount}</span>
                          {displayPeriod && (
                            <span className="text-sm font-medium text-slate-300">/{displayPeriod}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-200">{tier.description}</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-100">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]">
                                ✓
                              </span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4">
                        <InteractiveHoverButton
                          type="button"
                          text={
                            isPaidTier && isLoading
                              ? 'Redirecting...'
                              : `Upgrade to ${tier.name}`
                          }
                          hoverText="Secure Checkout"
                          className="w-full border border-white/10 bg-primary text-primary-foreground"
                          disabled={isPaidTier && !!checkoutTier}
                          onClick={() => {
                            if (planTier) {
                              startCheckout(planTier, { redirectPath: '/trial-expired' })
                            }
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
            {checkoutError && (
              <p className="text-sm text-red-400 text-center">{checkoutError}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Questions or Feedback?</CardTitle>
            <CardDescription className="text-slate-300">
              Send a quick note or screenshot—every message is read and used to improve the experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <Switch id="anonymous-feedback" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <div>
                <label htmlFor="anonymous-feedback" className="text-sm font-semibold text-white">
                  Submit anonymously
                </label>
                <p className="text-xs text-slate-400">Keep your name/email off this message.</p>
              </div>
            </div>

            <FeedbackInputBox
              onSend={handleSendFeedback}
              isLoading={isSubmittingFeedback}
              placeholder="Let us know what you need to keep going..."
              className="bg-black/40"
            />
            <p className="text-xs text-slate-400">
              (Optional) Add your email or username in the message if you’d like us to follow up directly.
            </p>

            {feedbackMessage && (
              <p
                className={`text-sm font-medium ${
                  feedbackStatus === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {feedbackMessage}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}
