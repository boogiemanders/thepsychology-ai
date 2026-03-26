"use client"

import { SectionHeader } from "@/components/section-header"
import { motion } from "motion/react"

const features = [
  {
    title: "Better-fit referrals",
    description:
      "The platform should send you clients you can actually help. Not charge you for a listing and leave everyone guessing.",
  },
  {
    title: "Clear insurance before session one",
    description:
      "Clients should know what their plan covers before the first session. Not after a surprise bill.",
  },
  {
    title: "Simple day-to-day tools",
    description:
      "Telehealth, scheduling, and the basics should work together. Not feel like five subscriptions taped together.",
  },
  {
    title: "Simple, flat pricing",
    description:
      "If this launches, pricing should stay simple and flat. No clawbacks. No hidden fees.",
  },
  {
    title: "Your practice. Your rates. Your rules.",
    description:
      "You stay in control. Your rates, your hours, your choices. The platform helps. It does not run your practice.",
  },
  {
    title: "Your reviews stay yours",
    description:
      "If a client leaves you a review here, you should be able to use it anywhere. Put it on your own website. Keep it if you leave. Your good name should not be trapped inside someone else\u2019s platform.",
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
