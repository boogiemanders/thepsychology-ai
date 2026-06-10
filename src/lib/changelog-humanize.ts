// Turns raw commit subjects into plain-language changelog titles, and keeps
// person names / email addresses out of user-facing changelog text.

// Words that look capitalized but are NOT person names — don't redact these.
const NON_NAME_CAPITALIZED_PAIRS = new Set([
  'Block Design', 'Visual Puzzles', 'Visual Spatial', 'Verbal Comprehension',
  'Fluid Reasoning', 'Working Memory', 'Processing Speed', 'Matrix Reasoning',
  'Figure Weights', 'Digit Sequencing', 'Running Digits', 'Symbol Search',
  'Symbol Span', 'Set Relations', 'Spatial Addition', 'Digits Forward',
  'Digits Backward', 'Naming Speed', 'Letter Number', 'Letter-Number',
  'Pearson Blue', 'Google Docs', 'Google Doc', 'Web Store', 'Chrome Web',
  'Personal Timeline', 'Personal Profile', 'Test Date', 'Birth Date',
  'Test Age', 'Last Name', 'First Name', 'Sample Item', 'Read Aloud',
  'Total Raw', 'Raw Score', 'Scaled Score', 'Sum Score', 'Index Score',
  'Composite Score', 'Critical Value', 'Base Rate', 'Set Errors',
  'Rotation Errors', 'Dimension Errors', 'Time Bonus', 'Partial Score',
  'Constructed Design', 'Picture Items', 'New York', 'Hong Kong',
  'Los Angeles', 'San Francisco', 'United States', 'United Kingdom',
])

const EMAIL_PATTERN = /[\w.+-]{1,64}@[\w-]+(?:\.[\w-]+)+/g

// A name-like token: capitalized, allowing inner caps (McDonald), apostrophes
// (O'Brien), and hyphens (Kubler-Ross).
const NAME_TOKEN = String.raw`(?:[A-Z][a-z]*)+(?:['’-][A-Za-z]+)*`
const NAME_PAIR_PATTERN = new RegExp(String.raw`\b${NAME_TOKEN}\s+${NAME_TOKEN}\b`, 'g')

// "reported by jane smith" / "feedback from Mary O'Brien" — redact whatever
// follows a feedback verb, regardless of capitalization.
const FEEDBACK_VERBS = 'flagged|reported|noticed|asked|emailed|complained|said|requested|suggested'
const FEEDBACK_BY_PATTERN = new RegExp(
  String.raw`\b(${FEEDBACK_VERBS})\s+by\s+\S+(?:\s+\S+)?`,
  'gi',
)
const FEEDBACK_FROM_PATTERN = new RegExp(
  String.raw`\b(feedback|request|complaint|suggestion)s?\s+from\s+\S+(?:\s+\S+)?`,
  'gi',
)

function redactPersonNames(text: string): string {
  return text.replace(NAME_PAIR_PATTERN, (match) => {
    if (NON_NAME_CAPITALIZED_PAIRS.has(match)) return match
    return '[user]'
  })
}

export function redactSensitiveText(text: string): string {
  return redactPersonNames(text.replace(EMAIL_PATTERN, '[user]'))
    .replace(FEEDBACK_BY_PATTERN, '$1 by [user]')
    .replace(FEEDBACK_FROM_PATTERN, '$1 from [user]')
}

// Internal process noise that means nothing to users.
const INTERNAL_SUFFIX_PATTERNS = [
  /\s*\(approved via slack\)$/i,
  /\s*\(via slack\)$/i,
  /\s*\(#\d+\)$/i,
  /\s*per oe_ask$/i,
  /\s*per oe fact-check$/i,
  /\s*per openevidence fact-check$/i,
]

function stripInternalSuffixes(title: string): string {
  let out = title.trim()
  for (let pass = 0; pass < INTERNAL_SUFFIX_PATTERNS.length; pass++) {
    let changed = false
    for (const pattern of INTERNAL_SUFFIX_PATTERNS) {
      const next = out.replace(pattern, '')
      if (next !== out) {
        out = next.trim()
        changed = true
      }
    }
    if (!changed) break
  }
  return out
}

const COMMIT_TYPE_LABELS: Record<string, string> = {
  feat: 'New feature',
  fix: 'Fix',
  perf: 'Improvement',
  content: 'Content update',
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function replaceInternalTerms(text: string): string {
  return text.replace(/examsGPT\//gi, 'exams folder ').replace(/\bexamsGPT\b/gi, 'exams folder')
}

// Full display pipeline for a raw commit subject. Redaction happens BEFORE the
// subject is capitalized: the capital letter added here would otherwise pair
// with a following word and look like a name ("correct Cohen's" -> "[user]'s").
export function displayChangelogTitle(rawTitle: string): string {
  const title = stripInternalSuffixes(rawTitle.trim())

  // Blog titles are already public content on the site, so the quoted title is
  // shown verbatim (emails still redacted). Everything else is fully redacted.
  const blogMatch = title.match(/^blog:\s*publish\s*("[^"]*")/i)
  if (blogMatch) {
    return `New blog published: ${blogMatch[1].replace(EMAIL_PATTERN, '[user]')}`
  }

  const redacted = replaceInternalTerms(redactSensitiveText(title))
  const conventional = redacted.match(/^([a-z]+)(\([^)]*\))?!?:\s*(.+)$/i)
  if (conventional) {
    const label = COMMIT_TYPE_LABELS[conventional[1].toLowerCase()]
    const subject = capitalize(conventional[3].trim())
    return label ? `${label}: ${subject}` : subject
  }

  return capitalize(redacted)
}
