"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import { SectionHeader } from "@/components/section-header"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { supabase } from "@/lib/supabase"
import { CATEGORY_LABELS, getReferralSourcesByCategory } from "@/lib/referral-sources"
import { storeUTMParams, getStoredUTMParams, clearStoredUTMParams, formatUTMForAPI } from "@/lib/utm-tracking"

// Retry helper for critical API calls (profile creation)
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options)
    if (response.ok) return response
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
  }
  return fetch(url, options) // Final attempt, let it throw
}

type Tier = (typeof siteConfig.pricing.pricingItems)[number]

function getDisplayPrice(tier: Tier): { amount: string; period: string } {
  if (tier.displayPrice) {
    const [amount, period] = tier.displayPrice.split("/").map((part) => part.trim())
    return { amount, period: period ?? "" }
  }
  return { amount: tier.price, period: tier.period ?? "" }
}

export function PricingSection() {
  const tiers = useMemo(() => siteConfig.pricing.pricingItems, [])
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    goals: "",
    examDate: "",
    referralSource: "",
    referralSourceOther: "",
  })

  // Store UTM params and referral code when component mounts
  useEffect(() => {
    storeUTMParams()
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('referral_code', ref)
    }
  }, [])

  useEffect(() => {
    const handleMiniPricingSelect = () => {
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        goals: "",
        examDate: "",
        referralSource: "",
        referralSourceOther: "",
      })
      setSubmitMessage(null)
      setShowPasswordFields(false)
    }

    window.addEventListener("mini-pricing-select", handleMiniPricingSelect)
    return () => window.removeEventListener("mini-pricing-select", handleMiniPricingSelect)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!formData.email || !formData.password) {
      setSubmitMessage({ type: "error", text: "Email and password are required." })
      return
    }

    if (formData.password.length < 6) {
      setSubmitMessage({ type: "error", text: "Password must be at least 6 characters." })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitMessage({ type: "error", text: "Passwords do not match." })
      return
    }

    if (!formData.referralSource) {
      setSubmitMessage({ type: "error", text: "Please let us know how you found us." })
      return
    }

    if (formData.referralSource === 'other' && !formData.referralSourceOther.trim()) {
      setSubmitMessage({ type: "error", text: "Please specify how you found us." })
      return
    }

    setIsSubmitting(true)

    try {
      let finalReferralSource = formData.referralSource
      if (formData.referralSource === 'other' && formData.referralSourceOther.trim()) {
        finalReferralSource = `other: ${formData.referralSourceOther.trim()}`
      } else if (formData.referralSource === 'fb_other' && formData.referralSourceOther.trim()) {
        finalReferralSource = `fb_other: ${formData.referralSourceOther.trim()}`
      }

      const utmParams = formatUTMForAPI(getStoredUTMParams())

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            referral_source: finalReferralSource,
            full_name: formData.fullName || null,
            ...utmParams,
          },
        },
      })

      if (error) throw new Error(error.message)

      const userId = data.user?.id
      if (!userId) {
        throw new Error("Unable to create account. Please try again.")
      }

      // All signups get pro trial (create-profile handles trial_ends_at)
      const referredByCode = localStorage.getItem('referral_code')
      const profileResponse = await fetchWithRetry("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: formData.email,
          fullName: formData.fullName || null,
          subscriptionTier: "pro",
          promoCodeUsed: null,
          referralSource: finalReferralSource,
          referredByCode: referredByCode || undefined,
          ...utmParams,
        }),
      })

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => null)
        throw new Error(`Failed to create profile: ${errorData?.error || "Please try again"}`)
      }

      const hasGoalDetails = Boolean(formData.goals.trim() || formData.examDate)
      if (hasGoalDetails) {
        const goalParts = []
        if (formData.goals.trim()) goalParts.push(`Goals: ${formData.goals.trim()}`)
        if (formData.examDate) goalParts.push(`Exam Date: ${formData.examDate}`)

        try {
          await fetch("/api/pricing-submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              phone: "",
              testDate: formData.examDate || "",
              thoughtsGoalsQuestions: goalParts.join(" | "),
              tier: "Pro",
            }),
          })
        } catch (submissionError) {
          console.warn("Failed to save pricing submission", submissionError)
        }
      }

      clearStoredUTMParams()
      localStorage.removeItem('referral_code')

      // Track homepage A/B conversion (non-blocking)
      try {
        let triggerSection: string | null = null
        const sectionEls = document.querySelectorAll<HTMLElement>('[data-section]')
        let maxVisible = 0
        for (const el of sectionEls) {
          const rect = el.getBoundingClientRect()
          const visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
          if (visible > maxVisible) {
            maxVisible = visible
            triggerSection = el.dataset.section ?? null
          }
        }

        const pageStartEl = document.querySelector<HTMLElement>('[data-hp-page-start]')
        const pageStart = pageStartEl ? Number(pageStartEl.dataset.hpPageStart) : null
        const timeOnPageMs = pageStart ? Date.now() - pageStart : null

        fetch('/api/hp/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, triggerSection, timeOnPageMs }),
        })
      } catch {
        // fire-and-forget
      }

      setSubmitMessage({ type: "success", text: "Account created! Redirecting to login..." })
      setTimeout(() => {
        window.location.href = "/login"
      }, 1500)
    } catch (err) {
      console.error("Signup error:", err)
      const message = err instanceof Error ? err.message : "Failed to create account. Please try again."
      setSubmitMessage({ type: "error", text: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tiers.length) return null

  return (
    <section id="get-started" className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          {siteConfig.pricing.title}
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          {siteConfig.pricing.description}
        </p>
      </SectionHeader>

      <div className="w-full max-w-lg mx-auto px-6 space-y-8">
        {tiers.map((tier) => {
          const { amount, period } = getDisplayPrice(tier)

          return (
            <div
              key={tier.name}
              className="rounded-xl border border-primary bg-accent p-5 shadow-[0px_20px_60px_rgba(15,23,42,0.12)] flex flex-col"
            >
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{amount}</span>
                {period && <span className="text-sm text-muted-foreground">/{period}</span>}
              </div>
              {tier.description?.trim() ? (
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              ) : null}

              <ul className="mt-4 space-y-2 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px]">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border mt-5 pt-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  7 days of full Pro access. No credit card required.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor={`fullName-${tier.name}`} className="block text-sm font-medium mb-2">
                      Full Name (optional)
                    </label>
                    <input
                      type="text"
                      id={`fullName-${tier.name}`}
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor={`email-${tier.name}`} className="block text-sm font-medium mb-2">
                      Email Address <span className="text-brand-lavender-gray">*</span>
                    </label>
                    <input
                      type="email"
                      id={`email-${tier.name}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setShowPasswordFields(true)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={showPasswordFields ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`password-${tier.name}`} className="block text-sm font-medium mb-2">
                          Password <span className="text-brand-lavender-gray">*</span>
                        </label>
                        <input
                          type="password"
                          id={`password-${tier.name}`}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Minimum 6 characters"
                          required
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label htmlFor={`confirmPassword-${tier.name}`} className="block text-sm font-medium mb-2">
                          Confirm Password <span className="text-brand-lavender-gray">*</span>
                        </label>
                        <input
                          type="password"
                          id={`confirmPassword-${tier.name}`}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Re-enter password"
                          required
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </motion.div>

                  <div className="border border-dashed border-border/60 rounded-lg p-4 space-y-4">
                    <div>
                      <label htmlFor={`goals-${tier.name}`} className="block text-xs font-medium mb-1 uppercase tracking-wide text-muted-foreground">
                        EPPP Goals
                      </label>
                      <textarea
                        id={`goals-${tier.name}`}
                        name="goals"
                        value={formData.goals}
                        onChange={handleInputChange}
                        placeholder="Plans, concerns, or what success looks like."
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[90px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`examDate-${tier.name}`}
                        className="block text-xs font-medium mb-1 uppercase tracking-wide text-muted-foreground"
                      >
                        Planned exam date
                      </label>
                      <input
                        type="date"
                        id={`examDate-${tier.name}`}
                        name="examDate"
                        value={formData.examDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`referralSource-${tier.name}`}
                        className="block text-xs font-medium mb-1 uppercase tracking-wide text-muted-foreground"
                      >
                        How did you find us? <span className="text-brand-lavender-gray">*</span>
                      </label>
                      <select
                        id={`referralSource-${tier.name}`}
                        name="referralSource"
                        value={formData.referralSource}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                      >
                        <option value="">Select an option...</option>
                        {Object.entries(getReferralSourcesByCategory()).map(([category, sources]) => (
                          <optgroup key={category} label={CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}>
                            {sources.map((source) => (
                              <option key={source.value} value={source.value}>
                                {source.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {formData.referralSource === 'other' && (
                        <input
                          type="text"
                          id={`referralSourceOther-${tier.name}`}
                          name="referralSourceOther"
                          value={formData.referralSourceOther}
                          onChange={handleInputChange}
                          placeholder="Please specify..."
                          required
                          className="w-full mt-2 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}

                      {formData.referralSource === 'fb_other' && (
                        <input
                          type="text"
                          id={`referralSourceOther-${tier.name}`}
                          name="referralSourceOther"
                          value={formData.referralSourceOther}
                          onChange={handleInputChange}
                          placeholder="Which Facebook group?"
                          className="w-full mt-2 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <InteractiveHoverButton
                      type="submit"
                      disabled={isSubmitting}
                      text={isSubmitting ? "Submitting..." : "Start"}
                      className={cn(
                        "transition-colors duration-150 focus-visible:outline focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-brand-soft-blue/60 border border-border shadow-sm",
                        "bg-black text-white border border-black/60 dark:bg-white dark:text-slate-900 dark:border-slate-300",
                        "hover:!bg-brand-coral hover:!text-white dark:hover:!bg-black dark:hover:!text-white"
                      )}
                      hoverTextClassName="text-white dark:text-white"
                      dotClassName="brand-coral-bg dark:brand-lavender-gray-bg"
                    >
                      {isSubmitting ? "Submitting..." : "Start"}
                    </InteractiveHoverButton>
                  </div>

                  {submitMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg text-sm text-center ${
                        submitMessage.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {submitMessage.text}
                    </motion.div>
                  )}

                  <p className="text-xs text-foreground/60 text-center leading-relaxed">
                    Educational tool, not therapy. Not affiliated with ASPPB.
                  </p>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
