"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { storeUTMParams, storeLandingAttribution, storeBlogAttribution } from "@/lib/utm-tracking"

export function UTMCapture() {
  const pathname = usePathname()
  useEffect(() => {
    // Re-run on each navigation so a homepage->blog click still captures the blog
    // slug. All three are first-touch-guarded, so re-runs are harmless no-ops.
    // localStorage can throw (private browsing, blocked cookies); never crash the app over attribution
    try {
      storeUTMParams()
      storeLandingAttribution()
      storeBlogAttribution()
    } catch {
      // ignore
    }
  }, [pathname])
  return null
}
