"use client"

import { SectionHeader } from "@/components/section-header"
import { motion } from "motion/react"

export function VisionSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            You didn&apos;t survive grad school to get stuck here.
          </h2>
        </SectionHeader>
      </motion.div>

      <div className="max-w-2xl mx-auto px-6 pb-12 space-y-5 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          You spent 6 to 10 years in training. You took on six figures of
          debt. You provided thousands of hours of therapy at $15/hour or
          less, sometimes free, because that&apos;s what the system required.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.07 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          All of that gets held hostage by one exam.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Licensed psychologists earn a median of $106,000. Many clear
          $150,000+ in private practice within a few years. No more splitting
          fees with a supervisor. No more facility costs eating your paycheck.
          No more &ldquo;pre-licensed&rdquo; disclaimers. That&apos;s not a
          marginal bump. It&apos;s the life you deferred for a decade.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.21 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          56.4% of people with mental illness in the US go untreated, partly
          because licensing barriers keep qualified clinicians on the
          sidelines. The people you trained to help are waiting. Every month
          stuck in the prep cycle is another month of lost income and lost
          impact.
        </motion.p>

        <motion.p
          className="text-foreground font-medium"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          You&apos;ve already proven you can do the work. You did it for
          years, for almost nothing, because you believed it mattered. It
          did. Now let&apos;s finish this.
        </motion.p>
      </div>
    </section>
  )
}
