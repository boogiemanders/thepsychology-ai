import type { Metadata } from "next"
import HomeClient from "./home-client"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
}

export default function Home() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteConfig.faqSection.faQitems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      <HomeClient />
    </>
  )
}
