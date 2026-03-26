"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export function ProviderCTASection() {
  const { user, isProvider } = useAuth()
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
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
    <section className="flex flex-col items-center justify-center w-full py-16 md:py-24 px-6">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance">
          Want to help shape the provider pilot?
        </h2>
        <p className="text-muted-foreground">
          Tell us about your practice, the biggest problems you have with other
          platforms, and what would make a first version worth trying.
        </p>
        {isProvider ? (
          <Link href="/provider/onboard">
            <InteractiveHoverButton
              text="Continue Onboarding"
              hoverText="Go to profile"
              inverted
            />
          </Link>
        ) : (
          <div onClick={handleJoin} className={joining ? "pointer-events-none opacity-60" : "cursor-pointer"}>
            <InteractiveHoverButton
              text={joining ? "Joining..." : "Join Early Access"}
              hoverText={user ? "Start onboarding" : "Sign in first"}
              inverted
            />
          </div>
        )}
      </div>
    </section>
  )
}
