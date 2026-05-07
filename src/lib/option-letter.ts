/** Pull the canonical letter (A/B/C/D) out of an option string like
 *  "B. Obtain written consent..." so shuffled options keep the same letter
 *  the explanation text and stored answer reference. Returns "" if no
 *  embedded letter is present, so callers should fall back to a
 *  position-based letter. */
export const extractOptionLetter = (text: unknown): string => {
  if (typeof text !== 'string') return ''
  const match = text.match(/^\s*([A-Da-d])\./)
  return match ? match[1].toUpperCase() : ''
}
