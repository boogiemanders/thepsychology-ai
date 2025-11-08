"use client"

import { BentoSection } from "@/components/sections/bento-section"
import { CompanyShowcase } from "@/components/sections/company-showcase"
import { FAQSection } from "@/components/sections/faq-section"
// import { FeatureSection } from "@/components/sections/feature-section"
import { FooterSection } from "@/components/sections/footer-section"
import { HeroSection } from "@/components/sections/hero-section"
// import { JoinSection } from "@/components/sections/join-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { QuoteSection } from "@/components/sections/quote-section"
import { SignupSection } from "@/components/sections/signup-section"
import { TestimonialSection } from "@/components/sections/testimonial-section"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
      <HeroSection />
      <CompanyShowcase />
      <BentoSection />
      <QuoteSection />
      {/* <FeatureSection /> */}
      {/* <GrowthSection /> */}
      <PricingSection />
      <SignupSection />
      {/* <JoinSection /> */}
      <TestimonialSection />
      <FAQSection />
      {/* <CTASection /> */}
      <FooterSection />
    </main>
  )
}
