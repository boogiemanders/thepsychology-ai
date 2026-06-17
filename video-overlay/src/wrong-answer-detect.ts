// Shared wrong-answer call-out detection for PracticeQuestion.tsx.
//
// Scripts phrase eliminations two ways:
//   explicit  "<L> is wrong / is incorrect / fails"  and the pair
//             "<L> and <L> are/is ..."  (MMPI-style: "B is wrong because...")
//   named     the call-out names the CONCEPT, opening with the letter and a
//             verb, e.g. "A is the success and failure bias, not this." /
//             "C needs the fans explaining..." / "D is for groups..." (Ariana).
//
// The named pattern is broader, so it is gated twice to stay safe:
//   1. the letter must NOT be the reveal's correct-answer letter, and
//   2. the cue must sit at/after the choices have been read (the explanation
//      region), so the choices LISTING ("A, self-serving bias.") never matches
//      — that listing has a comma after the letter, not a verb, so it also
//      fails the verb test, but the region gate is a second belt-and-braces.
import type { Caption } from "@remotion/captions";

export type Reveal = { fromMs: number; index: number } | null;

type Norm = (t: string) => string;

// Verbs that, right after a bare choice letter at the START of a cue, mark a
// named wrong-answer call-out ("A is ...", "C needs ...", "D describes ...").
// Choice LISTINGS read "A, ..." (comma -> normalizes to "a self serving ...",
// the second token is never one of these verbs), so they do not match.
const NAMED_VERB = /^([a-d]) (?:is|are|was|were|means?|needs?|describes?)\b/;

// Explicit single verdict: "<L> is wrong / is incorrect / fails".
const EXPLICIT_SINGLE = /\b([A-D]) (?:is wrong|is incorrect|fails?)\b/;

// The "The answer is X" reveal cue. correctIndex bounds it to a real choice.
export function detectReveal(
  cues: Caption[],
  norm: Norm,
  choiceCount: number
): Reveal {
  for (const c of cues) {
    const m = norm(c.text).match(/^the answer is ([a-d])\b/);
    if (!m) continue;
    const index = "abcd".indexOf(m[1]);
    return index < choiceCount ? { fromMs: c.startMs, index } : null;
  }
  return null;
}

// Lower bound for the named pattern: the start of the LAST choice-listing cue
// (a cue beginning with a bare choice letter that is NOT followed by a verb,
// e.g. "D, ultimate attribution"). After the listing ends, the explanation
// begins, so any "<L> <verb>" cue from there on is a real call-out. Returns 0
// when the choices are never listed start-anchored (e.g. MMPI lists them
// mid-sentence), which is harmless: those videos use the explicit pattern.
function choicesListedEndMs(cues: Caption[], norm: Norm): number {
  let last = 0;
  for (const c of cues) {
    const t = norm(c.text);
    if (/^[a-d] /.test(t) && !NAMED_VERB.test(t)) last = Math.max(last, c.startMs);
  }
  return last;
}

// Is this cue a wrong-answer call-out? Returns the 0-based choice index or -1.
// `lowerBoundMs` and `correctIndex` gate the broader named pattern only.
export function wrongCallOutIndex(
  cue: Caption,
  norm: Norm,
  lowerBoundMs: number,
  correctIndex: number | null
): number {
  // Explicit verdict works anywhere (MMPI-style), no region gate.
  const explicit = cue.text.match(EXPLICIT_SINGLE);
  if (explicit) return "ABCD".indexOf(explicit[1]);

  // Named call-out: gated to the explanation region and never the correct row.
  const named = norm(cue.text).match(NAMED_VERB);
  if (named && cue.startMs >= lowerBoundMs) {
    const idx = "abcd".indexOf(named[1]);
    if (idx >= 0 && idx !== correctIndex) return idx;
  }
  return -1;
}

// First wrong-answer call-out time (for the card window's lower edge). Scans
// for the earliest cue that is a single explicit verdict, a named call-out, or
// the existing pair pattern. Returns null if none.
export function detectFirstWrongMs(
  cues: Caption[],
  norm: Norm,
  reveal: Reveal
): number | null {
  const lower = choicesListedEndMs(cues, norm);
  const correctIndex = reveal?.index ?? null;
  for (const c of cues) {
    const t = norm(c.text);
    if (/\b[a-d] and [a-d] (?:are|is) /.test(t)) return c.startMs;
    if (wrongCallOutIndex(c, norm, lower, correctIndex) >= 0) return c.startMs;
  }
  return null;
}

// All distinct wrong letters detected (for the safety test). Production builds
// full strike windows; this is just the letter+time list the test asserts on.
export function detectWrongLetters(
  cues: Caption[],
  norm: Norm,
  reveal: Reveal
): { letter: string; fromMs: number; index: number }[] {
  const lower = choicesListedEndMs(cues, norm);
  const correctIndex = reveal?.index ?? null;
  const seen = new Set<number>();
  const out: { letter: string; fromMs: number; index: number }[] = [];
  for (const c of cues) {
    const idx = wrongCallOutIndex(c, norm, lower, correctIndex);
    if (idx >= 0 && !seen.has(idx)) {
      seen.add(idx);
      out.push({ letter: "ABCD"[idx], fromMs: c.startMs, index: idx });
    }
  }
  return out;
}

export { choicesListedEndMs };
