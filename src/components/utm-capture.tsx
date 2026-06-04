"use client"

import { useEffect } from "react"
import { storeUTMParams, storeLandingAttribution } from "@/lib/utm-tracking"

export function UTMCapture() {
  useEffect(() => {
    // localStorage can throw (private browsing, blocked cookies); never crash the app over attribution
    try {
      storeUTMParams()
      storeLandingAttribution()
    } catch {
      // ignore
    }
  }, [])
  return null
}
