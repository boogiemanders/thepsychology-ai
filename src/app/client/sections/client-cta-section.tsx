"use client"

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import Link from "next/link"

export function ClientCTASection() {
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
          You&apos;ve waited long enough.
        </h2>
        <p className="text-muted-foreground">
          Free to use. No account required to see your matches. 3 minutes from
          now, you could be looking at a therapist who actually fits.
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
