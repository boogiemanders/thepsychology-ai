export type UserFacingChangelogEntry = {
  title: string
  body?: string
}

// Keywords to filter out from the public changelog.
const EXCLUDED_CHANGELOG_KEYWORDS = [
  'stripe', 'payment', 'billing', 'subscription',
  'price', 'pricing', 'checkout', 'invoice',
  'charge', 'revenue', 'money', 'paid', 'purchase',
  'lab hub', 'lab/', 'sense lens', '/sense', 'sensory processing',
  'clinician tool', 'session wizard', 'mit media lab',
  'inzinna', 'group supervision', 'supervision group', 'postdoc',
  'private practice', 'manhattan office', 'future plan',
  'company plan', 'company spine',
  'domain_folder_map', 'source_folder_to_domain', 'kebab-case',
  'topic-content-v3', 'topic-content-v4',
  'testimonial',
]

// Hide brand/vendor names that should not appear in the public changelog.
// Regex keeps standalone terms like `GPT` from matching folder names.
const EXCLUDED_CHANGELOG_TEXT_PATTERNS = [
  /\baatbs\b/i,
  /\bpsychprep\b/i,
  /\bprepjet\b/i,
  /\bmometrix\b/i,
  /\brula\b/i,
  /\bsondermind\b/i,
  /\blyra\b/i,
  /\bspring health\b/i,
  /\btwo chairs\b/i,
  /\bmental health match\b/i,
  /\bquartet\b/i,
  /\btava\b/i,
  /\binzinna\b/i,
  /\bga4\b/i,
  /\bgpt\b/i,
]

const EXCLUDED_CHANGELOG_TITLE_PATTERNS = [
  /\blab\b/i,
  /\bsense\b/i,
  /sensory/i,
  /clinician/i,
  /therapy session/i,
  /group supervision/i,
  /supervision group/i,
  /future plan/i,
  /company spine/i,
  /private practice/i,
  /founder context/i,
  /rename.*domain.*folder/i,
  /rename.*lesson.*file/i,
  /update.*mapping/i,
  /\bv4\b/i,
  /rtf.*source/i,
  /lesson.*files?/i,
  /infrastructure/i,
  /filter.*commit/i,
  /changelog.*filter/i,
  /filter.*changelog/i,
  /hide.*commit/i,
  /remove.*github/i,
]

export function sanitizeChangelogText(text: string | null | undefined): string | undefined {
  if (typeof text !== 'string') return undefined

  return text
    .replace(/examsGPT\//gi, 'exams folder')
    .replace(/\bexamsGPT\b/gi, 'exams folder')
}

export function isUserRelevantChangelogEntry(entry: UserFacingChangelogEntry): boolean {
  const title = sanitizeChangelogText(entry.title) ?? entry.title
  const body = sanitizeChangelogText(entry.body) ?? entry.body ?? ''
  const text = `${title} ${body}`
  const normalizedText = text.toLowerCase()

  if (EXCLUDED_CHANGELOG_KEYWORDS.some((keyword) => normalizedText.includes(keyword))) {
    return false
  }

  if (EXCLUDED_CHANGELOG_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
    return false
  }

  if (EXCLUDED_CHANGELOG_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return false
  }

  return true
}

export function sanitizeChangelogEntry<T extends UserFacingChangelogEntry>(entry: T): T {
  const sanitizedTitle = sanitizeChangelogText(entry.title) ?? entry.title
  const sanitizedBody = sanitizeChangelogText(entry.body)

  return {
    ...entry,
    title: sanitizedTitle,
    body: sanitizedBody,
  }
}

export function filterAndSanitizeChangelogEntries<T extends UserFacingChangelogEntry>(entries: T[]): T[] {
  return entries
    .map((entry) => sanitizeChangelogEntry(entry))
    .filter((entry) => isUserRelevantChangelogEntry(entry))
}
