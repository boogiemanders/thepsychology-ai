"use client"

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import Link from "next/link"

export function ProviderCTASection() {
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
          Your next client is already looking for someone like you.
        </h2>
        <p className="text-muted-foreground">
          Takes 5 minutes. Free forever for up to 5 clients. No credit card
          required.
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
