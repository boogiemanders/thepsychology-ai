"use client"

import { useState, useEffect } from "react"

const SECTION_IDS = [
  "hero",
  "company",
  "bento",
  "testimonials",
  "get-started",
  "faq",
  "footer",
] as const

export type SectionId = (typeof SECTION_IDS)[number]

export function useCurrentSection(): SectionId {
  const [currentSection, setCurrentSection] = useState<SectionId>("hero")

  useEffect(() => {
    const handleScroll = () => {
      for (const sectionId of SECTION_IDS) {
        const element = document.getElementById(sectionId)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Section is considered "current" if its top is above viewport center
          // and its bottom is below viewport center
          if (rect.top <= 150 && rect.bottom >= 150) {
            setCurrentSection(sectionId)
            return
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return currentSection
}
