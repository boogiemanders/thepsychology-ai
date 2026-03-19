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
      <HomeClient sectionOrder={sectionOrder} variantId={variantId} heroFlags={heroFlags} />
    </>
  )
}
