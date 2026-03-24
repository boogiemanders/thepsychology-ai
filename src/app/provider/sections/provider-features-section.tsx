"use client"

import { SectionHeader } from "@/components/section-header"
import { motion } from "motion/react"

const features = [
  {
    title: "Clients who fit your specialization",
    description:
      "Not a directory where you pay to be listed and hope. 7-dimension matching scores clients on specialization, modality, style, and cultural fit. You see clients you can actually help.",
  },
  {
    title: "Real insurance verification",
    description:
      "Clients see their actual copay amount. Not \u2018accepts Blue Cross.\u2019 The real number, verified in real time through Stedi. No first-session billing surprises.",
  },
  {
    title: "Telehealth built in",
    description:
      "HIPAA-compliant video via Daily.co. No Zoom. No Doxy. No $50/month subscription. Clients click a button and they\u2019re in your session.",
  },
  {
    title: "$0 or $99/month. That\u2019s it.",
    description:
      "Free: 5 clients, full matching, insurance verification, telehealth. Pro: $99/month, unlimited. No percentage of sessions. No clawbacks. No hidden fees.",
  },
  {
    title: "Your practice. Your rates. Your rules.",
    description:
      "Set your rates. Choose your hours. Accept or decline referrals. We\u2019re infrastructure, not your employer.",
  },
]

export function ProviderFeaturesSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Everything you need to run a practice. Nothing that extracts from it.
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
