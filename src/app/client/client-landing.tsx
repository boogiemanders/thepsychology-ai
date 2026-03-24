"use client"

import { FooterSection } from "@/components/sections/footer-section"
import { ClientHeroSection } from "./sections/client-hero-section"
import { ClientProblemSection } from "./sections/client-problem-section"
import { ClientMatchingSection } from "./sections/client-matching-section"
import { ClientInsuranceSection } from "./sections/client-insurance-section"
import { ClientHowItWorksSection } from "./sections/client-how-it-works-section"
import { ClientTrustSection } from "./sections/client-trust-section"
import { ClientCTASection } from "./sections/client-cta-section"

export default function ClientLanding() {
  return (
    <div className="flex flex-col w-full">
      <ClientHeroSection />
      <ClientProblemSection />
      <ClientMatchingSection />
      <ClientInsuranceSection />
      <ClientHowItWorksSection />
      <ClientTrustSection />
      <ClientCTASection />
      <FooterSection description="Find a therapist matched to your specific needs. 7-dimension matching, real-time insurance verification, and instant booking." />
    </div>
  )
}
