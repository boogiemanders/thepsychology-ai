"use client"

import { siteConfig } from "@/lib/config"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

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
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
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

        <p className="text-center text-muted-foreground font-medium mt-6">
          <span className="block">{companyShowcase.title}</span>
          {companyShowcase.subtitle ? (
            <span className="block">{companyShowcase.subtitle}</span>
          ) : null}
        </p>
      </div>

      <div className="grid w-full max-w-7xl grid-cols-2 md:grid-cols-4 overflow-hidden border-y border-border items-center justify-center z-20">
        {companyShowcase.companyLogos.map((logo: { id: number; name: string; src: string }) => (
          <Link
            href="/portfolio"
            key={logo.id}
            className="group w-full h-28 flex items-center justify-center relative p-4
                       before:absolute before:-left-1 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border
                       after:absolute after:-top-1 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border"
          >
            <div
              className="transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]
                         translate-y-0 group-hover:-translate-y-4 flex items-center justify-center w-full h-full"
            >
              <Badge
                variant="outline"
                className="bg-transparent text-white border-white text-xs md:text-sm px-3 py-1 rounded-full"
              >
                {logo.name}
              </Badge>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
                            translate-y-8 group-hover:translate-y-4 transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]">
              <span className="flex items-center gap-2 text-sm font-medium">
                Learn More <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
