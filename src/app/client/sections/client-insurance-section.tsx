"use client"

import { SectionHeader } from "@/components/section-header"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

const oldWay = [
  "Call your insurance company",
  "Wait on hold for 20 minutes",
  "Ask if Dr. Smith is in-network",
  "Get transferred",
  "\"That information isn't available by phone\"",
  "Give up. Pay out of pocket. Hope for the best.",
]

export function ClientInsuranceSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Your copay is $25. Not &ldquo;we think it might be covered.&rdquo;
        </h2>
      </SectionHeader>

      <div className="w-full max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/50">
            The old way
          </h3>
          <ul className="space-y-3">
            {oldWay.map((step, i) => (
              <li
                key={i}
                className={cn(
                  "text-sm text-muted-foreground/60 flex items-start gap-2",
                  i === oldWay.length - 1 && "text-muted-foreground/40 italic"
                )}
              >
                <span className="text-muted-foreground/30 mt-0.5 line-through">
                  &#10003;
                </span>
                <span className="line-through">{step}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="rounded-xl border border-primary/30 bg-primary/[0.02] p-6 space-y-4 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/50">
            What we want
          </h3>
          <div className="space-y-3">
            <p className="text-base font-semibold tracking-tight">
              Dr. Sarah Chen, Psy.D.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Match score:</span>
              <span className="text-foreground font-semibold">94%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your copay:</span>
              <span className="text-2xl font-bold tracking-tighter text-foreground">
                $25
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Next available: Tomorrow, 2:00 PM
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Example flow
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12 text-sm text-muted-foreground leading-relaxed">
        <p>
          The goal is clear insurance info before you book.
        </p>
      </div>
    </section>
  )
}
