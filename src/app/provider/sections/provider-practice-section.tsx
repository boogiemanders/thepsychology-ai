"use client"

import { SectionHeader } from "@/components/section-header"
import { MagicCard } from "@/components/ui/magic-card"
import { motion } from "motion/react"

const mechanisms = [
  {
    title: "Session recording review",
    description:
      "The strongest predictor of superior outcomes (Chow et al., 2015). Not watching for mistakes \u2014 watching for patterns. 90% of clients find it useful (Shepherd et al., 2009). If supported, this should be opt-in, encrypted, and private to the clinician.",
  },
  {
    title: "Routine outcome monitoring",
    description:
      "Therapists can\u2019t accurately spot deteriorating clients without data (APA 2025; Muir et al., 2019). Outcome monitoring catches at-risk cases early \u2014 effect size 0.36\u20130.53. That\u2019s a 20\u201329% advantage over flying blind (Barkham et al., 2023).",
  },
  {
    title: "Targeted skill practice",
    description:
      "DP trainees showed better observer-rated skills and higher empathy at 4-month follow-up (Westra et al., 2021). One agency implementing DP + outcome monitoring reversed the stagnation pattern entirely (Goldberg et al., 2016).",
  },
]

export function ProviderPracticeSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Experience doesn&apos;t predict outcomes. Practice does.
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-4 space-y-4 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          Years of experience don&apos;t predict client outcomes. Not at 5
          years. Not at 20. Most therapists plateau early or decline.{" "}
          <span className="text-muted-foreground/60 text-sm">
            (Goldberg et al., 2016; Germer et al., 2022)
          </span>
        </p>
        <p className="text-foreground font-medium">
          If the provider platform expands beyond referrals, these are three
          areas worth building toward.
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
          The evidence base for deliberate practice in therapy is still
          developing (Diamond et al., 2025). These are future-facing ideas, not
          live product claims. The basic provider workflow has to exist first.
        </p>
      </div>
    </section>
  )
}
