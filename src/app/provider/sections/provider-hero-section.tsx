"use client"

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import Link from "next/link"

export function ProviderHeroSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative px-6 py-16 md:py-24">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
        <div className="rounded-full border border-border px-4 py-1.5">
          <AnimatedShinyText className="text-sm">
            Provider early access
          </AnimatedShinyText>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance">
          We&apos;re building the therapist platform we wish existed.{" "}
          <span className="text-muted-foreground">
            No rate cuts. No clawbacks. No paying for directory ghosting.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          If this would help your practice, join early access and tell us what
          would make the pilot genuinely worth using.
        </p>

        <Link href="/contact">
          <InteractiveHoverButton
            text="Request Early Access"
            hoverText="Contact us"
            inverted
          />
        </Link>
      </div>
    </section>
  )
}
