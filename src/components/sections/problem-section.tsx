"use client"

import { SectionHeader } from "@/components/section-header"
import { motion } from "motion/react"

export function ProblemSection() {
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
            The EPPP prep industry is broken. You already know this.
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
          AATBS charges $849 to $1,799. Add the exam fee, testing center, and
          you&apos;re spending $1,500+ before you sit down. Fail? Another $687.50
          per retake.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.07 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          The materials are &ldquo;cumbersome, intimidating, and overly
          detailed.&rdquo; Someone passed using 11-year-old PsychPrep content.
          Practice scores don&apos;t predict real scores. People hit 80&ndash;90%
          on practice and still fail the actual exam.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          The #1 predictor of EPPP success is practice testing. But most
          programs sell you 400 pages of reading as their core product.
        </motion.p>

        <motion.p
          className="text-foreground font-medium"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.21 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          We built this because we went through it. Not because we saw a
          market opportunity.
        </motion.p>

        <motion.p
          className="text-sm text-muted-foreground/70"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Built by Anders Chan, Psy.D. Scored 19% on his diagnostic, passed
          first try in 30 days.
        </motion.p>
      </div>
    </section>
  )
}
