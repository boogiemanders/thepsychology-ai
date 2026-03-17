"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type GoogleAnalyticsProps = {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window.gtag !== "function") {
      return
    }

    const search = window.location.search
    const pagePath = search ? `${pathname}?${search}` : pathname

    window.gtag("config", measurementId, {
      page_path: pagePath,
    })
  }, [measurementId, pathname])

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  )
}
