"use client"

import { useEffect } from "react"
import { storeUTMParams } from "@/lib/utm-tracking"

export function UTMCapture() {
  useEffect(() => {
    storeUTMParams()
  }, [])
  return null
}
