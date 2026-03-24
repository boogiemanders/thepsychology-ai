"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const steps = [
  {
    number: "1",
    title: "Tell us what you need",
    description:
      "What you\u2019re dealing with, what you\u2019ve tried, what matters to you. No jargon. Honest questions. 3 minutes.",
  },
  {
    number: "2",
    title: "See your matches",
    description:
      "A ranked list \u2014 not 200 faces in a grid. Each provider scored for your situation, with a clear explanation of why they fit.",
  },
  {
    number: "3",
    title: "Book instantly",
    description:
      "Pick a time. Confirm. Show up. No emails, no voicemails, no \u2018I\u2019ll get back to you in 5\u20137 business days.\u2019",
  },
]

export function ClientHowItWorksSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Three steps. No phone tag.
        </h2>
      </SectionHeader>

      <div className="w-full max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <MagicCard className="rounded-xl h-full">
              <div className="p-6 space-y-3">
                <span className="text-3xl font-bold tracking-tighter text-primary/70">
                  {step.number}
                </span>
                <h3 className="text-lg tracking-tighter font-semibold">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </MagicCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
