"use client"

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import Link from "next/link"

export function ClientHeroSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative px-6 py-16 md:py-24">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
        <div className="rounded-full border border-border px-4 py-1.5">
          <AnimatedShinyText className="text-sm">
            Real matching. Not a directory.
          </AnimatedShinyText>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance">
          You messaged 15 therapists. One replied.{" "}
          <span className="text-muted-foreground">
            They don&apos;t take your insurance.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          3 minutes. That&apos;s it. Tell us what you need, see your exact
          copay, and book a therapist who actually fits. No phone tag. No
          surprise bills. No waiting.
        </p>

        <Link href="/find-therapist">
          <InteractiveHoverButton
            text="Find a Therapist"
            hoverText="Let's go"
            inverted
          />
        </Link>
      </div>
    </section>
  )
}
