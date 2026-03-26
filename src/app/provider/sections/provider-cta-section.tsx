"use client"

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import Link from "next/link"

export function ProviderCTASection() {
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
          Want to help shape the provider pilot?
        </h2>
        <p className="text-muted-foreground">
          Tell us about your practice, your biggest platform pain points, and
          what would make a first version genuinely worth switching for.
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
