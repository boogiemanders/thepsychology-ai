import type { Metadata } from "next"
import ProviderLanding from "./provider-landing"

export const metadata: Metadata = {
  title: "Provider Early Access | thePsychology.ai",
  description:
    "We are building a provider platform for psychologists and therapists. Join early access for better-fit referrals, simpler tools, and less extraction from clinicians.",
  alternates: {
    canonical: "/provider",
  },
  openGraph: {
    title: "Provider Early Access | thePsychology.ai",
    description:
      "We are building a provider platform for psychologists and therapists. Join early access for better-fit referrals, simpler tools, and less extraction from clinicians.",
    url: "/provider",
  },
}

export default function ProviderPage() {
  return <ProviderLanding />
}
