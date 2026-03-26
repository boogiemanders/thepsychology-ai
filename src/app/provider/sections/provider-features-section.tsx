"use client"

import { SectionHeader } from "@/components/section-header"
import { motion } from "motion/react"

const features = [
  {
    title: "Fit-aware referrals",
    description:
      "A provider platform should send clinicians patients they can actually help, not just charge for a listing and leave everyone guessing.",
  },
  {
    title: "Cleaner insurance workflows",
    description:
      "Eligibility and coverage should be clearer before the first session, not hidden behind vague directory badges and surprise bills.",
  },
  {
    title: "Simple operations",
    description:
      "Telehealth, scheduling, and core workflow should feel like infrastructure, not a stack of add-on subscriptions stitched together.",
  },
  {
    title: "Flat, non-extractive pricing",
    description:
      "If this launches, pricing should stay simple and flat. No percentage of sessions. No clawbacks. No hidden fees.",
  },
  {
    title: "Your practice. Your rates. Your rules.",
    description:
      "The platform should support clinician autonomy. Your rates, your hours, your decisions. Infrastructure, not employer behavior.",
  },
]

export function ProviderFeaturesSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          What we want the provider platform to do
        </h2>
      </SectionHeader>

      <div className="w-full max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className={`space-y-2 ${index === features.length - 1 && features.length % 2 !== 0 ? "md:col-span-2 md:max-w-md md:mx-auto" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="text-lg tracking-tighter font-semibold">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
