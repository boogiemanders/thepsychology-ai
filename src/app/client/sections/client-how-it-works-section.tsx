"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const steps = [
  {
    number: "1",
    title: "Tell us what you need",
    description:
      "A short set of questions about what you are dealing with, what you have tried, and what matters to you.",
  },
  {
    number: "2",
    title: "See your matches",
    description:
      "Each therapist scored for your situation, with a clear reason they may fit.",
  },
  {
    number: "3",
    title: "Book instantly",
    description:
      "Pick a time. Confirm. Show up. No emails, no voicemails, no 'I'll get back to you in 5-7 business days.'",
  },
]

export function ClientHowItWorksSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          If we do this right, it should be simple
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
