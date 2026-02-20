"use client"

import { siteConfig } from "@/lib/config"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import Image from "next/image"
import Link from "next/link"

function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.08 2.58 1.67 4.12 1.79v4.03c-1.44-.05-2.87-.35-4.19-.89-.57-.23-1.1-.54-1.62-.87-.01 2.92.02 5.84-.02 8.76-.08 1.4-.54 2.78-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.23-1.43.08-2.87-.31-4.08-1.07-2-1.22-3.34-3.39-3.57-5.72-.02-.5-.03-1 .01-1.5.19-1.99 1.17-3.89 2.78-5.09 1.84-1.38 4.3-1.8 6.47-1.21.02 1.48-.04 2.96-.04 4.44-.99-.31-2.15-.23-3.02.37-.63.41-1.11 1.04-1.31 1.77-.17.66-.16 1.39.12 2.02.48 1.14 1.73 1.93 2.97 1.9.82.02 1.62-.31 2.19-.9.72-.73.88-1.79.89-2.77.01-4.82-.02-9.64.03-14.46z" />
    </svg>
  )
}

function XIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.901 1.153h3.68l-8.04 9.19 9.46 12.504h-7.406l-5.804-7.584-6.64 7.584H.47l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.04L6.486 3.24H4.298z" />
    </svg>
  )
}

export function FooterSection() {
  return (
    <footer id="footer" className="w-full pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={25}
              height={32}
              className="h-8 w-auto invert dark:invert-0"
            />
            <p className="text-xl font-semibold text-primary">thePsychology.ai</p>
          </Link>
          <p className="tracking-tight text-muted-foreground font-medium">{siteConfig.hero.description}</p>
          <div className="flex items-center gap-4">
            <Link
              href={siteConfig.links.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow us on TikTok"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <TikTokIcon />
            </Link>
            <Link
              href={siteConfig.links.x}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow us on X"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <XIcon />
            </Link>
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
