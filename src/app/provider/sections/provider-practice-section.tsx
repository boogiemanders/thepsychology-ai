"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const mechanisms = [
  {
    title: "Review your own sessions",
    description:
      "The best therapists look back at their own work. Not to hunt for mistakes. To spot patterns they missed in the room. If we build this, it should be optional, secure, and private to the clinician.",
  },
  {
    title: "Simple outcome check-ins",
    description:
      "Short check-ins can show when a client is getting worse before the therapist sees it. That gives you a better chance to step in early instead of guessing.",
  },
  {
    title: "Practice one skill at a time",
    description:
      "Getting better is usually not about more years. It is about picking one skill, getting feedback, and practicing on purpose.",
  },
]

export function ProviderPracticeSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          More years don&apos;t guarantee better care. Practice does.
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-4 space-y-4 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          More years in practice do not guarantee better client results. Not at
          5 years. Not at 20. Many therapists level off early.{" "}
          <span className="text-muted-foreground/60 text-sm">
            (Goldberg et al., 2016; Germer et al., 2022)
          </span>
        </p>
        <p className="text-foreground font-medium">
          If this grows beyond referrals, these are three things worth building
          next.
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {mechanisms.map((m, index) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <MagicCard className="rounded-xl h-full">
              <div className="p-6 space-y-3">
                <h3 className="text-lg tracking-tighter font-semibold">
                  {m.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {m.description}
                </p>
              </div>
            </MagicCard>
          </motion.div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12 text-sm text-muted-foreground/70 leading-relaxed">
        <p>
          The research here is promising, but still growing (Diamond et al.,
          2025). These are later ideas, not live product claims. First we need
          to build the basic provider tools.
        </p>
      </div>
    </section>
  )
}
