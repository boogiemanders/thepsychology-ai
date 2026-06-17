import type { Caption } from "@remotion/captions";

// The talking-head scripts spell things phonetically so the voice says them
// right ("E triple P"). On screen we want the real written forms. The SRT is
// transcribed from the audio, so captions arrive phonetic; this maps them back.
// Order matters: longer phrases first so substrings don't fire early.
const SPELLING_MAP: [phonetic: string, written: string][] = [
  // HeyGen's ASR sometimes normalizes the spoken URL itself but doubles the
  // article ("go to the thepsychology.ai") — collapse that first.
  ["the thepsychology.ai", "thepsychology.ai"],
  ["the psychology dot ai", "thepsychology.ai"],
  // ASR misspellings seen in real transcripts. HeyGen's ASR keeps inventing
  // new spellings of the URL ("thepsychoology.ai", "the psychology.ai"), and
  // an unmapped variant breaks BOTH the caption and end-card detection
  // (PracticeQuestion greps mapped captions for the URL). Check new SRT tails.
  ["thepsychoology.ai", "thepsychology.ai"],
  ["thepsycholey.ai", "thepsychology.ai"],
  ["the psychology.ai", "thepsychology.ai"],
  ["psychology.ai", "thepsychology.ai"],
  // ASR mangles the spoken "E triple P" into letter-runs (seen on a real SRT:
  // "ECCC", also "E C C C"). Map them back so captions read EPPP, not ECCC.
  ["E C C C", "EPPP"],
  ["ECCC", "EPPP"],
  ["E triple P", "EPPP"],
  // Founder 2026-06-17: the German lyric "Du bist gut genug" is respelled
  // phonetically in the spoken script ("Doo bist goot guh-nook") so HeyGen's
  // English voice says it like German (same trick as "E triple P"). Map it back
  // so the on-screen card/captions read the real German. Place above the bare
  // letter maps; this 4-word phrase is longer than the single-token entries.
  ["Doo bist goot guh-nook", "Du bist gut genug"],
  ["ways four", "WAIS-IV"],
  // Scripts spell the test phonetically ("M-M-P-I two") so the avatar says the
  // letters; the ASR caption comes back as "MMPI-2". Both must normalize to the
  // same token or the on-screen question card never matches its window and is
  // silently dropped. Longest first ("two" variant before the bare letters).
  ["M-M-P-I two", "MMPI-2"],
  ["M-M-P-I", "MMPI"],
  // Same story for other letter-spelled test/drug names: the script hyphenates
  // them so the avatar says each letter, the ASR caption collapses them. Map
  // back so on-screen text reads right AND animation-cue triggers (authored
  // from the spoken script) match the transcript.
  ["M-A-O-I", "MAOI"],
  // Founder 2026-06-16: "t-test" must be spoken "tee test" (scripts write it
  // that way); show the real term on screen.
  ["tee test", "t-test"],
  // Display-only grammar fix (founder, 2026-06-12): scripts/audio say
  // "overweights", captions and cards show the correct verb.
  ["overweights", "overweighs"],
];

type Word = { text: string; cueIdx: number };

const stripPunct = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
const trailingPunct = (w: string) => w.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? "";

// A phonetic phrase can split across cue boundaries ("go to the psychology" /
// "dot ai."), so matching runs over the whole word stream, then cue texts are
// rebuilt. The written form lands in the cue where the phrase started.
export function applySpellingMap(captions: Caption[]): Caption[] {
  const words: Word[] = captions.flatMap((c, cueIdx) =>
    c.text
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => ({ text, cueIdx }))
  );

  for (const [phonetic, written] of SPELLING_MAP) {
    const phrase = phonetic.toLowerCase().split(/\s+/);
    for (let i = 0; i <= words.length - phrase.length; i++) {
      const slice = words.slice(i, i + phrase.length);
      const matches = slice.every(
        (w, j) => stripPunct(w.text).toLowerCase() === phrase[j]
      );
      if (!matches) continue;
      const punct = trailingPunct(slice[slice.length - 1].text);
      words.splice(i, phrase.length, {
        text: written + punct,
        cueIdx: slice[0].cueIdx,
      });
    }
  }

  return captions
    .map((c, cueIdx) => ({
      ...c,
      text: words
        .filter((w) => w.cueIdx === cueIdx)
        .map((w) => w.text)
        .join(" "),
    }))
    .filter((c) => c.text.length > 0);
}

// Plain-string version for non-caption text (question card stem/choices,
// strike reasons) which is parsed from the SPOKEN script and so arrives
// phonetic ("ways four"). Longest phrases first, same map as captions.
export function applySpellingToText(text: string): string {
  let out = text
  for (const [phonetic, written] of SPELLING_MAP) {
    out = out.replace(new RegExp(phonetic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), written)
  }
  return out
}
