"use client"

import { siteConfig } from "@/lib/config"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Marquee } from "@/components/ui/marquee"
import { TextRotate } from "@/components/ui/text-rotate"

const ROLES = ["psychologists", "researchers", "engineers"]

type CompanyLogo = {
  id: number
  name: string
  src: string | null
  member?: string
  invert?: boolean
  width?: number
}

function CompanyCard({ logo, compact = false }: { logo: CompanyLogo; compact?: boolean }) {
  if (compact) {
    // Simpler card for mobile marquee
    return (
      <Link
        href={logo.member ? `/portfolio?member=${logo.member}` : "/portfolio"}
        className="flex items-center justify-center px-4 py-2 shrink-0"
      >
        <span className="text-xs font-medium tracking-wide text-primary/70 whitespace-nowrap">
          {logo.name}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={logo.member ? `/portfolio?member=${logo.member}` : "/portfolio"}
      className="group w-full h-24 flex items-center justify-center relative p-4 shrink-0"
    >
      <div
        className="transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]
                   translate-y-0 group-hover:-translate-y-4 flex items-center justify-center w-full h-full"
      >
        {logo.src ? (
          <Image
            src={logo.src}
            alt={logo.name}
            width={logo.width || 120}
            height={logo.width ? Math.round(logo.width / 3) : 40}
            className={`object-contain opacity-80 group-hover:opacity-100 transition-opacity ${logo.invert ? "brightness-0 invert" : ""}`}
          />
        ) : (
          <span className="text-xs md:text-sm font-medium tracking-wide text-primary/80 whitespace-nowrap">
            {logo.name}
          </span>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
                      translate-y-8 group-hover:translate-y-4 transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]">
        <span className="flex items-center gap-2 text-sm font-medium">
          Learn More <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}

export function CompanyShowcase() {
  const { companyShowcase, hero } = siteConfig

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
    <section id="company" className="flex flex-col items-center justify-center gap-10 py-10 pt-20 w-full relative px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5 flex-wrap justify-center -mt-6">
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

        <p className="text-center text-white text-base md:text-lg font-medium mt-6">
          Built by <TextRotate words={ROLES} className="font-bold" /> from (not affiliated with):
        </p>
      </div>

      {/* Mobile: Marquee */}
      <div className="block md:hidden relative w-full overflow-hidden z-20">
        <Marquee pauseOnHover className="[--duration:20s] [--gap:2rem]">
          {companyShowcase.companyLogos.map((logo: CompanyLogo) => (
            <CompanyCard key={logo.id} logo={logo} compact />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid w-full max-w-7xl grid-cols-4 items-center justify-center z-20">
        {companyShowcase.companyLogos.map((logo: CompanyLogo) => (
          <CompanyCard key={logo.id} logo={logo} />
        ))}
      </div>
    </section>
  )
}
