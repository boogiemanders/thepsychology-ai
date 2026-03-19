import { getSupabaseClient } from '@/lib/supabase-server'

// --- Types ---

export type SectionKey = 'problem' | 'orbiting' | 'bento' | 'vision' | 'testimonials' | 'pricing' | 'faq' | 'company'

export interface HeroFlags {
  showHeroBadge: boolean
  showHeroTagline: boolean
}

export const DEFAULT_HERO_FLAGS: HeroFlags = {
  showHeroBadge: true,
  showHeroTagline: true,
}

export interface VariantOrder {
  variantId: string | null
  sectionOrder: SectionKey[]
  variantName: string | null
  heroFlags: HeroFlags
}

export interface VisitorSignals {
  referrer: string | null
  country: string | null
  deviceType: 'mobile' | 'desktop' | 'tablet' | null
  userAgent: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
}

// --- Constants ---

export const SECTION_KEYS: SectionKey[] = [
  'problem',
  'orbiting',
  'bento',
  'vision',
  'testimonials',
  'pricing',
  'faq',
  'company',
]

export const DEFAULT_ORDER: SectionKey[] = [
  'problem',
  'orbiting',
  'bento',
  'vision',
  'testimonials',
  'pricing',
  'faq',
  'company',
]

// Cookie names
export const HP_VISITOR_COOKIE = '_tp_vid'
export const HP_ORDER_COOKIE = '_tp_order'

// Emails excluded from all HP tracking/reporting (owner, admins)
export const HP_EXCLUDED_EMAILS = [
  'chanders0@yahoo.com',
]

// Preview variants — used by ?hp_preview= query param to bypass cookie/DB
export const HP_PREVIEW_VARIANTS: Record<string, SectionKey[]> = {
  'control':              ['problem', 'orbiting', 'bento', 'vision', 'testimonials', 'pricing', 'faq', 'company'],
  'pricing-early':        ['problem', 'testimonials', 'pricing', 'orbiting', 'bento', 'vision', 'faq', 'company'],
  'social-first':         ['problem', 'testimonials', 'company', 'bento', 'orbiting', 'vision', 'pricing', 'faq'],
  'faq-objection-buster': ['problem', 'testimonials', 'faq', 'bento', 'orbiting', 'vision', 'pricing', 'company'],
  'product-first':        ['problem', 'bento', 'orbiting', 'vision', 'testimonials', 'pricing', 'faq', 'company'],
  'late-pricing':         ['problem', 'orbiting', 'bento', 'vision', 'testimonials', 'company', 'faq', 'pricing'],
  'trust-sandwich':       ['problem', 'company', 'orbiting', 'bento', 'vision', 'testimonials', 'pricing', 'faq'],
}

// --- Functions ---

/**
 * Calls the hp_assign_variant RPC from middleware.
 * Returns the variant assignment (or default order if no active experiment).
 */
export async function assignVariant(
  cookieId: string,
  signals: VisitorSignals
): Promise<VariantOrder> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })

  if (!supabase) {
    return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
  }

  try {
    const { data, error } = await supabase.rpc('hp_assign_variant', {
      p_cookie_id: cookieId,
      p_referrer: signals.referrer,
      p_country: signals.country,
      p_device_type: signals.deviceType,
      p_user_agent: signals.userAgent,
      p_utm_source: signals.utmSource,
      p_utm_medium: signals.utmMedium,
      p_utm_campaign: signals.utmCampaign,
      p_utm_content: signals.utmContent,
      p_utm_term: signals.utmTerm,
    })

    if (error || !data) {
      console.warn('[HP] assignVariant RPC error:', error?.message)
      return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data

    if (!result.variant_id || !result.section_order) {
      return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
    }

    // Validate section_order contains only valid keys
    const order = (result.section_order as string[]).filter(
      (k): k is SectionKey => SECTION_KEYS.includes(k as SectionKey)
    )

    if (order.length !== SECTION_KEYS.length) {
      console.warn('[HP] Invalid section_order from DB, using default')
      return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
    }

    // Parse hero flags from RPC result
    const rawFlags = result.flags ?? {}
    const heroFlags: HeroFlags = {
      showHeroBadge: rawFlags.showHeroBadge !== false,
      showHeroTagline: rawFlags.showHeroTagline !== false,
    }

    return {
      variantId: result.variant_id,
      sectionOrder: order,
      variantName: result.variant_name,
      heroFlags,
    }
  } catch (err) {
    console.warn('[HP] assignVariant failed:', err)
    return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
  }
}

/**
 * Encode variant assignment into a cookie value.
 * Format: "variantId:key1,key2,key3,...|flagBits"
 * flagBits: 2-char string, "1"/"0" for showHeroBadge, showHeroTagline
 */
export function encodeOrderCookie(variant: VariantOrder): string {
  const id = variant.variantId ?? 'default'
  const flags = variant.heroFlags ?? DEFAULT_HERO_FLAGS
  const flagBits = (flags.showHeroBadge ? '1' : '0') + (flags.showHeroTagline ? '1' : '0')
  return `${id}:${variant.sectionOrder.join(',')}|${flagBits}`
}

/**
 * Decode the _tp_order cookie value.
 * Supports both old format "id:keys" and new format "id:keys|flagBits"
 */
export function decodeOrderCookie(value: string): VariantOrder {
  const colonIdx = value.indexOf(':')
  const variantId = colonIdx === -1 ? value : value.slice(0, colonIdx)
  const rest = colonIdx === -1 ? '' : value.slice(colonIdx + 1)
  if (!rest) {
    return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
  }

  // Split on "|" to separate section order from flag bits
  const pipeIdx = rest.indexOf('|')
  const orderStr = pipeIdx === -1 ? rest : rest.slice(0, pipeIdx)
  const flagStr = pipeIdx === -1 ? '' : rest.slice(pipeIdx + 1)

  const order = orderStr.split(',').filter(
    (k): k is SectionKey => SECTION_KEYS.includes(k as SectionKey)
  )

  if (order.length !== SECTION_KEYS.length) {
    return { variantId: null, sectionOrder: DEFAULT_ORDER, variantName: null, heroFlags: DEFAULT_HERO_FLAGS }
  }

  // Parse flag bits (default to both shown for old cookies without flags)
  const heroFlags: HeroFlags = flagStr.length >= 2
    ? { showHeroBadge: flagStr[0] === '1', showHeroTagline: flagStr[1] === '1' }
    : DEFAULT_HERO_FLAGS

  return {
    variantId: variantId === 'default' ? null : variantId,
    sectionOrder: order,
    variantName: null,
    heroFlags,
  }
}
