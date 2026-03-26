import type { Metadata } from "next"
import ProviderLanding from "./provider-landing"

export const metadata: Metadata = {
  title: "Provider Early Access | thePsychology.ai",
  description:
    "We are building a provider platform for psychologists and therapists. Join early access to help shape the pilot around cleaner referrals, simpler operations, and less extraction.",
  alternates: {
    canonical: "/provider",
  },
  openGraph: {
    title: "Provider Early Access | thePsychology.ai",
    description:
      "We are building a provider platform for psychologists and therapists. Join early access to help shape the pilot around cleaner referrals, simpler operations, and less extraction.",
    url: "/provider",
  },
}

export default function ProviderPage() {
  return <ProviderLanding />
}
