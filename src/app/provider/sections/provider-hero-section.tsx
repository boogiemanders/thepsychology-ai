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
            From the team that helped you pass the EPPP
          </AnimatedShinyText>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance">
          Psychology Today referrals dropped 90%.{" "}
          <span className="text-muted-foreground">
            Headway cut your rates. Alma fabricated your clinical notes.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          There&apos;s a better way to build a practice. No rate cuts. No
          clawbacks. No $125/month to get ghosted by your own platform. Set up
          your profile in 5 minutes.
        </p>

        <Link href="/provider/onboarding">
          <InteractiveHoverButton
            text="Set Up Your Profile"
            hoverText="Let's go"
            inverted
          />
        </Link>
      </div>
    </section>
  )
}
