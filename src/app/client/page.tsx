import type { Metadata } from "next"
import ClientLanding from "./client-landing"

export const metadata: Metadata = {
  title: "Find a Therapist Who Actually Fits | thePsychology.ai",
  description:
    "Stop sending messages into the void. 7-dimension matching, real-time insurance verification, instant booking. Know your copay before you book. Every provider is licensed and verified.",
  alternates: {
    canonical: "/client",
  },
  openGraph: {
    title: "Find a Therapist Who Actually Fits | thePsychology.ai",
    description:
      "Stop sending messages into the void. 7-dimension matching, real-time insurance verification, instant booking. Know your copay before you book. Every provider is licensed and verified.",
    url: "/client",
  },
}

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "thePsychology.ai Client Matching",
  description:
    "Find a therapist matched to your specific needs with 7-dimension AI matching, real-time insurance verification, and instant booking. Every provider is licensed and verified.",
  provider: {
    "@type": "Organization",
    name: "thePsychology.ai",
    url: "https://thepsychology.ai",
  },
  serviceType: "Therapist Matching Service",
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
}

export default function ClientPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd),
        }}
      />
      <ClientLanding />
    </>
  )
}
