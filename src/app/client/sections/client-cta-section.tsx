"use client"

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import Link from "next/link"

export function ClientCTASection() {
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
          Want first access when matching opens?
        </h2>
        <p className="text-muted-foreground">
          Tell us what made your last therapy search hard. That should shape
          the match you need.
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
