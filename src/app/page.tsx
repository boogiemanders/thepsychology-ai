import type { Metadata } from "next"
import { cookies } from "next/headers"
import HomeClient from "./home-client"
import { siteConfig } from "@/lib/config"
import { decodeOrderCookie, DEFAULT_ORDER, DEFAULT_HERO_FLAGS, HP_ORDER_COOKIE, HP_PREVIEW_VARIANTS, type SectionKey, type HeroFlags } from "@/lib/hp-utils"

export const metadata: Metadata = {
  title: "Affordable EPPP Prep That Actually Works | thePsychology.ai",
  alternates: {
    canonical: "/",
  },
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const orderCookie = cookieStore.get(HP_ORDER_COOKIE)?.value

  let sectionOrder: SectionKey[] = DEFAULT_ORDER
  let variantId: string | null = null
  let heroFlags: HeroFlags = DEFAULT_HERO_FLAGS

  // ?hp_preview=variant-name overrides cookie for dev previewing
  const previewVariant = typeof params.hp_preview === 'string' ? params.hp_preview : null
  if (previewVariant && HP_PREVIEW_VARIANTS[previewVariant]) {
    sectionOrder = HP_PREVIEW_VARIANTS[previewVariant]
    variantId = `preview:${previewVariant}`
  } else if (orderCookie) {
    const decoded = decodeOrderCookie(orderCookie)
    sectionOrder = decoded.sectionOrder
    variantId = decoded.variantId
    heroFlags = decoded.heroFlags
  }

  // ?hp_badge=0/1 and ?hp_tagline=0/1 override flags for previewing
  if (params.hp_badge !== undefined) heroFlags = { ...heroFlags, showHeroBadge: params.hp_badge !== '0' }
  if (params.hp_tagline !== undefined) heroFlags = { ...heroFlags, showHeroTagline: params.hp_tagline !== '0' }

  const baseUrl = siteConfig.url.replace(/\/$/, "")

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

  const educationalOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "thePsychology.ai",
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description: "AI-adaptive EPPP exam prep platform. 80+ lessons, realistic practice exams, and personalized study plans built by psychologists who passed.",
    founder: {
      "@type": "Person",
      name: "Anders Chan, PsyD",
      jobTitle: "Founder",
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "LIU Post" },
        { "@type": "CollegeOrUniversity", name: "UCLA David Geffen School of Medicine" },
      ],
    },
    email: "DrChan@thepsychology.ai",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    sameAs: [
      "https://x.com/thepsychologyai",
      "https://www.tiktok.com/@thepsychology.ai",
      "https://instagram.com/thepsychologyai",
    ],
  }

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "EPPP Exam Prep",
    description: "AI-adaptive study program for the Examination for Professional Practice in Psychology (EPPP). Covers all 8 content domains with 80+ lessons, practice exams, and personalized study plans.",
    provider: {
      "@type": "EducationalOrganization",
      name: "thePsychology.ai",
      url: baseUrl,
    },
    offers: {
      "@type": "Offer",
      price: "30.00",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "7-day free trial, then $30/month. No credit card required to start.",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT15M per session",
    },
    educationalLevel: "Postdoctoral",
    about: {
      "@type": "Thing",
      name: "EPPP - Examination for Professional Practice in Psychology",
    },
  }

  const servicesJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Practice Exam",
      description: "16 full-length EPPP practice exams and unlimited quizzes that simulate the real test format, difficulty, and question style. Includes highlight, flag, and timer features.",
      provider: { "@type": "EducationalOrganization", name: "thePsychology.ai" },
      serviceType: "EPPP Practice Testing",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Prioritize",
      description: "AI-driven diagnostic that identifies your weakest EPPP content domains and builds a personalized study plan focused on closing knowledge gaps.",
      provider: { "@type": "EducationalOrganization", name: "thePsychology.ai" },
      serviceType: "Adaptive Study Planning",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Study",
      description: "80+ focused lessons covering all 8 EPPP domains. Uses simple language and custom metaphors based on your interests to make complex material stick.",
      provider: { "@type": "EducationalOrganization", name: "thePsychology.ai" },
      serviceType: "EPPP Study Materials",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Recover",
      description: "Evidence-based mental reset tools for test anxiety and study burnout. 5-minute guided exercises designed specifically for EPPP candidates.",
      provider: { "@type": "EducationalOrganization", name: "thePsychology.ai" },
      serviceType: "Test Anxiety Support",
    },
  ]

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Anders Chan",
    honorificSuffix: "PsyD",
    jobTitle: "Founder",
    url: `${baseUrl}/about/dr-anders-chan`,
    worksFor: {
      "@type": "EducationalOrganization",
      name: "thePsychology.ai",
      url: baseUrl,
    },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "LIU Post (Long Island University)" },
      { "@type": "CollegeOrUniversity", name: "UCLA David Geffen School of Medicine" },
    ],
    knowsAbout: ["EPPP", "Psychology Licensure", "Clinical Psychology", "Neuropsychology"],
    description: "Licensed psychologist and founder of thePsychology.ai. Passed the EPPP on his first attempt with a score of 588 after 1 month of preparation. PsyD from LIU Post, postdoctoral training at UCLA David Geffen School of Medicine.",
  }

  const reviewsJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "thePsychology.ai EPPP Prep",
    description: "AI-adaptive EPPP exam prep platform",
    brand: { "@type": "Brand", name: "thePsychology.ai" },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Dr. Menon" },
        reviewBody: "thePsychology.ai is truly one-of-a-kind. It's an innovative, effective, and affordable tool for EPPP preparation. The platform makes dense material feel engaging and manageable.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Lorin Singh, PsyD" },
        reviewBody: "It was pretty helpful and had information that I didn't see in Psych Prep. I did like that I was able to ask questions directly underneath the chapter for explanations.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Anonymous User" },
        reviewBody: "Out of all the programs I looked at, this one comes the closest to how the EPPP actually words its questions. My test didn't have any straight definition questions, it was all application based, and this program is set up the same way.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Anonymous User" },
        reviewBody: "Information like PrepJet, but much easier to digest and at a fraction of the cost. Overall good program and would recommend to peers.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
    ],
  }

  const homepageSchemas = [faqJsonLd, educationalOrgJsonLd, courseJsonLd, personJsonLd, reviewsJsonLd, ...servicesJsonLd]

  return (
    <>
      {homepageSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
      <HomeClient sectionOrder={sectionOrder} variantId={variantId} heroFlags={heroFlags} />
    </>
  )
}
