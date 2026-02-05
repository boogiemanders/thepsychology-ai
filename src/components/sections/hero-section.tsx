"use client"

import { siteConfig } from "@/lib/config"
import { UserCountTicker } from "@/components/user-count-ticker"

export function HeroSection() {
  const { hero } = siteConfig

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="relative z-10 pt-24 pb-20 max-w-3xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center">
          {hero.badge?.trim() ? (
            <p className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2">
              {hero.badgeIcon}
              {hero.badge}
            </p>
          ) : null}
          <div className="flex flex-col items-center justify-center gap-2">
            <UserCountTicker className="text-white text-base md:text-lg font-medium" />
            {hero.title ? (
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-white">
                {hero.title}
              </h1>
            ) : null}
            {hero.description ? (
              <p className="text-base md:text-lg text-center text-white font-medium text-balance leading-relaxed tracking-tight">
                {hero.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {/* <HeroVideoSection /> */}
    </section>
  )
}
