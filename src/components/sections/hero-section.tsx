"use client"

import { siteConfig } from "@/lib/config"
import { UserCountTicker } from "@/components/user-count-ticker"
import Link from "next/link"

type HeroSectionProps = {
  offsets: {
    tickerX: number
    tickerY: number
    titleX: number
    titleY: number
    ctaX: number
    ctaY: number
  }
  globalLiftY?: number
}

export function HeroSection({ offsets, globalLiftY = 0 }: HeroSectionProps) {
  const { hero } = siteConfig

  const handleStartFree = () => {
    const pricing = document.getElementById("get-started")
    if (!pricing) return

    pricing.scrollIntoView({ behavior: "smooth", block: "center" })
    setTimeout(() => {
      pricing.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 220)

    const event = new CustomEvent("mini-pricing-select", { detail: { tierName: "Pro" } })
    window.dispatchEvent(event)
  }

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full px-6">
        <div
          className="relative z-10 pt-24 pb-14 max-w-3xl mx-auto h-full w-full flex flex-col gap-7 items-center justify-center"
          style={{ transform: `translateY(${globalLiftY}px)` }}
        >
          {hero.badge?.trim() ? (
            <p className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2">
              {hero.badgeIcon}
              {hero.badge}
            </p>
          ) : null}
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              style={{
                transform: `translate(${offsets.tickerX}px, ${offsets.tickerY}px)`,
              }}
            >
              <UserCountTicker className="text-white text-base md:text-lg font-medium" />
            </div>
            {hero.title ? (
              <h1
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-white"
                style={{
                  transform: `translate(${offsets.titleX}px, ${offsets.titleY}px)`,
                }}
              >
                {hero.title}
              </h1>
            ) : null}
            {hero.description?.trim() ? (
              <p className="text-base md:text-lg text-center text-white font-medium text-balance leading-relaxed tracking-tight">
                {hero.description}
              </p>
            ) : null}
          </div>
          <div
            className="flex items-center gap-2.5 flex-wrap justify-center"
            style={{
              transform: `translate(${offsets.ctaX}px, ${offsets.ctaY}px)`,
            }}
          >
            <button
              onClick={handleStartFree}
              className="brand-soft-blue-bg h-9 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-white w-32 px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-[#4e7ba4] hover:brightness-95 transition-all ease-out active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-soft-blue/70"
            >
              {hero.cta.primary.text}
            </button>
            <Link
              href={hero.cta.secondary.href}
              className="h-10 flex items-center justify-center w-32 px-5 text-sm font-normal tracking-wide text-primary rounded-full transition-all ease-out active:scale-95 bg-white dark:bg-background border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white/80 dark:hover:bg-background/80"
            >
              {hero.cta.secondary.text}
            </Link>
          </div>
        </div>
      </div>
      {/* <HeroVideoSection /> */}
    </section>
  )
}
