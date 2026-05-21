"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
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
              hoverText="Try it"
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
          {/* Relative wrapper so the SVG flow overlay can span columns + output card. */}
          <div className="relative">
          {/* Flow lines: hidden on mobile, drawn on scroll into view */}
          <motion.svg
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden lg:block w-full h-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* A: left column bottom-right -> engine top-left */}
            <motion.path
              d="M 280 360 C 360 380, 380 440, 420 480"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            />
            {/* B: right column bottom-left -> engine top-right */}
            <motion.path
              d="M 720 360 C 640 380, 620 440, 580 480"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            />
            {/* C: engine bottom -> output card top */}
            <motion.path
              d="M 500 720 L 500 880"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
            />
          </motion.svg>

          {/* Three columns: client / engine / psychologist. Borders separate, not cards. */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-12 lg:gap-0 lg:divide-x lg:divide-border/60">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="flex flex-col lg:pr-10"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                Client
              </p>
              <h3 className="text-lg font-medium tracking-tight mb-8">
                Seven questions. About five minutes.
              </h3>
              <ol className="space-y-5 flex-1">
                {clientStems.map((stem, i) => (
                  <li key={stem} className="flex gap-4">
                    <span className="font-mono text-[10px] text-muted-foreground/40 pt-1 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-foreground/85 leading-relaxed">
                      {stem}
                    </span>
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col lg:px-10"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-4">
                Matching engine
              </p>
              <h3 className="text-lg font-medium tracking-tight mb-8">
                How we rank.
              </h3>
              <ul className="space-y-5 flex-1">
                {engineDimensions.map((dim) => (
                  <li
                    key={dim.label}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span className="text-[14px] text-foreground/85">
                      {dim.label}
                    </span>
                    <span
                      className={
                        dim.weight === "Filter"
                          ? "text-[10px] font-mono uppercase tracking-wider text-primary shrink-0"
                          : "text-sm font-mono tabular-nums text-muted-foreground shrink-0"
                      }
                    >
                      {dim.weight}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col lg:pl-10"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                Clinician
              </p>
              <h3 className="text-lg font-medium tracking-tight mb-8">
                Seven questions. Verified before they go live.
              </h3>
              <ol className="space-y-5 flex-1">
                {providerStems.map((stem, i) => (
                  <li key={stem} className="flex gap-4">
                    <span className="font-mono text-[10px] text-muted-foreground/40 pt-1 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-foreground/85 leading-relaxed">
                      {stem}
                    </span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          {/* Output: Sarah Chen card */}
          <div id="match-output" className="relative z-10 mt-20 flex flex-col items-center gap-4">
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
