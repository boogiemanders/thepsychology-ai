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
            Client matching early access
          </AnimatedShinyText>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance">
          We&apos;re building a better way to find a therapist.{" "}
          <span className="text-muted-foreground">
            Better fit, less ghosting, fewer insurance surprises.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          If therapy search has burned you before, join early access and tell
          us what broke down.
        </p>

        <Link href="/contact">
          <InteractiveHoverButton
            text="Join Early Access"
            hoverText="Contact us"
            inverted
          />
        </Link>
      </div>
    </section>
  )
}
