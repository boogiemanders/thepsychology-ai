// Extract the spoken lines from an approved TikTok script (body_md) so a
// talking-head model only voices what Anders would actually say on camera.
//
// TikTok drafts carry production markup the daily writer emits:
//
//   TARGET LENGTH: 60s
//   HOOK TYPE: Trending Topic + Burning Question
//   ---
//   HOOK (0-3s):
//   You keep seeing 2026 is the new 2016. ...
//   [Visual: tight talking head, text overlay]
//
// This is deterministic STRIPPING only — the spoken sentences themselves are
// passed through verbatim (approved text is fact-checked and must not change).

// Section headers like "HOOK (0-3s):", "BUILD-UP (3-8s)", "CTA:" — an
// all-caps label, optional parenthetical timing, colon optional (the writer
// emits both variants).
const SECTION_HEADER = /^[A-Z][A-Z0-9 &/+'-]*(\([^)]*\))?:?\s*$/

// Metadata lines like "TARGET LENGTH: 60s" — all-caps label with inline value.
// Only stripped when the label is all-caps so spoken lines ("Here is why: ...")
// survive.
const METADATA_LINE = /^[A-Z][A-Z0-9 &/+'-]*:\s+\S/

export function extractSpokenScript(bodyMd: string): string {
  let text = bodyMd

  // Drop the metadata block above the first "---" divider, if there is one
  // and it looks like metadata (avoids eating a script that opens with prose).
  const dividerIdx = text.indexOf("\n---")
  if (dividerIdx !== -1) {
    const head = text.slice(0, dividerIdx)
    const headLines = head.split("\n").filter((l) => l.trim().length > 0)
    if (headLines.length > 0 && headLines.every((l) => METADATA_LINE.test(l.trim()) || SECTION_HEADER.test(l.trim()))) {
      text = text.slice(dividerIdx + "\n---".length)
    }
  }

  const spoken: string[] = []
  for (const raw of text.split("\n")) {
    let line = raw.trim()
    if (!line) continue
    if (line === "---") continue
    // Hashtag rows ("#psychology #nostalgia #mentalhealth") are caption text,
    // not speech. Drop the line when at least half its tokens are hashtags.
    // (Checked before the markdown strip below eats the leading "#".)
    const tokens = line.split(/\s+/)
    if (tokens.filter((t) => t.startsWith("#")).length >= Math.max(1, tokens.length / 2)) continue
    // Markdown headings ("# TikTok Script: ...") are titles, never speech.
    // (Hashtag rows like "#EPPP #psychology" have no space after "#" and are
    // already dropped above.)
    if (/^#{1,6}\s/.test(line)) continue
    // Markdown emphasis chars and wrapping quote marks would trip up TTS;
    // strip the symbols first so a bolded "**HOOK (0-3s)**" still gets
    // recognized as a section header below. Words themselves stay untouched.
    line = line
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^[-•]\s+/, "")
      .replace(/^["“]+|["”]+$/g, "")
      .trim()
    if (!line) continue
    if (SECTION_HEADER.test(line)) continue
    if (METADATA_LINE.test(line)) continue
    // Stage directions: "[Visual: ...]", "[Cut to ...]", "(Visual: ...)"
    if (line.startsWith("[") && line.endsWith("]")) continue
    if (/^\((Visual|Cut|B-roll|On screen|Text overlay)/i.test(line)) continue
    spoken.push(line)
  }

  return spoken.join("\n")
}

// EPPP domain named in the intro line ("...with a question on X.") of a
// practice-question script, title-cased for display in the video's title
// block ("ethics" -> "Ethics"; already-capitalized forms like "I-O
// Psychology" pass through; connector words like "and" stay lowercase).
// Returns null when no domain is named (non-question videos).
export function parseDomain(spokenText: string): string | null {
  const m = spokenText.match(/question on ([A-Za-z][A-Za-z /-]*?)\s*[.?!]/)
  if (!m) return null
  const SMALL_WORDS = new Set(["and", "or", "of", "the", "in", "for"])
  return m[1]
    .trim()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word) ? word : word[0].toUpperCase() + word.slice(1)
    )
    .join(" ")
}

// ~150 spoken words per minute at a natural pace.
export function estimateDurationSeconds(spokenText: string): number {
  const words = spokenText.split(/\s+/).filter(Boolean).length
  return Math.round((words / 150) * 60)
}

// Practice-question scripts (post-extractSpokenScript, so plain spoken lines):
//
//   Is it possible to pass the psychology licensure exam? Let's find out with a question on X.
//   <stem, 1+ lines>
//   A... <choice>   B... / C... / D... on the next three lines
//   Pause to think of your answer.
//   The answer is <letter>. ...
//
// The Remotion overlay shows the stem + choices as an on-screen card, so the
// text must come out verbatim (only the "X... " prefixes are stripped; the
// card renders its own letters). Returns null when the script is not this
// shape (non-question videos get captions but no card).
export function parsePracticeQuestion(
  spokenText: string
): { stem: string; choices: string[] } | null {
  const lines = spokenText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  // The four choice lines must be consecutive and in A-D order.
  const choiceIdx = lines.findIndex((_, i) =>
    ["A", "B", "C", "D"].every((letter, j) => lines[i + j]?.startsWith(`${letter}... `))
  )
  if (choiceIdx === -1) return null
  const introIdx = lines.findIndex((l) => l.startsWith("Is it possible"))
  if (introIdx === -1 || introIdx >= choiceIdx) return null
  const stem = lines.slice(introIdx + 1, choiceIdx).join(" ")
  if (!stem) return null
  const choices = lines
    .slice(choiceIdx, choiceIdx + 4)
    .map((l) => l.slice("A... ".length))
  return { stem, choices }
}
