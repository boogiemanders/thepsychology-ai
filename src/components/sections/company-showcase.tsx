"use client"

import { siteConfig } from "@/lib/config"
import Image from "next/image"
import Link from "next/link"
import { Marquee } from "@/components/ui/marquee"
import { TextRotate } from "@/components/ui/text-rotate"

const ROLES = ["psychologists", "researchers", "neuroscientists"]

type CompanyLogo = {
  id: number
  name: string
  src: string | null
  member?: string
  invert?: boolean
  invertLight?: boolean
  width?: number
}

function LogoItem({ logo }: { logo: CompanyLogo }) {
  return (
    <div className="relative flex items-center justify-center shrink-0 px-6">
      <Link href={logo.member ? `/portfolio?member=${logo.member}` : "/portfolio"}>
        {logo.src ? (
          <Image
            src={logo.src}
            alt={logo.name}
            width={logo.width || 120}
            height={logo.width ? Math.round(logo.width / 3) : 40}
            className={`object-contain opacity-70 hover:opacity-100 transition-opacity ${logo.invert ? "dark:brightness-0 dark:invert" : ""} ${logo.invertLight ? "invert dark:invert-0" : ""}`}
          />
        ) : (
          <span className="text-xs font-medium tracking-wide text-primary/70 whitespace-nowrap">
            {logo.name}
          </span>
        )}
      </Link>
    </div>
  )
}

export function CompanyShowcase() {
  const { companyShowcase } = siteConfig

  return (
    <section id="company" className="flex flex-col items-center justify-center gap-6 py-8 w-full relative px-6">
      <p className="text-center text-foreground text-base md:text-lg font-medium">
        Built by <TextRotate words={ROLES} className="font-bold" /> from:
      </p>

      <div className="relative w-full max-w-5xl overflow-hidden marquee-edge-fade">
        <Marquee
          className="[--duration:40s] [--gap:3rem] py-6"
          pauseOnHover={true}
          repeat={3}
        >
          {companyShowcase.companyLogos.map((logo: CompanyLogo) => (
            <LogoItem key={logo.id} logo={logo} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}
