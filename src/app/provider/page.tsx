import type { Metadata } from "next"
import ProviderLanding from "./provider-landing"

export const metadata: Metadata = {
  title: "List Your Practice — No Rate Cuts, No Clawbacks | thePsychology.ai",
  description:
    "Join the therapist marketplace that doesn't cut your rates. AI-powered client matching, real-time insurance verification, HIPAA telehealth. Free for up to 5 clients.",
  alternates: {
    canonical: "/provider",
  },
  openGraph: {
    title: "List Your Practice — No Rate Cuts, No Clawbacks | thePsychology.ai",
    description:
      "Join the therapist marketplace that doesn't cut your rates. AI-powered client matching, real-time insurance verification, HIPAA telehealth. Free for up to 5 clients.",
    url: "/provider",
  },
}

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "thePsychology.ai Provider Platform",
  description:
    "Therapist marketplace with AI-powered client matching, real-time insurance verification, and HIPAA-compliant telehealth. Free tier available.",
  provider: {
    "@type": "Organization",
    name: "thePsychology.ai",
    url: "https://thepsychology.ai",
  },
  serviceType: "Therapist Practice Management",
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
}

export default function ProviderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd),
        }}
      />
      <ProviderLanding />
    </>
  )
}
