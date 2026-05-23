"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ProviderWaitlistForm } from "./provider-waitlist-form"

export function ProviderCTASection() {
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
    <section id="provider-waitlist-cta" className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6 scroll-mt-24">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
          Want to help shape the provider pilot?
        </h2>
        <p className="text-muted-foreground">
          Leave your email and tell us about your practice, the biggest problems
          you have with other platforms, and what would make a first version
          worth trying.
        </p>
        <ProviderWaitlistForm source="provider-bottom-cta" />

        {isProvider ? (
          <Link
            href="/provider/onboard"
            className="block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
