"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const dimensions = [
  {
    title: "What they specialize in",
    description:
      "Your concerns matched against their actual clinical experience.",
  },
  {
    title: "How they work",
    description:
      "CBT, EMDR, psychodynamic \u2014 matched to what you prefer or what works for your situation.",
  },
  {
    title: "What you described",
    description:
      "Your words compared against how they describe their approach.",
  },
  {
    title: "Their style",
    description:
      "Structured or exploratory? Warm or direct? Matched to you.",
  },
  {
    title: "Cultural fit",
    description:
      "Language, background, LGBTQ+ affirming, faith \u2014 if it matters to you, it matters to the match.",
  },
  {
    title: "Practical",
    description: "Schedule overlap, telehealth, location.",
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
          We don&apos;t show you 200 profiles and wish you luck.
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-4 space-y-4 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          Answer a few questions about what you&apos;re dealing with, what
          you&apos;ve tried, what matters to you. Takes 3 minutes.
        </p>
        <p>
          We score every provider across 7 dimensions. Not a keyword search.
          Not a filter. A real match.
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
