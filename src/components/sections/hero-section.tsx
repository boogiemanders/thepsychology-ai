"use client"

import { siteConfig } from "@/lib/config"
import { UserCountTicker } from "@/components/user-count-ticker"
import Link from "next/link"

type HeroSectionProps = {
  isMobileLayout?: boolean
  titleYOffset?: number
  ctaYOffset?: number
  bannerYOffset?: number
  contentFrameHeight?: number
}

export function HeroSection({
  isMobileLayout = false,
  titleYOffset = 0,
  ctaYOffset = 0,
  bannerYOffset = 0,
  contentFrameHeight,
}: HeroSectionProps) {
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

  const clampedContentFrameHeight =
    typeof contentFrameHeight === "number" && Number.isFinite(contentFrameHeight)
      ? Math.max(0, contentFrameHeight)
      : null
  const contentFrameStyle = clampedContentFrameHeight !== null
    ? { height: `${clampedContentFrameHeight}px`, maxHeight: "100%", minHeight: "0" }
    : { height: "100%", minHeight: "0" }

  return (
    <section id="hero" className="w-full relative h-full flex flex-col items-center px-6">
      <div className="w-full max-h-full flex flex-col items-center" style={contentFrameStyle}>
        {/* Nav clearance */}
        <div className="shrink-0" style={{ height: "12%" }} />

        {/* Title block */}
        <div
          className="shrink-0 flex flex-col items-center gap-2 max-w-3xl w-full"
          style={titleYOffset ? { transform: `translateY(${titleYOffset}px)` } : undefined}
        >
          {hero.badge?.trim() ? (
            <p className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2">
              {hero.badgeIcon}
              {hero.badge}
            </p>
          ) : null}
          {hero.title ? (
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-white">
              {hero.title}
            </h1>
          ) : null}
          {hero.description?.trim() ? (
            <p className="sr-only">
              {hero.description}
            </p>
          ) : null}
        </div>

        {/* Flexible spacer — gap where video text shows through */}
        <div
          className="flex-1"
          style={{ minHeight: isMobileLayout ? "2%" : "18%" }}
        />

        {/* CTA Buttons */}
        <div
          className="shrink-0 flex items-center gap-2.5 flex-wrap justify-center"
          style={ctaYOffset ? { transform: `translateY(${ctaYOffset}px)` } : undefined}
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

        {/* Ticker */}
        <div
          className="shrink-0"
          style={{
            marginTop: "2%",
            marginBottom: "4%",
            ...(bannerYOffset ? { transform: `translateY(${bannerYOffset}px)` } : {}),
          }}
        >
          <UserCountTicker className="text-white text-base md:text-lg font-medium" />
        </div>
      </div>
    </section>
  )
}
