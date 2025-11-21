"use client"

import { useEffect, useRef, useState } from "react"
import { siteConfig } from "@/lib/config"
import { CompanyShowcase } from "@/components/sections/company-showcase"
import { FAQSection } from "@/components/sections/faq-section"
// import { FeatureSection } from "@/components/sections/feature-section"
import { FooterSection } from "@/components/sections/footer-section"
import { HeroSection } from "@/components/sections/hero-section"
import { OrbitingLoopSection } from "@/components/sections/orbiting-loop-section"
import { BentoSection } from "@/components/sections/bento-section"
import { PricingSection } from "@/components/sections/pricing-section"
// import { SignupSection } from "@/components/sections/signup-section"
import { TestimonialSection } from "@/components/sections/testimonial-section"
import { MiniPricingBar } from "@/components/mini-pricing-bar"

export default function Home() {
  const [showMiniBar, setShowMiniBar] = useState(false)
  const [activeTier, setActiveTier] = useState(() => siteConfig.pricing.pricingItems[0]?.name ?? "")
  const pricingRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const hero = document.getElementById("hero")
    const pricing = document.getElementById("get-started")
    if (pricing) {
      pricingRef.current = pricing as HTMLElement
    }

    if (!hero || !pricing) return

    const handleScroll = () => {
      const heroRect = hero.getBoundingClientRect()
      const pricingRect = pricing.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight

      const pastHero = heroRect.bottom <= 0
      const pricingVisible =
        pricingRect.top <= viewportHeight * 0.65 && pricingRect.bottom >= viewportHeight * 0.35

      setShowMiniBar(pastHero && !pricingVisible)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  const handleMiniTierClick = (tierName: string) => {
    setActiveTier(tierName)
    const pricing = pricingRef.current ?? document.getElementById("get-started")
    if (!pricing) return

    pricing.scrollIntoView({ behavior: "smooth", block: "center" })
    window.setTimeout(() => {
      pricing.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 220)

    if (!("CustomEvent" in window)) return
    const event = new CustomEvent("mini-pricing-select", { detail: { tierName } })
    window.dispatchEvent(event)
  }

  return (
    <>
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <HeroSection />
        <CompanyShowcase />
        <OrbitingLoopSection />
        <BentoSection />
        <TestimonialSection />
        {/* <FeatureSection /> */}
        {/* <GrowthSection /> */}
        <PricingSection activeTier={activeTier} onActiveTierChange={setActiveTier} />
        {/* <SignupSection /> */}
        <FAQSection />
        {/* <CTASection /> */}
        <FooterSection />
      </main>
      <MiniPricingBar show={showMiniBar} activeTier={activeTier} onTierClick={handleMiniTierClick} />
    </>
  )
}
