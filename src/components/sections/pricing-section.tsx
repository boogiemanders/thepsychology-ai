"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SectionHeader } from "@/components/section-header"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"

export function PricingSection() {
  const router = useRouter()
  const [expandedTier, setExpandedTier] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    testDate: "",
    thoughtsGoalsQuestions: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
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
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ tierName: string }>
      const tierName = customEvent.detail?.tierName
      if (!tierName) return
      setExpandedTier((current) => (current === tierName ? current : tierName))
      setFormData({
        email: "",
        phone: "",
        testDate: "",
        thoughtsGoalsQuestions: "",
      })
      setSubmitMessage(null)
    }

    window.addEventListener("mini-pricing-select", handler as EventListener)
    return () => {
      window.removeEventListener("mini-pricing-select", handler as EventListener)
    }
  }, [])

  const handleTierSelect = (tierName: string) => {
    setExpandedTier(expandedTier === tierName ? null : tierName)
    setFormData({
      email: "",
      phone: "",
      testDate: "",
      thoughtsGoalsQuestions: ""
    })
    setSubmitMessage(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      const response = await fetch('/api/pricing-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tier: expandedTier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitMessage({
          type: 'error',
          text: data.error || 'Failed to submit form. Please try again.'
        })
        return
      }

      setSubmitMessage({
        type: 'success',
        text: 'Thank you! Redirecting to sign up...'
      })

      // Redirect to sign-up with email and tier pre-filled
      setTimeout(() => {
        if (data.redirectUrl) {
          router.push(data.redirectUrl)
        }
      }, 1500)
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="get-started" className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          {siteConfig.pricing.title}
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">{siteConfig.pricing.description}</p>
      </SectionHeader>
      <div className="relative w-full h-full">
        <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 gap-4 w-full max-w-6xl mx-auto px-6">
          {siteConfig.pricing.pricingItems.map((tier) => {
            const [displayAmount, displayPeriod] = tier.displayPrice
              ? tier.displayPrice.split("/").map((part) => part.trim())
              : [tier.price, tier.period]

            return (
              <div
                key={tier.name}
                className={cn(
                  "rounded-xl relative overflow-hidden",
                  tier.isPopular
                    ? "md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent"
                    : "bg-accent border border-border",
                  "flex flex-col h-full"
                )}
              >
              {/* Header - Always Visible */}
              <div className="flex flex-col gap-4 p-4">
                <p className="text-sm">
                  {tier.name}
                  {tier.isPopular && (
                    <span className="brand-soft-blue-bg text-white h-6 inline-flex w-fit items-center justify-center px-2 rounded-full text-sm ml-2 shadow-[0px_6px_6px_-3px_rgba(0,0,0,0.25),0_3px_3px_-1.5px_rgba(0,0,0,0.15)]">
                      Popular
                    </span>
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

              {/* Button - Always Visible */}
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

              {/* Features - Always shown */}
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

              {/* Form - Animated Expansion */}
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={expandedTier === tier.name ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="border-t border-border p-4 space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email - Required */}
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
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Thoughts, Goals, Questions - Optional */}
                    <div>
                      <label htmlFor={`thoughtsGoalsQuestions-${tier.name}`} className="block text-sm font-medium mb-2">
                        Anything else? (optional)
                      </label>
                      <textarea
                        id={`thoughtsGoalsQuestions-${tier.name}`}
                        name="thoughtsGoalsQuestions"
                        value={formData.thoughtsGoalsQuestions}
                        onChange={handleInputChange}
                        placeholder="Share anything with us - your goals, questions, or thoughts about your EPPP prep..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
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
          )})}
        </div>
      </div>
    </section>
  )
}
