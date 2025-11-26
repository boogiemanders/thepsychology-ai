import { siteConfig } from "@/lib/config"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CompanyShowcase() {
  const { companyShowcase } = siteConfig
  return (
    <section id="company" className="flex flex-col items-center justify-center gap-10 py-10 pt-20 w-full relative px-6">
      <p className="text-center text-muted-foreground font-medium md:text-left">{companyShowcase.title}</p>

      <div className="grid w-full max-w-7xl grid-cols-2 md:grid-cols-4 overflow-hidden border-y border-border items-center justify-center z-20">
        {companyShowcase.companyLogos.map((logo: { id: number; name: string; src: string }) => (
          <Link
            href="/portfolio"
            key={logo.id}
            className="group w-full h-28 flex items-center justify-center relative p-4
                       before:absolute before:-left-1 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border
                       after:absolute after:-top-1 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border"
          >
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]
                            translate-y-0 group-hover:-translate-y-4 flex items-center justify-center w-full h-full ${
                              logo.id === 6 ? '-translate-y-3' : ''
                            }`}>
              <img
                src={logo.src}
                alt={logo.name}
                className={`w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity brightness-0 invert ${
                  logo.id === 2 ? 'h-11 md:h-12' :
                  logo.id === 5 ? 'h-11 md:h-13' :
                  [4, 6].includes(logo.id) ? 'h-14 md:h-16' :
                  'h-10 md:h-12'
                }`}
              />
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
