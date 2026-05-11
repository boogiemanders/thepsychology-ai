import { extractOptionLetter, stripOptionLetterPrefix } from '@/lib/option-letter'

type ExplanationBlockProps = {
  explanation: string
  options: string[]
  correctAnswer: string
  className?: string
}

type WrongRow = {
  letter: string
  optionText: string
  rationale: string
}

type ParsedExplanation =
  | { kind: 'structured'; correctRationale: string; wrongRows: WrongRow[] }
  | { kind: 'labeled'; correctRationale: string; wrongProse: string }
  | { kind: 'paragraphs'; paragraphs: string[] }

const stripLeadingNumber = (text: string): string =>
  text.replace(/^\s*\d+[.)]\s*/, '').trim()

const splitDashItems = (section: string): string[] => {
  const trimmed = stripLeadingNumber(section)
  const parts = trimmed
    .split(/\n\s*-\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return []
  if (parts[0].startsWith('-')) parts[0] = parts[0].replace(/^-\s*/, '').trim()
  return parts.filter(Boolean)
}

const parseDashItem = (
  item: string,
): { optionText: string; rationale: string } | null => {
  const quoted = item.match(/^"([^"]+)"\s*:\s*([\s\S]+)$/)
  if (quoted) return { optionText: quoted[1].trim(), rationale: quoted[2].trim() }
  const unquoted = item.match(/^([^:]{3,200}?):\s*([\s\S]+)$/)
  if (unquoted) return { optionText: unquoted[1].trim().replace(/^"|"$/g, ''), rationale: unquoted[2].trim() }
  return null
}

const matchOptionToLetter = (
  optionText: string,
  options: string[],
): { letter: string; cleanText: string; index: number } | null => {
  const target = optionText.toLowerCase().trim().replace(/[.,;:!?]+$/, '')
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    const stripped = stripOptionLetterPrefix(opt).toLowerCase().trim().replace(/[.,;:!?]+$/, '')
    if (stripped === target || stripped.startsWith(target) || target.startsWith(stripped)) {
      const letter = extractOptionLetter(opt) || String.fromCharCode(65 + i)
      return { letter, cleanText: stripOptionLetterPrefix(opt), index: i }
    }
  }
  return null
}

const cleanRationale = (raw: string): string => {
  let r = raw.trim()
  r = r.replace(/^[,;:.\s]+/, '')
  r = r.replace(
    /^(?:is\s+(?:incorrect|wrong|misleading|inaccurate|not\s+correct)\b\s*(?:because\s+)?|is\s+the\s+(?:wrong|incorrect)\s+(?:choice|answer)\s+because\s+|because\s+|relates\s+to\s+|pertains\s+to\s+|refers\s+to\s+|describes\s+|is\s+)/i,
    '',
  )
  r = r.replace(
    /[\s,]+(?:Lastly|Furthermore|Additionally|Also|Finally|Moreover|Similarly|However|Meanwhile|Likewise|In\s+contrast|On\s+the\s+other\s+hand)\s*[,.]?\s*$/i,
    '',
  )
  r = r.trim().replace(/^[,;:.\s]+/, '').trim()
  if (r.length > 0) r = r.charAt(0).toUpperCase() + r.slice(1)
  return r
}

const parseProseWrongRationales = (
  section: string,
  options: string[],
  correctOptionIndex: number,
): WrongRow[] | null => {
  const text = stripLeadingNumber(section).replace(/\s+/g, ' ').trim()
  if (!text) return null

  const quoteRegex = /"([^"]{4,})"/g
  type Hit = { text: string; start: number; end: number; index: number }
  const hits: Hit[] = []
  let m: RegExpExecArray | null
  while ((m = quoteRegex.exec(text)) !== null) {
    const matched = matchOptionToLetter(m[1], options)
    if (matched && matched.index !== correctOptionIndex) {
      hits.push({ text: m[1], start: m.index, end: m.index + m[0].length, index: matched.index })
    }
  }

  const unique: Hit[] = []
  const seen = new Set<number>()
  for (const h of hits) {
    if (seen.has(h.index)) continue
    seen.add(h.index)
    unique.push(h)
  }

  if (unique.length < 2) return null

  const rows: WrongRow[] = []
  for (let i = 0; i < unique.length; i++) {
    const h = unique[i]
    const rationaleEnd = i + 1 < unique.length ? unique[i + 1].start : text.length
    const rawRationale = text.slice(h.end, rationaleEnd)
    const matched = matchOptionToLetter(h.text, options)
    if (!matched) return null
    rows.push({
      letter: matched.letter,
      optionText: matched.cleanText,
      rationale: cleanRationale(rawRationale),
    })
  }

  return rows.filter((r) => r.rationale.length > 0).length >= 2 ? rows : null
}

const splitParagraphs = (text: string): string[] => {
  const numbered = text
    .match(/(?:^|\s)\d+[.)]\s[\s\S]*?(?=(?:\s+\d+[.)]\s)|$)/g)
    ?.map((s) => s.trim())
    .filter(Boolean)
  if (numbered && numbered.length > 1) return numbered
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paragraphs.length > 0 ? paragraphs : [text]
}

const parseExplanation = (
  explanation: string,
  options: string[],
  correctOptionIndex: number,
): ParsedExplanation => {
  const text = explanation.trim()
  const sections = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)

  const looksLikeNumberedSplit =
    sections.length >= 2 && /^\s*1[.)]/.test(sections[0]) && /^\s*2[.)]/.test(sections[1])

  if (looksLikeNumberedSplit) {
    const correctRationale = stripLeadingNumber(sections[0])
    const wrongSection = sections.slice(1).join('\n\n')

    const dashItems = splitDashItems(wrongSection)
    if (dashItems.length >= 2 && correctRationale.length > 0) {
      const wrongRows: WrongRow[] = []
      let allMatched = true
      for (const item of dashItems) {
        const parsed = parseDashItem(item)
        if (!parsed) { allMatched = false; break }
        const matched = matchOptionToLetter(parsed.optionText, options)
        if (!matched || matched.index === correctOptionIndex) { allMatched = false; break }
        wrongRows.push({ letter: matched.letter, optionText: matched.cleanText, rationale: parsed.rationale })
      }
      if (allMatched && wrongRows.length >= 2) {
        wrongRows.sort((a, b) => a.letter.localeCompare(b.letter))
        return { kind: 'structured', correctRationale, wrongRows }
      }
    }

    const proseRows = parseProseWrongRationales(wrongSection, options, correctOptionIndex)
    if (proseRows && proseRows.length >= 2 && correctRationale.length > 0) {
      proseRows.sort((a, b) => a.letter.localeCompare(b.letter))
      return { kind: 'structured', correctRationale, wrongRows: proseRows }
    }

    return {
      kind: 'labeled',
      correctRationale,
      wrongProse: stripLeadingNumber(wrongSection).trim(),
    }
  }

  return { kind: 'paragraphs', paragraphs: splitParagraphs(text) }
}

const correctLetterFor = (correctAnswer: string, options: string[]): { letter: string; index: number } => {
  const fromAnswer = extractOptionLetter(correctAnswer)
  const strippedAnswer = stripOptionLetterPrefix(correctAnswer).toLowerCase().trim()
  const idx = options.findIndex(
    (opt) => opt === correctAnswer || stripOptionLetterPrefix(opt).toLowerCase().trim() === strippedAnswer,
  )
  if (idx >= 0) {
    const letter = extractOptionLetter(options[idx]) || String.fromCharCode(65 + idx)
    return { letter, index: idx }
  }
  return { letter: fromAnswer, index: -1 }
}

export function ExplanationBlock({
  explanation,
  options,
  correctAnswer,
  className,
}: ExplanationBlockProps) {
  const text = (explanation ?? '').trim()
  if (!text) return null

  const { letter: correctLetter, index: correctIndex } = correctLetterFor(correctAnswer, options)
  const parsed = parseExplanation(text, options, correctIndex)

  if (parsed.kind === 'paragraphs') {
    return (
      <div className={`text-sm text-muted-foreground space-y-3 ${className ?? ''}`.trim()}>
        {parsed.paragraphs.map((paragraph, idx) => (
          <p key={`${idx}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
        ))}
      </div>
    )
  }

  const correctLabel = correctLetter ? `Why ${correctLetter} is correct` : 'Why this is correct'

  return (
    <div className={`space-y-5 ${className ?? ''}`.trim()}>
      <div>
        <div
          className="text-xs uppercase tracking-wide font-semibold mb-2"
          style={{ color: 'var(--brand-olive)' }}
        >
          {correctLabel}
        </div>
        <div
          className="pl-4 border-l-2"
          style={{ borderColor: 'var(--brand-olive)' }}
        >
          <p className="text-sm text-foreground leading-relaxed">
            {parsed.correctRationale}
          </p>
        </div>
      </div>

      <div>
        <div
          className="text-xs uppercase tracking-wide font-semibold mb-3"
          style={{ color: 'var(--brand-coral)' }}
        >
          Why the other options are wrong
        </div>

        {parsed.kind === 'structured' ? (
          <div className="space-y-4">
            {parsed.wrongRows.map((row) => (
              <div key={row.letter} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded border flex items-center justify-center text-xs font-semibold"
                  style={{ borderColor: 'var(--brand-coral)', color: 'var(--brand-coral)' }}
                >
                  {row.letter}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {row.optionText}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {row.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {parsed.wrongProse}
          </p>
        )}
      </div>
    </div>
  )
}
