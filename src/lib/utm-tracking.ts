/**
 * UTM Parameter Tracking
 * Captures and stores UTM parameters from URL for marketing attribution
 */

export interface UTMParams {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

const UTM_STORAGE_KEY = 'thepsychology_utm_params'
const UTM_EXPIRY_KEY = 'thepsychology_utm_expiry'
const UTM_EXPIRY_DAYS = 30 // Keep UTM params for 30 days

/**
 * Extract UTM parameters from current URL
 */
export function extractUTMFromURL(): UTMParams {
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }
  }

  const params = new URLSearchParams(window.location.search)

  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
  }
}

/**
 * Check if any UTM parameters exist in the current URL
 */
export function hasUTMParams(): boolean {
  const params = extractUTMFromURL()
  return Object.values(params).some(v => v !== null)
}

/**
 * Store UTM parameters in localStorage (first-touch attribution)
 * Only stores if no existing UTM params or if they've expired
 */
export function storeUTMParams(): void {
  if (typeof window === 'undefined') return

  const currentParams = extractUTMFromURL()

  // Only store if we have UTM params in the URL
  if (!hasUTMParams()) return

  // Check if we already have stored params that haven't expired
  const existingExpiry = localStorage.getItem(UTM_EXPIRY_KEY)
  if (existingExpiry && new Date(existingExpiry) > new Date()) {
    // Existing params are still valid, keep first-touch attribution
    return
  }

  // Store new UTM params
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(currentParams))

  // Set expiry date
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + UTM_EXPIRY_DAYS)
  localStorage.setItem(UTM_EXPIRY_KEY, expiryDate.toISOString())
}

/**
 * Get stored UTM parameters
 */
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }
  }

  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY)
    if (!stored) return extractUTMFromURL() // Fall back to current URL params

    const expiry = localStorage.getItem(UTM_EXPIRY_KEY)
    if (expiry && new Date(expiry) < new Date()) {
      // Params have expired, clear and return current URL params
      localStorage.removeItem(UTM_STORAGE_KEY)
      localStorage.removeItem(UTM_EXPIRY_KEY)
      return extractUTMFromURL()
    }

    return JSON.parse(stored)
  } catch {
    return extractUTMFromURL()
  }
}

/**
 * Clear stored UTM parameters (call after successful signup)
 */
export function clearStoredUTMParams(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(UTM_STORAGE_KEY)
  localStorage.removeItem(UTM_EXPIRY_KEY)
}

/**
 * Format UTM params for API submission
 * Returns null values as null (not undefined) for proper DB storage
 */
export function formatUTMForAPI(params: UTMParams): UTMParams {
  return {
    utm_source: params.utm_source || null,
    utm_medium: params.utm_medium || null,
    utm_campaign: params.utm_campaign || null,
    utm_content: params.utm_content || null,
    utm_term: params.utm_term || null,
  }
}

export interface LandingAttribution {
  landing_page: string | null
  landing_referrer: string | null
}

const LANDING_STORAGE_KEY = 'thepsychology_landing_attribution'
const LANDING_EXPIRY_KEY = 'thepsychology_landing_expiry'

/**
 * Store first-touch landing page + referrer (which page brought the visitor in).
 * Unlike UTMs, this is captured on every first visit, including organic traffic
 * with no UTM params (e.g. Google -> blog post -> signup).
 */
export function storeLandingAttribution(): void {
  if (typeof window === 'undefined') return

  // First-touch: keep the original landing page if it hasn't expired
  const existingExpiry = localStorage.getItem(LANDING_EXPIRY_KEY)
  if (existingExpiry && new Date(existingExpiry) > new Date()) return

  const referrer = document.referrer
  const isExternalReferrer = referrer && !referrer.startsWith(window.location.origin)

  const attribution: LandingAttribution = {
    landing_page: window.location.pathname + window.location.search,
    landing_referrer: isExternalReferrer ? referrer : null,
  }

  localStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify(attribution))

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + UTM_EXPIRY_DAYS)
  localStorage.setItem(LANDING_EXPIRY_KEY, expiryDate.toISOString())
}

/**
 * Get stored first-touch landing attribution
 */
export function getStoredLandingAttribution(): LandingAttribution {
  const empty: LandingAttribution = { landing_page: null, landing_referrer: null }
  if (typeof window === 'undefined') return empty

  try {
    const stored = localStorage.getItem(LANDING_STORAGE_KEY)
    if (!stored) return empty

    const expiry = localStorage.getItem(LANDING_EXPIRY_KEY)
    if (expiry && new Date(expiry) < new Date()) {
      localStorage.removeItem(LANDING_STORAGE_KEY)
      localStorage.removeItem(LANDING_EXPIRY_KEY)
      return empty
    }

    const parsed = JSON.parse(stored) as Partial<LandingAttribution>
    return {
      landing_page: parsed.landing_page || null,
      landing_referrer: parsed.landing_referrer || null,
    }
  } catch {
    return empty
  }
}

const BLOG_STORAGE_KEY = 'thepsychology_blog_attribution'
const BLOG_EXPIRY_KEY = 'thepsychology_blog_expiry'

/**
 * Extract the blog slug from a /blog/<slug> path, or null if not a blog post.
 */
export function blogSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/blog\/([^/?#]+)/)
  return m ? m[1] : null
}

/**
 * Store first-touch blog attribution: the FIRST blog post the visitor lands on
 * (in a 30-day window), independent of whether they click the in-blog CTA.
 * This is the durable per-post signal — unlike landing_page, it survives the
 * visitor navigating off the blog to the pricing/signup page before converting.
 * Called on every page mount; only acts when on a /blog/<slug> page.
 */
export function storeBlogAttribution(): void {
  if (typeof window === 'undefined') return

  const slug = blogSlugFromPath(window.location.pathname)
  if (!slug) return

  // First-touch: keep the original blog post if it hasn't expired
  const existingExpiry = localStorage.getItem(BLOG_EXPIRY_KEY)
  if (existingExpiry && new Date(existingExpiry) > new Date()) return

  localStorage.setItem(BLOG_STORAGE_KEY, slug)

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + UTM_EXPIRY_DAYS)
  localStorage.setItem(BLOG_EXPIRY_KEY, expiryDate.toISOString())
}

/**
 * Get the stored first-touch blog slug (or null).
 */
export function getStoredBlogSlug(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const slug = localStorage.getItem(BLOG_STORAGE_KEY)
    if (!slug) return null

    const expiry = localStorage.getItem(BLOG_EXPIRY_KEY)
    if (expiry && new Date(expiry) < new Date()) {
      localStorage.removeItem(BLOG_STORAGE_KEY)
      localStorage.removeItem(BLOG_EXPIRY_KEY)
      return null
    }

    return slug
  } catch {
    return null
  }
}
