"use client"

import { Icons } from "@/components/icons"
import { useMediaQuery } from "@/hooks/use-media-query"
import { siteConfig } from "@/lib/config"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import Link from "next/link"
export function FooterSection() {
  const tablet = useMediaQuery("(max-width: 1024px)")

  return (
    <footer id="footer" className="w-full pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="size-8" />
            <p className="text-xl font-semibold text-primary">thePsychology.ai</p>
          </Link>
          <p className="tracking-tight text-muted-foreground font-medium">{siteConfig.hero.description}</p>
          <div className="flex items-center gap-2 dark:hidden">
            <Icons.soc2 className="size-12" />
            <Icons.hipaa className="size-12" />
            <Icons.gdpr className="size-12" />
          </div>
          <div className="dark:flex items-center gap-2 hidden">
            <Icons.soc2Dark className="size-12" />
            <Icons.hipaaDark className="size-12" />
            <Icons.gdprDark className="size-12" />
          </div>
        </div>
        <div className="pt-5 md:w-1/2">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-center md:justify-between gap-y-5 lg:pl-10">
            {siteConfig.footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-sm font-semibold text-primary">{column.title}</li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-[15px]/snug text-muted-foreground"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-4 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-4 w-4 " />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
