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

/** Strip leading letter prefix like "A. " or "D. " from option text to avoid
 *  doubling when the renderer already prepends its own A/B/C/D label. */
export const stripOptionLetterPrefix = (text: unknown): string =>
  typeof text === 'string' ? text.replace(/^[A-Da-d]\.\s*/, '') : ''

/** Fisher-Yates in-place shuffle. */
const fisherYates = <T,>(array: T[]): T[] => {
  const out = [...array]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Shuffle options while preserving each option's canonical source letter
 *  by prefixing the text with "A. ", "B. ", etc. (based on its position in
 *  the source). After shuffling, extractOptionLetter() recovers the
 *  canonical letter regardless of display order, so explanations that say
 *  "Option A is wrong because..." continue to point at the right choice.
 *
 *  Idempotent: if any option in the input already has a letter prefix,
 *  shuffles without re-prefixing (preserves the original canonical letter
 *  for stored / re-shuffled options). */
export const shuffleOptionsWithCanonicalLetters = (sourceOptions: string[]): string[] => {
  const alreadyPrefixed = sourceOptions.some(
    (opt) => typeof opt === 'string' && /^\s*[A-Da-d]\./.test(opt),
  )
  const prefixed = alreadyPrefixed
    ? [...sourceOptions]
    : sourceOptions.map((text, idx) =>
        typeof text === 'string' ? `${String.fromCharCode(65 + idx)}. ${text}` : text,
      )
  return fisherYates(prefixed)
}

/** Shuffle options + return the correct answer with matching canonical
 *  letter prefix so equality comparisons (`option === correctAnswer`)
 *  keep working. Use this when the caller has both options and a
 *  correctAnswer string. */
export const shuffleQuestion = (
  sourceOptions: string[],
  correctAnswer: string,
): { options: string[]; correctAnswer: string } => {
  const options = shuffleOptionsWithCanonicalLetters(sourceOptions)
  const stripped = stripOptionLetterPrefix(correctAnswer)
  const matched = options.find((opt) => stripOptionLetterPrefix(opt) === stripped)
  return { options, correctAnswer: matched ?? correctAnswer }
}
