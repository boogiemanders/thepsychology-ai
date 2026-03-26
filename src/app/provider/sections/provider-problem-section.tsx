"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const competitors = [
  {
    name: "Psychology Today",
    stat: "77–90%",
    statLabel: "fewer referrals since 2020",
    points: [
      "Monthly inquiries dropped from 8–15 to 1–3. Still charges $29.95/month.",
      "No booking. No real insurance checks. No real matching.",
    ],
    quotes: [
      {
        text: "I used to get 10 to 12 calls a month from PT. Now I\u2019m lucky to get 1.",
        source: "Reframe Practice analysis",
      },
      {
        text: "Real therapists like me can\u2019t be found.",
        source: "Sharon Harper, LCSW",
      },
    ],
  },
  {
    name: "Headway",
    stat: "$41",
    statLabel: "cut rates by $41 per session (Jan 2025)",
    points: [
      "Rates dropped from $144.27 to $103. At 25 clients a week, that adds up fast.",
      "They took back $2,400+ from sessions they billed for you.",
      "They were sued for sharing therapy search and booking data.",
    ],
    quotes: [
      {
        text: "The dirty secret is they\u2019re a VC-funded company that needs to show profitability. Guess where the money comes from? Your reimbursement rates.",
        source: "r/privatepractice",
      },
    ],
  },
  {
    name: "Alma",
    stat: "30%",
    statLabel: "rate cuts + $125/month fee",
    points: [
      "BBB rating: 2.6 out of 5. 67% one-star reviews.",
      "Its AI notes added abuse history, substance use, and suicidal thoughts that were never said. Alma called it a \u20181% error rate.\u2019",
    ],
    quotes: [
      {
        text: "If a therapist fabricated this information in a note, they\u2019d lose their license. But when AI does it, Alma calls it a \u2018hallucination\u2019 and moves on.",
        source: "r/therapists",
      },
    ],
  },
]

export function ProviderProblemSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          The platforms you&apos;re paying are the ones bleeding you dry.
        </h2>
      </SectionHeader>

      <div className="w-full max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {competitors.map((comp, index) => (
          <motion.div
            key={comp.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <MagicCard className="rounded-xl h-full">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold tracking-tighter">
                  {comp.name}
                </h3>
                <div>
                  <span className="text-3xl font-bold tracking-tighter text-brand-coral">
                    {comp.stat}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {comp.statLabel}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {comp.points.map((point) => (
                    <li
                      key={point.slice(0, 40)}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="space-y-3 pt-2 border-t border-border">
                  {comp.quotes.map((q) => (
                    <blockquote
                      key={q.text.slice(0, 40)}
                      className="text-sm italic text-muted-foreground/80 leading-relaxed"
                    >
                      &ldquo;{q.text}&rdquo;
                      <footer className="text-xs text-muted-foreground/60 mt-1 not-italic">
                        &mdash; {q.source}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            </MagicCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
