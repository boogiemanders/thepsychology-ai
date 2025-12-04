"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SectionHeader } from "@/components/section-header"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { supabase } from "@/lib/supabase"
import { STRIPE_PAYMENT_LINKS, type StripeTier } from "@/lib/stripe-links"
import { Badge } from "@/components/ui/badge"

type PricingSectionProps = {
  activeTier?: string
  onActiveTierChange?: (tierName: string) => void
}

export function PricingSection({ activeTier, onActiveTierChange }: PricingSectionProps) {
  const router = useRouter()
  const pricingItems = siteConfig.pricing.pricingItems
  const [expandedTier, setExpandedTier] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    goals: "",
    examDate: "",
    referralSource: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const scrollToCard = useCallback((index: number) => {
    const target = cardRefs.current[index]
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
    }
  }, [])
  const tierIndexMap = useMemo(
    () =>
      pricingItems.reduce<Record<string, number>>((acc, tier, idx) => {
        acc[tier.name] = idx
        return acc
      }, {}),
    [pricingItems]
  )
  const tierBrandSettings: Record<string, { base: string; hover: string; hoverText: string; dot: string }> = {
    "7-Day Free Trial": {
      base: "bg-black text-white border border-black/60 dark:bg-white dark:text-slate-900 dark:border-slate-300",
      hover: "hover:!bg-brand-olive hover:!text-white dark:hover:!bg-black dark:hover:!text-white",
      hoverText: "text-white dark:text-white",
      dot: "brand-olive-bg dark:brand-soft-blue-bg",
    },
    Pro: {
      base: "bg-black text-white border border-black/60 dark:bg-white dark:text-slate-900 dark:border-slate-300",
      hover: "hover:!bg-brand-coral hover:!text-white dark:hover:!bg-black dark:hover:!text-white",
      hoverText: "text-white dark:text-white",
      dot: "brand-coral-bg dark:brand-lavender-gray-bg",
    },
    "Pro + Coaching": {
      base: "bg-black text-white border border-black/60 dark:bg-white dark:text-slate-900 dark:border-slate-300",
      hover: "hover:!bg-brand-dusty-rose hover:!text-white dark:hover:!bg-black dark:hover:!text-white",
      hoverText: "text-white dark:text-white",
      dot: "brand-dusty-rose-bg dark:brand-sage-bg",
    },
  }
  const asteriskClasses: Record<string, string> = {
    "7-Day Free Trial": "text-brand-coral",
    Pro: "text-brand-lavender-gray",
    "Pro + Coaching": "text-brand-sage",
  }

  useEffect(() => {
    if (!activeTier) return
    const index = tierIndexMap[activeTier]
    if (typeof index === "number") {
      scrollToCard(index)
      setActiveSlide(index)
    }
  }, [activeTier, scrollToCard, tierIndexMap])

  useEffect(() => {
    const sliderEl = sliderRef.current
    if (!sliderEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index)
            if (!Number.isNaN(idx)) {
              setActiveSlide(idx)
            }
          }
        })
      },
      {
        root: sliderEl,
        threshold: 0.55,
      }
    )

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card)
    })

    return () => observer.disconnect()
  }, [pricingItems.length])

  useEffect(() => {
    const tier = pricingItems[activeSlide]
    if (tier) {
      onActiveTierChange?.(tier.name)
    }
  }, [activeSlide, pricingItems, onActiveTierChange])

  const handleTierSelect = (tierName: string) => {
    setExpandedTier(expandedTier === tierName ? null : tierName)
    onActiveTierChange?.(tierName)
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      goals: "",
      examDate: "",
      referralSource: "",
    })
    setShowPasswordFields(false)
    setSubmitMessage(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEmailFocus = () => {
    if (!showPasswordFields) {
      setShowPasswordFields(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!expandedTier) {
      setSubmitMessage({
        type: 'error',
        text: 'Please select a plan first.',
      })
      return
    }

    if (!formData.email || !formData.password) {
      setSubmitMessage({
        type: 'error',
        text: 'Email and password are required.',
      })
      return
    }

    if (formData.password.length < 6) {
      setSubmitMessage({
        type: 'error',
        text: 'Password must be at least 6 characters.',
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitMessage({
        type: 'error',
        text: 'Passwords do not match.',
      })
      return
    }

    if (!formData.referralSource.trim()) {
      setSubmitMessage({
        type: 'error',
        text: 'Please let us know how you found us.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      const userId = data.user?.id
      if (!userId) {
        throw new Error('Unable to create account. Please try again.')
      }

      await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: formData.email,
          fullName: formData.fullName || null,
          subscriptionTier: 'free',
          promoCodeUsed: null,
          referralSource: formData.referralSource,
        }),
      })

      const hasGoalDetails = Boolean(formData.goals.trim() || formData.examDate)
      if (hasGoalDetails && expandedTier) {
        const goalParts = []
        if (formData.goals.trim()) {
          goalParts.push(`Goals: ${formData.goals.trim()}`)
        }
        if (formData.examDate) {
          goalParts.push(`Exam Date: ${formData.examDate}`)
        }

        try {
          await fetch('/api/pricing-submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              phone: '',
              testDate: formData.examDate || '',
              thoughtsGoalsQuestions: goalParts.join(' | '),
              tier: expandedTier,
            }),
          })
        } catch (submissionError) {
          console.warn('Failed to save pricing submission', submissionError)
        }
      }

      const tierKey: StripeTier | 'free' =
        expandedTier === 'Pro'
          ? 'pro'
          : expandedTier === 'Pro + Coaching'
            ? 'pro_coaching'
            : 'free'

      if (tierKey === 'free') {
        setSubmitMessage({
          type: 'success',
          text: 'Account created! Check your email to verify. Redirecting to login...',
        })
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        const link = STRIPE_PAYMENT_LINKS[tierKey]
        if (!link) {
          throw new Error('Upgrade link is not configured. Please contact support.')
        }
        window.location.href = link
      }
    } catch (error) {
      console.error('Signup error:', error)
      const message = error instanceof Error ? error.message : 'Failed to create account. Please try again.'
      setSubmitMessage({
        type: 'error',
        text: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTierCard = (
    tier: (typeof pricingItems)[number],
    index: number,
    options?: {
      className?: string
      setRef?: (el: HTMLDivElement | null, idx: number) => void
      keySuffix?: string
    }
  ) => {
    const [displayAmount, displayPeriod] = tier.displayPrice
      ? tier.displayPrice.split("/").map((part) => part.trim())
      : [tier.price, tier.period]

    return (
      <div
        key={`${options?.keySuffix ?? "card"}-${tier.name}`}
        ref={(el) => options?.setRef?.(el ?? null, index)}
        data-index={index}
        className={cn(
          "rounded-xl relative overflow-hidden",
          tier.isPopular
            ? "md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent"
            : "bg-accent border border-border",
          "flex flex-col h-full",
          options?.className
        )}
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm flex items-center gap-2">
            <span>{tier.name}</span>
            {tier.isPopular && (
              <span className="brand-soft-blue-bg text-white h-6 inline-flex w-fit items-center justify-center px-2 rounded-full text-sm shadow-[0px_6px_6px_-3px_rgba(0,0,0,0.25),0_3px_3px_-1.5px_rgba(0,0,0,0.15)]">
                Popular
              </span>
            )}
            {tier.name === 'Pro' && (
              <Badge
                variant="outline"
                className="border-border/60 bg-transparent text-[11px] font-normal px-2 py-0.5"
              >
                $30/mo starting Jan 1, 2026
              </Badge>
            )}
          </p>
          <div className="flex items-baseline mt-2">
            <span className="text-4xl font-semibold">{displayAmount}</span>
            {displayPeriod && (
              <span className="ml-2 text-lg font-medium text-muted-foreground">
                /{displayPeriod}
              </span>
            )}
          </div>
          <p className="text-sm mt-2">{tier.description}</p>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <motion.button
            onClick={() => handleTierSelect(tier.name)}
            className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out relative group ${
              expandedTier === tier.name
                ? "bg-primary text-primary-foreground shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]"
                : tier.isPopular
                ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="group-hover:opacity-0 transition-opacity duration-200">{tier.buttonText}</span>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {expandedTier === tier.name ? "Back" : "Get Started"}
            </span>
          </motion.button>
        </div>

        <div className="overflow-hidden border-t border-border flex-grow">
          <div className="p-4">
            {tier.name === "7-Day Free Trial" ? (
              <p className="text-sm mb-4">No Credit Card</p>
            ) : tier.name === "Pro" ? (
              <p className="text-sm mb-4">Full Features</p>
            ) : tier.name === "Pro + Coaching" ? (
              <p className="text-sm mb-4">Premium Support</p>
            ) : tier.name !== "Basic" && (
              <p className="text-sm mb-4">Everything in Pro +</p>
            )}
            <ul className="space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-5 rounded-full border border-primary/20 flex items-center justify-center",
                      tier.isPopular && "bg-muted-foreground/40 border-border",
                    )}
                  >
                    <div className="size-3 flex items-center justify-center">
                      <svg
                        width="8"
                        height="7"
                        viewBox="0 0 8 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="block dark:hidden"
                      >
                        <path
                          d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
                          stroke="#101828"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <svg
                        width="8"
                        height="7"
                        viewBox="0 0 8 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="hidden dark:block"
                      >
                        <path
                          d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
                          stroke="#FAFAFA"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={expandedTier === tier.name ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="border-t border-border p-4 space-y-4">
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
                  Email Address <span className={asteriskClasses[tier.name] ?? "text-brand-coral"}>*</span>
                </label>
                <input
                  type="email"
                  id={`email-${tier.name}`}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={handleEmailFocus}
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
                      Password <span className={asteriskClasses[tier.name] ?? "text-brand-coral"}>*</span>
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
                      Confirm Password <span className={asteriskClasses[tier.name] ?? "text-brand-coral"}>*</span>
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
                  <label htmlFor={`examDate-${tier.name}`} className="block text-xs font-medium mb-1 uppercase tracking-wide text-muted-foreground">
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
                  <label htmlFor={`referralSource-${tier.name}`} className="block text-xs font-medium mb-1 uppercase tracking-wide text-muted-foreground">
                    How did you find us? <span className={asteriskClasses[tier.name] ?? "text-brand-coral"}>*</span>
                  </label>
                  <input
                    type="text"
                    id={`referralSource-${tier.name}`}
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={handleInputChange}
                    placeholder="Friend, Social Media, Web Search"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                {(() => {
                  const brand = tierBrandSettings[tier.name] ?? {
                    base: "",
                    hover: "",
                    hoverText: "",
                    dot: "",
                  }
                  return (
                    <InteractiveHoverButton
                      type="submit"
                      disabled={isSubmitting}
                      text={isSubmitting ? "Submitting..." : "Start"}
                      className={cn(
                        "transition-colors duration-150 focus-visible:outline focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-brand-soft-blue/60 border border-border shadow-sm",
                        brand?.base,
                        brand?.hover
                      )}
                      hoverTextClassName={brand?.hoverText}
                      dotClassName={brand?.dot}
                    >
                      {isSubmitting ? "Submitting..." : "Start"}
                    </InteractiveHoverButton>
                  )
                })()}
              </div>

              {submitMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg text-sm text-center ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
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
        </motion.div>
      </div>
    )
  }

  return (
    <section id="get-started" className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          {siteConfig.pricing.title}
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">{siteConfig.pricing.description}</p>
      </SectionHeader>
      <div className="relative w-full h-full space-y-8 lg:space-y-0">
        <div className="w-full lg:hidden relative z-10">
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 px-6 pb-4 -mx-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pricingItems.map((tier, index) =>
              renderTierCard(tier, index, {
                className: "snap-start shrink-0 basis-[85%] min-w-[85%]",
                setRef: (el, idx) => {
                  cardRefs.current[idx] = el
                },
                keySuffix: "mobile",
              })
            )}
            <div className="shrink-0 basis-[10%]" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            {pricingItems.map((tier, index) => (
              <button
                key={`dot-${tier.name}`}
                type="button"
                onClick={() => scrollToCard(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  activeSlide === index ? "w-6 bg-primary" : "w-2 bg-border"
                )}
                aria-label={`Show ${tier.name} plan`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Swipe to compare plans</p>
        </div>

        <div className="hidden lg:grid min-[900px]:grid-cols-3 gap-4 w-full max-w-6xl mx-auto px-6">
          {pricingItems.map((tier, index) =>
            renderTierCard(tier, index, { keySuffix: "desktop" })
          )}
        </div>
      </div>
    </section>
  )
}
