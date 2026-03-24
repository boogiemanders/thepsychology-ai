"use client"

import { FooterSection } from "@/components/sections/footer-section"
import { ProviderHeroSection } from "./sections/provider-hero-section"
import { ProviderProblemSection } from "./sections/provider-problem-section"
import { ProviderPipelineSection } from "./sections/provider-pipeline-section"
import { ProviderFeaturesSection } from "./sections/provider-features-section"
import { ProviderPricingSection } from "./sections/provider-pricing-section"
import { ProviderPracticeSection } from "./sections/provider-practice-section"
import { ProviderTrustSection } from "./sections/provider-trust-section"
import { ProviderCTASection } from "./sections/provider-cta-section"

export default function ProviderLanding() {
  return (
    <div className="flex flex-col w-full">
      <ProviderHeroSection />
      <ProviderProblemSection />
      <ProviderPipelineSection />
      <ProviderFeaturesSection />
      <ProviderPricingSection />
      <ProviderPracticeSection />
      <ProviderTrustSection />
      <ProviderCTASection />
      <FooterSection description="The therapist marketplace that doesn't cut your rates. AI-powered client matching, real-time insurance verification, and HIPAA telehealth." />
    </div>
  )
}
