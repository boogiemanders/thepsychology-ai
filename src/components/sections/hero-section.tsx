"use client"

import { siteConfig } from "@/lib/config"

export function HeroSection() {
  const { hero } = siteConfig

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="relative z-10 pt-32 pb-20 max-w-3xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center">
          {hero.badge?.trim() ? (
            <p className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2">
              {hero.badgeIcon}
              {hero.badge}
            </p>
          ) : null}
          <div className="flex flex-col items-center justify-center gap-5">
            {hero.title ? (
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-primary relative -translate-y-[20px] md:translate-y-0">
                {hero.title}
              </h1>
            ) : null}
            {hero.description ? (
              <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight md:mt-4 lg:mt-0 -translate-y-[46.632px] md:translate-y-0">
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
