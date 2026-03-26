"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const dimensions = [
  {
    title: "What they help with",
    description:
      "Do they really help people with what you are dealing with?",
  },
  {
    title: "How they work",
    description:
      "The kind of therapy they use and whether it fits what you want.",
  },
  {
    title: "What you said",
    description:
      "Your own words compared with how they describe their work.",
  },
  {
    title: "Their style",
    description:
      "More structured or more open? Warm or direct? Matched to you.",
  },
  {
    title: "Cultural fit",
    description:
      "Language, background, LGBTQ+ support, faith. If it matters to you, it matters to the match.",
  },
  {
    title: "Real-life details",
    description: "Schedule, video visits, location.",
  },
  {
    title: "Your preferences",
    description: "Gender, age range, anything else you care about.",
  },
]

export function ClientMatchingSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          What matching should do
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-4 space-y-4 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          The goal is a short set of questions about what you&apos;re dealing
          with, what you&apos;ve tried, and what matters to you.
        </p>
        <p>
          We look at 7 dimensions for every therapist. Not just a few
          keywords.
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimensions.map((d, index) => (
          <motion.div
            key={d.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
            viewport={{ once: true, amount: 0.3 }}
            className={
              index === dimensions.length - 1 &&
              dimensions.length % 3 === 1
                ? "sm:col-span-2 lg:col-span-1"
                : ""
            }
          >
            <MagicCard className="rounded-xl h-full">
              <div className="p-5 space-y-2">
                <h3 className="text-sm font-semibold tracking-tight">
                  {d.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {d.description}
                </p>
              </div>
            </MagicCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
