"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, ArrowLeft, ArrowDown } from "lucide-react"

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { MagicCard } from "@/components/ui/magic-card"
import { SectionHeader } from "@/components/section-header"
import { FooterSection } from "@/components/sections/footer-section"
import { PlanMatchClient } from "./plan-match-client"

const clientStems = [
  "What are you working on?",
  "Any therapy approach you're drawn to?",
  "In your own words, what brings you here?",
  "Any style preference? Warm or direct. Structured or open.",
  "Anything about them that matters? Language, identity, faith.",
  "When can you meet? Telehealth okay?",
  "Gender or age preference for your psychologist?",
]

const providerStems = [
  "License, NPI, and states you can practice in.",
  "What you treat. Modalities, conditions, populations.",
  "Therapeutic style. Four sliders, 1 to 10.",
  "Languages spoken. LGBTQ+ affirming. Faith-integrated.",
  "Insurance networks, self-pay rate, sliding scale.",
  "Bio and approach in your own words.",
  "Verified before you go live.",
]

const engineDimensions = [
  { label: "Insurance + state", note: "Hard filter. Out-of-network is opt-in.", weight: "Filter" },
  { label: "Clinical fit", note: "Overlap between what you need and what they treat.", weight: "35%" },
  { label: "Modality", note: "CBT, EMDR, IFS, ACT, somatic. Whatever you want, whatever they do.", weight: "20%" },
  { label: "Style", note: "Four sliders matched against four sliders. Closer is better.", weight: "20%" },
  { label: "Cultural fit", note: "Language. Identity. Faith if it matters to you.", weight: "13%" },
  { label: "Practical", note: "Telehealth, hours, location.", weight: "12%" },
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
}

export function PlanMatchLanding() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center w-full relative px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
          <Link
            href="/lab"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            &larr; Lab
          </Link>

          <div className="rounded-full border border-border px-4 py-1.5">
            <AnimatedShinyText className="text-sm">
              Live demo. Plan Match.
            </AnimatedShinyText>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance">
            Two short forms. One ranking.{" "}
            <span className="text-muted-foreground">
              The therapist who actually fits you.
            </span>
          </h1>

          <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Pick your plan. Pick your state. Watch how seven answers from you
            and seven from them become a single match score.
          </p>

          <a href="#try-it">
            <InteractiveHoverButton
              text="Try it"
              hoverText="Scroll to the form"
              inverted
            />
          </a>
        </div>
      </section>

      {/* Centerpiece: the matching engine flow */}
      <section className="flex flex-col items-center justify-center w-full relative">
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            Here&apos;s how the engine actually works.
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No keyword filters. No pay-to-rank. Two intakes, one score.
          </p>
        </SectionHeader>

        <div className="w-full max-w-6xl mx-auto px-6 py-16">
          {/* Three columns: client / engine / psychologist */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr_1fr] gap-6 lg:gap-8 items-stretch">
            {/* Left: client */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
                You answer
              </p>
              <h3 className="text-lg font-medium tracking-tight mb-5">
                Seven questions, about five minutes.
              </h3>
              <ol className="space-y-3 flex-1">
                {clientStems.map((stem, i) => (
                  <motion.li
                    key={stem}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="flex gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground/50 pt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] text-foreground/90 leading-snug">
                      {stem}
                    </span>
                  </motion.li>
                ))}
              </ol>
              <div className="mt-5 flex items-center justify-center lg:justify-end gap-2 text-primary">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em]">
                  Into the engine
                </span>
                <ArrowRight className="size-4 hidden lg:block" />
                <ArrowDown className="size-4 lg:hidden" />
              </div>
            </motion.div>

            {/* Center: engine */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex"
            >
              <MagicCard
                className="rounded-2xl w-full"
                gradientFrom="hsl(var(--primary))"
                gradientTo="hsl(var(--primary))"
                gradientOpacity={0.15}
              >
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
                    Matching engine
                  </p>
                  <h3 className="text-xl font-medium tracking-tight mb-2">
                    How we rank.
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
                    Filter by what&apos;s non-negotiable. Score the rest on
                    clinical fit, style, and culture. Highest total wins.
                  </p>

                  <ul className="space-y-3 flex-1">
                    {engineDimensions.map((dim, i) => (
                      <motion.li
                        key={dim.label}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                        className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground">
                            {dim.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {dim.note}
                          </p>
                        </div>
                        <span
                          className={
                            dim.weight === "Filter"
                              ? "text-[10px] font-mono uppercase tracking-wider text-primary shrink-0"
                              : "text-sm font-mono tabular-nums text-foreground shrink-0"
                          }
                        >
                          {dim.weight}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </MagicCard>
            </motion.div>

            {/* Right: psychologist */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
                They answer
              </p>
              <h3 className="text-lg font-medium tracking-tight mb-5">
                Seven questions, verified before they go live.
              </h3>
              <ol className="space-y-3 flex-1">
                {providerStems.map((stem, i) => (
                  <motion.li
                    key={stem}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                    className="flex gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground/50 pt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] text-foreground/90 leading-snug">
                      {stem}
                    </span>
                  </motion.li>
                ))}
              </ol>
              <div className="mt-5 flex items-center justify-center lg:justify-start gap-2 text-primary">
                <ArrowLeft className="size-4 hidden lg:block" />
                <ArrowDown className="size-4 lg:hidden" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em]">
                  Into the engine
                </span>
              </div>
            </motion.div>
          </div>

          {/* Output: Sarah Chen card */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground/70">
              <div className="h-px w-12 bg-border" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
                Example output
              </span>
              <div className="h-px w-12 bg-border" />
            </div>

            <motion.div
              className="rounded-xl border border-primary/30 bg-primary/[0.02] p-6 space-y-4 shadow-sm w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/50">
                Match found
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
        </div>
      </section>

      {/* Live search */}
      <section
        id="try-it"
        className="flex flex-col items-center justify-center w-full relative px-6 py-16 md:py-24"
      >
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
              Real search
            </p>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance mb-3">
              Pick your plan and state.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              This hits the live provider database. California and New York
              are open. More states soon.
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/[0.02] shadow-sm p-6 md:p-8">
            <PlanMatchClient />
          </div>
        </div>
      </section>

      {/* Why this matters */}
      <section className="flex flex-col items-center justify-center w-full relative px-6 py-16 md:py-24 bg-muted/20">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary text-center">
            Why this matters
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            About 1 in 5 mental health providers is in any network.
          </h2>
          <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
            <p>
              Finding a therapist who takes your plan shouldn&apos;t feel like a
              part-time job. Calling your insurance. Waiting on hold. Getting a
              PDF directory from 2019. Half the numbers go to voicemails that
              never get returned.
            </p>
            <p>
              A 2021 randomized trial in JAMA Psychiatry showed that patients
              matched to therapists with strengths in their specific problem
              area got better faster. Effect size of 0.75. That&apos;s huge in
              psychotherapy research.
            </p>
            <p>
              Plan and state is step one. Real clinical fit is what moves
              outcomes. That&apos;s what this engine is for.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
            Want first access when matching opens?
          </h2>
          <p className="text-muted-foreground">
            Tell us what made your last therapy search hard. That should shape
            the match you need.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/client">
              <InteractiveHoverButton
                text="I want to find a therapist"
                hoverText="Client early access"
                inverted
              />
            </Link>
            <Link href="/provider">
              <InteractiveHoverButton
                text="I am a psychologist"
                hoverText="Provider early access"
              />
            </Link>
          </div>
        </div>
      </section>

      <FooterSection description="Plan Match is the matching engine behind thePsychology.ai. Clinical fit, not keyword search." />
    </div>
  )
}
