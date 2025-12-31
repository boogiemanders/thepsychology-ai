/**
 * Referral Source Options
 * Used for marketing attribution tracking
 */

export interface ReferralSourceOption {
  value: string
  label: string
  category: 'facebook' | 'social' | 'search' | 'referral' | 'other'
}

export const REFERRAL_SOURCES: ReferralSourceOption[] = [
  // Facebook Groups - EPPP specific (your best channel!)
  {
    value: 'fb_eppp_study_group',
    label: 'Facebook: EPPP Study Group',
    category: 'facebook',
  },
  {
    value: 'fb_eppp_prep',
    label: 'Facebook: EPPP Prep & Support',
    category: 'facebook',
  },
  {
    value: 'fb_psych_licensing',
    label: 'Facebook: Psychology Licensing',
    category: 'facebook',
  },
  {
    value: 'fb_clinical_psych',
    label: 'Facebook: Clinical Psychology Students',
    category: 'facebook',
  },
  {
    value: 'fb_other',
    label: 'Facebook: Other Group',
    category: 'facebook',
  },

  // Other Social Media
  {
    value: 'instagram',
    label: 'Instagram',
    category: 'social',
  },
  {
    value: 'twitter',
    label: 'Twitter/X',
    category: 'social',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    category: 'social',
  },
  {
    value: 'reddit',
    label: 'Reddit',
    category: 'social',
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    category: 'social',
  },
  {
    value: 'discord',
    label: 'Discord',
    category: 'social',
  },

  // Search
  {
    value: 'google_search',
    label: 'Google Search',
    category: 'search',
  },
  {
    value: 'bing_search',
    label: 'Bing Search',
    category: 'search',
  },

  // Referrals
  {
    value: 'friend_colleague',
    label: 'Friend or Colleague',
    category: 'referral',
  },
  {
    value: 'supervisor_professor',
    label: 'Supervisor or Professor',
    category: 'referral',
  },
  {
    value: 'training_program',
    label: 'Training Program / University',
    category: 'referral',
  },

  // Other
  {
    value: 'podcast',
    label: 'Podcast',
    category: 'other',
  },
  {
    value: 'blog_article',
    label: 'Blog / Article',
    category: 'other',
  },
  {
    value: 'other',
    label: 'Other',
    category: 'other',
  },
]

/**
 * Group referral sources by category for dropdown display
 */
export function getReferralSourcesByCategory() {
  return {
    facebook: REFERRAL_SOURCES.filter(s => s.category === 'facebook'),
    social: REFERRAL_SOURCES.filter(s => s.category === 'social'),
    search: REFERRAL_SOURCES.filter(s => s.category === 'search'),
    referral: REFERRAL_SOURCES.filter(s => s.category === 'referral'),
    other: REFERRAL_SOURCES.filter(s => s.category === 'other'),
  }
}

/**
 * Get a referral source by value
 */
export function getReferralSourceByValue(value: string): ReferralSourceOption | undefined {
  return REFERRAL_SOURCES.find(s => s.value === value)
}

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<ReferralSourceOption['category'], string> = {
  facebook: 'Facebook Groups',
  social: 'Social Media',
  search: 'Search Engines',
  referral: 'Personal Referral',
  other: 'Other',
}
