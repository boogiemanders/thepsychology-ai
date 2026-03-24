"use client"

import { SectionHeader } from "@/components/section-header"
import { motion } from "motion/react"

const trustPoints = [
  {
    title: "Verified licenses, not self-reported profiles",
    description:
      "Every provider holds an active state license. Verified by us, not claimed by them.",
  },
  {
    title: "Your data stays between you and your therapist",
    description:
      "No Google Analytics tracking your conditions. No LinkedIn sharing your appointments. No selling your mental health data. (Yes, competitors have done all of this.)",
  },
  {
    title: "Providers who get better over time",
    description:
      "Most therapists plateau or decline with experience. Ours use outcome tracking and deliberate practice. Peer-reviewed science, not a marketing claim (Goldberg et al., 2016; Chow et al., 2015).",
  },
  {
    title: "Built by a licensed psychologist",
    description:
      "Not a VC-backed app chasing engagement metrics. A platform built by someone who\u2019s sat in both chairs.",
  },
]

export function ClientTrustSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Every provider is licensed. Every session is private. This isn&apos;t
          BetterHelp.
        </h2>
      </SectionHeader>

      <div className="w-full max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {trustPoints.map((point, index) => (
          <motion.div
            key={point.title}
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="text-lg tracking-tighter font-semibold">
              {point.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {point.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
