"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ChevronDown } from "lucide-react"

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { SectionHeader } from "@/components/section-header"
import { FooterSection } from "@/components/sections/footer-section"
import { PlanMatchClient } from "./plan-match-client"

type MapKey = "treat" | "modality" | "style" | "cultural" | "filter" | "demographic" | null

// Lab collaborator brand palette (from /lab/timeline COLLAB_COLORS)
const MAP_DOT: Record<Exclude<MapKey, null>, string> = {
  treat: "bg-[#F39E3A]", // orange
  modality: "bg-[#4EBFD4]", // cyan
  style: "bg-[#F5ED43]", // yellow
  cultural: "bg-[#E7437D]", // pink
  filter: "bg-[#AC80AF]", // purple
  demographic: "bg-[#B6D458]", // lime
}

const clientStems: { q: string; m: MapKey }[] = [
  { q: "In your own words, what brings you here?", m: "treat" },
  { q: "Your insurance plan and state.", m: "filter" },
  { q: "What are you working on?", m: "treat" },
  { q: "Any therapy approach you're drawn to?", m: "modality" },
  { q: "Any style preference? Warm or direct. Structured or open.", m: "style" },
  { q: "Anything about them that matters? Language, identity, faith.", m: "cultural" },
  { q: "Gender or age preference for your psychologist?", m: "demographic" },
  { q: "When can you meet? Telehealth okay?", m: null },
]

const providerStems: { q: string; m: MapKey }[] = [
  { q: "Bio and approach in your own words.", m: "treat" },
  { q: "License, NPI, states you can practice in, and insurance networks.", m: "filter" },
  { q: "What you treat. Conditions, populations.", m: "treat" },
  { q: "Modalities. CBT, DBT, EMDR, IFS, ACT, somatic.", m: "modality" },
  { q: "Therapeutic style. Four sliders, 1 to 10.", m: "style" },
  { q: "Languages spoken. LGBTQ+ affirming. Faith-integrated.", m: "cultural" },
  { q: "Gender, age, and identity they bring to the room.", m: "demographic" },
  { q: "Self-pay rate and sliding scale.", m: null },
]

const engineDimensions: { label: string; weight: string; m: MapKey }[] = [
  { label: "Insurance + state", weight: "Filter", m: "filter" },
  { label: "Clinical fit", weight: "35%", m: "treat" },
  { label: "Modality", weight: "20%", m: "modality" },
  { label: "Style", weight: "20%", m: "style" },
  { label: "Cultural fit", weight: "13%", m: "cultural" },
  { label: "Practical + demographic", weight: "12%", m: "demographic" },
]

const sarahMatches: { label: string; m: MapKey }[] = [
  { label: "Aetna in-network, CA-licensed", m: "filter" },
  { label: "Anxiety, trauma, identity", m: "treat" },
  { label: "CBT + EMDR", m: "modality" },
  { label: "Warm, structured", m: "style" },
  { label: "Speaks Mandarin, LGBTQ+ affirming", m: "cultural" },
  { label: "She/her, 30s", m: "demographic" },
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
}

function StepEyebrow({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-mono text-xs text-primary tabular-nums">{n}</span>
      <span className="h-px flex-1 bg-border/60" />
      <h3 className="text-lg font-medium tracking-tight">{label}</h3>
    </div>
  )
}

function MapDot({ m, className = "" }: { m: MapKey; className?: string }) {
  if (!m) return <span className={`inline-block size-1.5 shrink-0 ${className}`} aria-hidden />
  return (
    <span
      className={`inline-block size-1.5 rounded-full shrink-0 ${MAP_DOT[m]} ${className}`}
      aria-hidden
    />
  )
}

function StemList({ items }: { items: { q: string; m: MapKey }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <li key={it.q} className="flex gap-3 items-start">
          <span className="font-mono text-[10px] text-muted-foreground/40 pt-1 shrink-0 tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <MapDot m={it.m} className="mt-[7px]" />
          <span className="text-[14px] text-foreground/85 leading-relaxed">
            {it.q}
          </span>
        </li>
      ))}
    </ol>
  )
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
            <InteractiveHoverButton text="Try it" hoverText="Try it" inverted />
          </a>
        </div>
      </section>

      {/* Centerpiece: 3-step vertical flow */}
      <section className="flex flex-col items-center justify-center w-full relative">
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            Here&apos;s how the engine actually works.
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No keyword filters. No pay-to-rank. Two intakes, one score.
          </p>
        </SectionHeader>

        <div className="w-full max-w-3xl mx-auto px-6 py-16 space-y-12">
          {/* Step 01: Two short forms */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <StepEyebrow n="01" label="Two short forms" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                  Client
                </p>
                <StemList items={clientStems} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                  Clinician
                </p>
                <StemList items={providerStems} />
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center">
            <ChevronDown className="size-5 text-muted-foreground/40" />
          </div>

          {/* Step 02: The engine */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <StepEyebrow n="02" label="One ranking" />
            <div className="relative rounded-xl border border-primary/30 bg-primary/[0.02] p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <motion.span
                  className="size-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                  Matching engine
                </p>
              </div>
              <ul className="space-y-4">
                {engineDimensions.map((dim) => (
                  <li
                    key={dim.label}
                    className="flex items-center justify-between gap-4 border-b border-border/30 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="flex items-center gap-3">
                      <MapDot m={dim.m} />
                      <span className="text-[14px] text-foreground/90">
                        {dim.label}
                      </span>
                    </span>
                    <span
                      className={
                        dim.weight === "Filter"
                          ? "text-[10px] font-mono uppercase tracking-wider text-primary shrink-0"
                          : "text-sm font-mono tabular-nums text-foreground shrink-0"
                      }
                    >
                      {dim.weight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="flex justify-center">
            <ChevronDown className="size-5 text-muted-foreground/40" />
          </div>

          {/* Step 03: The match */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
            <StepEyebrow n="03" label="Match found" />
            <motion.div
              className="rounded-xl border border-primary/30 bg-primary/[0.02] p-6 md:p-8 shadow-sm w-full max-w-md mx-auto space-y-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="flex items-baseline justify-between">
                <p className="text-base font-semibold tracking-tight">
                  Dr. Sarah Chen, Psy.D.
                </p>
                <span className="text-2xl font-bold tracking-tighter text-foreground tabular-nums">
                  94%
                </span>
              </div>

              <ul className="space-y-2.5">
                {sarahMatches.map((it) => (
                  <li key={it.label} className="flex items-center gap-3 text-[13px]">
                    <MapDot m={it.m} />
                    <span className="text-foreground/85 flex-1">{it.label}</span>
                    <span className="text-muted-foreground text-[11px]">matched</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border/40 pt-4 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Your copay</span>
                  <span className="text-lg font-bold tracking-tighter text-foreground">$25</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Next available</span>
                  <span className="text-sm text-foreground/85">Tomorrow, 2:00 PM</span>
                </div>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider">
                  Example flow
                </span>
              </div>
            </motion.div>
          </motion.div>
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
