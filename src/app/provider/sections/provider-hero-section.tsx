"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ProviderWaitlistForm } from "./provider-waitlist-form"

export function ProviderHeroSection() {
  const { user, isProvider } = useAuth()
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  const handleOnboardClick = async () => {
    if (!user) {
      router.push("/login?next=/provider")
      return
    }
    if (isProvider) {
      router.push("/provider/onboard")
      return
    }
    setJoining(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const res = await fetch("/api/provider/join", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      })
      if (res.ok) {
        await new Promise((r) => setTimeout(r, 500))
        window.location.href = "/provider/onboard"
      }
    } finally {
      setJoining(false)
    }
  }

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
            No rate cuts. No surprise take-backs. No paying for a profile that
            sends you nothing.
          </span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          If this would help your practice, leave your email and tell us what
          would make the pilot worth joining.
        </p>

        <div className="w-full pt-2">
          <ProviderWaitlistForm source="provider-hero" />
        </div>

        {isProvider ? (
          <Link
            href="/provider/onboard"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Continue onboarding
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleOnboardClick}
            disabled={joining}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-60"
          >
            {joining
              ? "Starting..."
              : user
                ? "Or skip ahead — start the full onboarding"
                : "Or skip ahead — sign in to start onboarding"}
          </button>
        )}
      </div>
    </section>
  )
}
