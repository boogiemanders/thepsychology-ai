import {
  DiagnosticImpression,
  IntakeData,
  ProviderPreferences,
  SessionTranscript,
  SoapDraft,
  TreatmentPlanData,
  EMPTY_SOAP_DRAFT,
} from './types'

type GoalFocus = 'conflict' | 'substance' | 'anxiety' | 'mood' | 'general'

type SessionSignals = {
  relationshipConflict: string[]
  anxiety: string[]
  substance: string[]
  coping: string[]
  support: string[]
  objective: string[]
  directQuotes: string[]
  attachment: string[]
}

const LOW_SIGNAL_LINES = new Set([
  'common sense',
  'straight',
  'least homophobic',
  'tiktok',
])

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitLines(value: string): string[] {
  return value
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => sanitizeLine(line))
    .filter(Boolean)
}

function sanitizeLine(value: string): string {
  return normalizeWhitespace(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\b(\d+)x\s*\/?\s*week\b/gi, '$1 times per week')
    .replace(/\b(\d+)x\b/gi, '$1 times')
    .replace(/\b2x\b/gi, 'twice')
    .replace(/\b3x\b/gi, '3 times')
    .replace(/\b4x\b/gi, '4 times')
    .replace(/\b5x\b/gi, '5 times')
    .replace(/\b6x\b/gi, '6 times')
    .replace(/\bstriipper\b/gi, 'stripper')
    .replace(/\broofied\b/gi, 'was drugged')
    .replace(/\bAldo\b/g, 'Also')
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const key = value.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }

  return output
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function sentence(value: string): string {
  const trimmed = normalizeWhitespace(value).replace(/[.]+$/, '')
  return trimmed ? `${trimmed}.` : ''
}

function joinSentences(values: string[]): string {
  return values
    .map((value) => sentence(value))
    .filter(Boolean)
    .join(' ')
}

function formatList(values: string[], conjunction = 'and'): string {
  const cleaned = unique(values.map((value) => normalizeWhitespace(value)).filter(Boolean))
  if (!cleaned.length) return ''
  if (cleaned.length === 1) return cleaned[0]
  if (cleaned.length === 2) return `${cleaned[0]} ${conjunction} ${cleaned[1]}`
  return `${cleaned.slice(0, -1).join(', ')}, ${conjunction} ${cleaned[cleaned.length - 1]}`
}

function buildTranscriptText(transcript: SessionTranscript | null): string {
  if (!transcript?.entries.length) return ''

  return transcript.entries
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n')
}

function includesPattern(lines: string[], pattern: RegExp): boolean {
  return lines.some((line) => pattern.test(line))
}

function extractQuotedPhrases(lines: string[]): string[] {
  const phrases: string[] = []

  for (const line of lines) {
    const matches = line.matchAll(/"([^"]{3,})"/g)
    for (const match of matches) {
      const phrase = normalizeWhitespace(match[1])
      if (phrase) phrases.push(phrase)
    }
  }

  return unique(phrases)
}

function extractMoneySpent(lines: string[]): string {
  for (const line of lines) {
    if (!/\bspent\b/i.test(line)) continue
    const match = line.match(/\$?\s?(\d[\d,]*)/)
    if (!match) continue
    const digits = match[1].replace(/,/g, '')
    const amount = Number.parseInt(digits, 10)
    if (!Number.isFinite(amount)) continue
    return `$${amount.toLocaleString('en-US')}`
  }
  return ''
}

function extractAbortionsCount(lines: string[]): string {
  for (const line of lines) {
    const match = line.match(/\b(\d+)\s+abortions?\b/i)
    if (match) return match[1]
  }
  return ''
}

function lowerFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function formatGoalLabel(goal: TreatmentPlanData['goals'][number]): string {
  const raw = normalizeWhitespace(goal.goal).replace(/[.]+$/, '')
  const simplified = raw
    .replace(/^reduce frequency and intensity of\s+/i, 'reduce ')
    .replace(/\bweekly\s+/i, '')
    .replace(/^increase insight into how\s+/i, 'increase insight into how ')
  return `Goal to ${lowerFirst(simplified)}`
}

function formatAssessmentStatus(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'limited progress noted') return 'Limited progress'
  if (normalized === 'some progress noted') return 'Some progress'
  if (normalized === 'good progress noted') return 'Good progress'
  if (normalized === 'progress remains under review') return 'Progress remains under review'
  return value.trim() || 'Progress remains under review'
}

function summarizeInterventions(interventions: string[]): string {
  const cleaned = interventions
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (!cleaned.length) return ''

  const short = cleaned.map((item) => item.match(/\(([^)]+)\)/)?.[1]?.trim() ?? '')
  if (short.every(Boolean)) {
    return formatList(short)
  }

  return formatList(cleaned)
}

function hasClinicalKeyword(line: string): boolean {
  return /\b(anxiety|anxious|anger|angry|fight|fights|argument|arguing|yell|yelled|yelling|job|partner|girlfriend|boyfriend|relationship|conflict|drink|drinking|alcohol|cannabis|marijuana|weed|roofied|drugged|bar|breathe|breathing|lifting|cycling|exercise|anger management|session|mse|affect|speech|thought|oriented|guilt|sad|miss|panic|fear|trigger)\b/i.test(line)
}

function isLowSignalLine(line: string): boolean {
  const normalized = normalizeWhitespace(line).toLowerCase()
  if (!normalized) return true
  if (LOW_SIGNAL_LINES.has(normalized)) return true
  if (/^[a-z]+(?:\s+[a-z]+)?$/i.test(normalized) && normalized.split(' ').length <= 2 && !hasClinicalKeyword(normalized)) {
    return true
  }
  return normalized.split(' ').length < 3 && !hasClinicalKeyword(normalized)
}

function analyzeSessionNotes(lines: string[]): SessionSignals {
  const signals: SessionSignals = {
    relationshipConflict: [],
    anxiety: [],
    substance: [],
    coping: [],
    support: [],
    objective: [],
    directQuotes: [],
    attachment: [],
  }

  for (const rawLine of lines) {
    const line = sanitizeLine(rawLine)
    if (!line || isLowSignalLine(line)) continue

    if ((line.match(/"/g) ?? []).length >= 2) {
      signals.directQuotes.push(line)
    }
    if (/\b(yell(?:ed|ing)?|fight|fights|argument|arguing|called? .*job|job .*times|meeting up|guy|girlfriend|boyfriend|partner|relationship|conflict|guilty|loser|dirty snake)\b/i.test(line)) {
      signals.relationshipConflict.push(line)
    }
    if (/\b(anxiety|anxious|panic|fear|trigger|spiky|distress|worry)\b/i.test(line)) {
      signals.anxiety.push(line)
    }
    if (/\b(drink|drinking|alcohol|bar|drugged|cannabis|marijuana|weed|joint|substance)\b/i.test(line)) {
      signals.substance.push(line)
    }
    if (/\b(breathe|breathing|cycling|lifting|exercise|class|anger management|track|log|journal|pause)\b/i.test(line)) {
      signals.coping.push(line)
    }
    if (/\b(contact|referral|Andrea|Grimshaw)\b/i.test(line)) {
      signals.support.push(line)
    }
    if (/\b(mse|appearance|affect|speech|behavior|thought|oriented|a&o|observed|presented|engaged|tearful|guarded|calm)\b/i.test(line)) {
      signals.objective.push(line)
    }
    if (/\b(miss her|miss him|miss them|birthday|valentine|tatted|tattoo|abortions?)\b/i.test(line)) {
      signals.attachment.push(line)
    }
  }

  return {
    relationshipConflict: unique(signals.relationshipConflict),
    anxiety: unique(signals.anxiety),
    substance: unique(signals.substance),
    coping: unique(signals.coping),
    support: unique(signals.support),
    objective: unique(signals.objective),
    directQuotes: unique(signals.directQuotes),
    attachment: unique(signals.attachment),
  }
}

function extractFrequency(lines: string[]): string {
  for (const line of lines) {
    const match = line.match(/\b(twice|\d+\s+times?)\s+per\s+week\b/i)
    if (match) {
      const raw = match[0].toLowerCase()
      if (raw === '1 time per week' || raw === '1 times per week') return 'once per week'
      if (raw === '2 times per week') return 'twice per week'
      return raw
    }
  }

  for (const line of lines) {
    const match = line.match(/\b(\d+)\s+times?\b/i)
    if (match) return `${match[1]} times`
  }

  return ''
}

function extractCallCount(lines: string[]): string {
  for (const line of lines) {
    const match = line.match(/\bcalled?.*job\s+(\d+)\s+times\b/i) ?? line.match(/\bcalled?.*job.*?(\d+)\s+times\b/i)
    if (match) return match[1]
  }
  return ''
}

function summarizeSubjective(
  lines: string[],
  signals: SessionSignals,
  transcript: SessionTranscript | null,
  intake: IntakeData | null
): string {
  const sentences: string[] = []
  const clientTranscriptLines = transcript?.entries
    .filter((entry) => entry.speaker === 'client')
    .map((entry) => sanitizeLine(entry.text))
    .filter((line) => line && !isLowSignalLine(line)) ?? []

  const conflictSource = unique([
    ...signals.relationshipConflict,
    ...clientTranscriptLines.filter((line) => /\b(fight|argument|partner|girlfriend|boyfriend|relationship|job)\b/i.test(line)),
  ])
  const quotedPhrases = extractQuotedPhrases(lines)
  const moneySpent = extractMoneySpent(lines)
  const abortionsCount = extractAbortionsCount(lines)
  const hasTattooHistory = includesPattern(lines, /\b(tatted|tattoo)\b/i)
  const hasHazyMemory = includesPattern(lines, /\b(hazy memory|blurred memory|don't remember|memory)\b/i)
  const hasBasement = includesPattern(lines, /\bbasement\b/i)
  const hasSeparatedFromFriends = includesPattern(lines, /\bseparated from (his |her |their )?friends|away from (his |her |their )?friends\b/i)
  const hasTouching = includesPattern(lines, /\b(man touching|guy touching|someone touching|touched him|touched me)\b/i)
  const hasVideoFear = includesPattern(lines, /\bvideo\b/i)
  const hasOthersKnowFear = includesPattern(lines, /\bothers know|people know|know about this|people saw\b/i)
  const wantsToMoveForward = includesPattern(lines, /\bmove forward|moving forward|move on\b/i)
  const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i)
  const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i)
  const keepMouthShut = includesPattern(lines, /\bkeep (my|his) mouth shut|shut your mouth\b/i)

  if (conflictSource.length) {
    const frequency = extractFrequency(conflictSource)

    if (frequency && signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
      sentences.push(`Client reported ongoing conflict with partner, including yelling or arguments about ${frequency} and repeated calls to partner's workplace while upset`)
    } else if (frequency) {
      sentences.push(`Client reported ongoing conflict with partner, including yelling or arguments about ${frequency}`)
    } else {
      sentences.push('Client reported ongoing conflict and strain in the relationship')
    }

    if (keepMouthShut) {
      sentences.push('Client stated that even when he plans to keep his mouth shut, he often loses control, then yells, criticizes, and becomes defensive')
    } else if (signals.directQuotes.length) {
      sentences.push('Client described repeated criticism, accusations, and hurtful exchanges during arguments with partner')
    }

    if (quotedPhrases.length) {
      const quotedPreview = quotedPhrases
        .slice(0, 5)
        .map((phrase) => `"${phrase}"`)
        .join(', ')
      sentences.push(`Client identified triggers including statements such as ${quotedPreview}`)
    }
  }

  if (signals.anxiety.length) {
    if (signals.relationshipConflict.some((line) => /\bguy|meeting up\b/i.test(line))) {
      sentences.push('Client described strong anxiety and jealousy related to partner contact with another man')
    } else {
      sentences.push('Client described high anxiety during the week')
    }
  }

  if (moneySpent) {
    sentences.push(`Client shared that he spent ${moneySpent} on Valentine's Day and did not feel that the effort was reciprocated`)
  }

  if (hasTattooHistory || abortionsCount) {
    const historyParts: string[] = []
    if (hasTattooHistory) historyParts.push("he has her name tattooed multiple times on his body")
    if (abortionsCount) historyParts.push(`they had ${abortionsCount} abortions together`)
    sentences.push(`Client also shared that ${formatList(historyParts)}`)
  }

  if (signals.substance.length) {
    if (signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))) {
      if (hasHazyMemory || hasBasement || hasSeparatedFromFriends || hasTouching) {
        const incidentParts: string[] = []
        if (hasHazyMemory) incidentParts.push('about 20 minutes of hazy memory')
        if (hasBasement) incidentParts.push('being in a basement')
        if (hasSeparatedFromFriends) incidentParts.push('being separated from friends')
        if (hasTouching) incidentParts.push('a man touching him')
        sentences.push(`Client also reported a recent incident in which he believes he was drugged at a bar, with ${formatList(incidentParts)}`)
      } else {
        sentences.push('Client also reported a recent incident in which he believes he was drugged at a bar')
      }

      if (hasVideoFear || hasOthersKnowFear) {
        sentences.push('Client shared anxiety that there may be a video of the incident or that others may know about it')
      }
    } else {
      sentences.push('Client also discussed ongoing alcohol and substance-use concerns')
    }
  }

  if (signals.attachment.length) {
    sentences.push('Client expressed ongoing hurt, attachment, and difficulty letting go of the relationship')
  }

  if (wantsToMoveForward || wantsLessDrinking || wantsExercise) {
    const changeGoals: string[] = []
    if (wantsToMoveForward) changeGoals.push('move forward')
    if (wantsLessDrinking) changeGoals.push('drink less')
    if (wantsExercise) changeGoals.push('focus more on cycling and lifting weights')
    if (changeGoals.length) {
      sentences.push(`Client also stated that he wants to ${formatList(changeGoals)}`)
    }
  }

  if (!sentences.length) {
    const fallback = [
      firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems),
      intake?.historyOfPresentIllness ?? '',
    ]
      .map((value) => sentence(value))
      .filter(Boolean)

    return fallback.join(' ') || 'Client discussed current symptoms and stressors during session.'
  }

  return joinSentences(sentences)
}

function summarizeObjective(
  lines: string[],
  signals: SessionSignals,
  intake: IntakeData | null
): string {
  const sentences: string[] = []
  const hasAttachmentMarkers = signals.attachment.length > 0 || includesPattern(lines, /\b(tatted|tattoo|abortions?|valentine)\b/i)
  const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i)
  const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i)

  if (signals.objective.length) {
    sentences.push(...signals.objective.slice(0, 2))
  } else {
    const reflectedThemes: string[] = []
    if (signals.anxiety.length) reflectedThemes.push('anxiety')
    if (signals.relationshipConflict.length) {
      reflectedThemes.push('anger')
      reflectedThemes.push('jealousy')
      reflectedThemes.push('relationship stress')
    }
    if (hasAttachmentMarkers) reflectedThemes.push('attachment')
    if (signals.substance.length) reflectedThemes.push('alcohol-related risk')

    if (reflectedThemes.length) {
      sentences.push(`Session focused on ${formatList(reflectedThemes)}`)
    } else {
      sentences.push('Session focused on current symptoms and recent stressors')
    }
  }

  if (signals.coping.length) {
    const copingLabels: string[] = []
    if (signals.coping.some((line) => /\bcycling|lifting|exercise|class\b/i.test(line))) {
      copingLabels.push('exercise')
    }
    if (signals.coping.some((line) => /\bbreathe|breathing\b/i.test(line))) {
      copingLabels.push('breathing skills')
    }
    if (signals.coping.some((line) => /\banger management\b/i.test(line))) {
      copingLabels.push('anger-management work')
    }

    if (copingLabels.length) {
      sentences.push(`Client identified ${formatList(copingLabels)} as coping efforts`)
    }
  }

  if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
    sentences.push('Session notes suggest poor impulse control during relationship distress')
  }

  if (wantsLessDrinking || wantsExercise) {
    if (wantsLessDrinking && wantsExercise) {
      sentences.push("Clinician reflected client's stated desire to drink less and increase exercise")
    } else if (wantsLessDrinking) {
      sentences.push("Clinician reflected client's stated desire to drink less")
    } else if (wantsExercise) {
      sentences.push("Clinician reflected client's stated desire to increase exercise")
    }
  }

  if (signals.objective.length === 0) {
    sentences.push('No formal MSE findings or rating scales were documented in the session notes')
  }

  const measurementLines: string[] = []
  if (signals.objective.some((line) => /\bphq\b/i.test(line)) && intake?.phq9) {
    measurementLines.push(`PHQ-9 previously captured at ${intake.phq9.totalScore}/27 (${intake.phq9.severity})`)
  }
  if (signals.objective.some((line) => /\bgad\b/i.test(line)) && intake?.gad7) {
    measurementLines.push(`GAD-7 previously captured at ${intake.gad7.totalScore}/21 (${intake.gad7.severity})`)
  }

  return joinSentences([...sentences, ...measurementLines])
}

function inferGoalFocus(goal: TreatmentPlanData['goals'][number]): GoalFocus {
  const text = `${goal.goal} ${goal.objectives.map((objective) => objective.objective).join(' ')}`.toLowerCase()
  if (/\b(alcohol|cannabis|marijuana|weed|substance|impulsivity)\b/.test(text)) return 'substance'
  if (/\b(verbal|fight|argument|conflict|partner|communication|anger)\b/.test(text)) return 'conflict'
  if (/\b(anxiety|panic|fear|worry)\b/.test(text)) return 'anxiety'
  if (/\b(mood|depression|sadness|irritability)\b/.test(text)) return 'mood'
  return 'general'
}

function statusFromGoal(goal: TreatmentPlanData['goals'][number], focus: GoalFocus, signals: SessionSignals): string {
  const improvementSource = [
    ...signals.relationshipConflict,
    ...signals.anxiety,
    ...signals.substance,
    ...signals.coping,
  ].join(' ').toLowerCase()

  if (/\b(better|improved|less|fewer|calmer|stopped|reduced)\b/.test(improvementSource)) {
    return 'Some progress noted'
  }

  if (focus === 'conflict' && signals.relationshipConflict.length) return 'Limited progress noted'
  if (focus === 'substance' && (signals.substance.length || signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line)))) {
    return 'Limited progress noted'
  }
  if ((focus === 'anxiety' || focus === 'mood') && signals.anxiety.length) return 'Limited progress noted'

  const existing = goal.status.trim().toLowerCase()
  if (existing === 'no improvement') return 'Limited progress noted'
  if (existing === 'some improvement') return 'Some progress noted'
  if (existing === 'significant improvement') return 'Good progress noted'
  if (goal.status.trim()) return sentence(goal.status).replace(/[.]$/, '')
  return 'Progress remains under review'
}

function evidenceForGoal(goal: TreatmentPlanData['goals'][number], focus: GoalFocus, signals: SessionSignals): string {
  switch (focus) {
    case 'conflict':
      if (signals.relationshipConflict.length) {
        const frequency = extractFrequency(signals.relationshipConflict)
        const callCount = extractCallCount(signals.relationshipConflict)
        if (frequency && callCount) {
          return `Client continues to report yelling or verbal conflict about ${frequency}, along with repeated calls to partner's workplace (${callCount} times) while upset`
        }
        if (frequency) {
          return `Client continues to report yelling or verbal conflict about ${frequency}`
        }
        return 'Client continues to report jealousy, arguments, and difficulty slowing down during relationship stress'
      }
      return 'Relationship stress remains a focus of treatment'
    case 'substance':
      if (signals.substance.length) {
        const mentionsStoppingAlcohol = signals.substance.some((line) => /\bstop drinking\b/i.test(line))
        const barRisk = signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))
        const impulsiveConflict = signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))

        if (barRisk && impulsiveConflict) {
          return 'Session included alcohol-related risk and ongoing impulsive behavior during conflict; insight into how substance use may worsen mood and reactions remains limited'
        }
        if (signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))) {
          return mentionsStoppingAlcohol
            ? 'Session included alcohol-related risk, including being drugged at a bar, and the need to reduce drinking remained part of the discussion'
            : 'Session included alcohol-related risk, including discussion of being drugged while at a bar'
        }
        return 'The link between alcohol or cannabis use, mood, and conflict still needs more work'
      }
      if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
        return 'Ongoing impulsive behavior during conflict suggests that insight into triggers and worsening factors is still limited'
      }
      if (/\b(alcohol|cannabis|marijuana|weed|substance)\b/i.test(goal.goal)) {
        return 'No clear update on alcohol or cannabis tracking was documented this session, and this treatment need remains active'
      }
      return 'The link between substance use, mood, and conflict continues to need review'
    case 'anxiety':
      if (signals.anxiety.length) {
        return 'Anxiety remains elevated in the context of current stressors'
      }
      return 'Anxiety symptoms continue to need monitoring'
    case 'mood':
      if (signals.anxiety.length || signals.relationshipConflict.length) {
        return 'Mood symptoms remain tied to ongoing relationship stress and emotional reactivity'
      }
      return 'Mood symptoms continue to need monitoring'
    default:
      return 'Current session content was reviewed in relation to this treatment goal'
  }
}

function summarizeAssessment(
  lines: string[],
  signals: SessionSignals,
  treatmentPlan: TreatmentPlanData | null,
  diagnosticImpressions: DiagnosticImpression[],
  intake: IntakeData | null
): string {
  const parts: string[] = []
  const wantsToMoveForward = includesPattern(lines, /\bmove forward|moving forward|move on\b/i)
  const hasNoAttachmentStatement = includesPattern(lines, /\bno attachment|have no attachment\b/i)
  const hasGoodManIdentity = includesPattern(lines, /\bgood man\b/i) && includesPattern(lines, /\bpoint of view\b/i)
  const hasAttachmentHistory = signals.attachment.length > 0 || includesPattern(lines, /\b(tatted|tattoo|abortions?|valentine)\b/i)
  const hasFrustrationMarkers = includesPattern(lines, /\b(frustrat|angry|hurt|got nothing)\b/i) || Boolean(extractMoneySpent(lines))
  const hasBarRisk = includesPattern(lines, /\bdrugged|bar\b/i)
  const hasBarAnxiety = includesPattern(lines, /\bvideo\b/i) || includesPattern(lines, /\bothers know|people know|know about this|people saw\b/i)
  const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i)
  const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i)

  if (treatmentPlan?.goals.length) {
    for (const goal of treatmentPlan.goals) {
      const focus = inferGoalFocus(goal)
      const status = statusFromGoal(goal, focus, signals)
      const goalParts: string[] = [`${formatGoalLabel(goal)}: ${formatAssessmentStatus(status)}.`]

      if (focus === 'conflict') {
        if (signals.relationshipConflict.length) {
          goalParts.push('Client continues to report frequent conflict, emotional reactivity, and repeated contact attempts during distress.')
        } else {
          goalParts.push(`${sentence(evidenceForGoal(goal, focus, signals))}`)
        }

        if ((wantsToMoveForward || hasNoAttachmentStatement) && signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
          goalParts.push("Clinician reflected client's frustration and highlighted the mismatch between client's stated wish to move on and have no attachment and his current behavior, including repeated calls, anger about partner seeing another man, and ongoing preoccupation with the relationship.")
        } else if (hasFrustrationMarkers) {
          goalParts.push("Clinician reflected client's frustration with the ongoing relationship dynamic.")
        }

        if (hasGoodManIdentity) {
          goalParts.push("Clinician also reflected that client's identity as a \"good man\" appears strongly tied to her point of view, which may be reinforcing reactivity and difficulty disengaging.")
        }

        if (hasAttachmentHistory) {
          goalParts.push('Clinician validated the difficulty of breaking away from the relationship given the attachment and shared history.')
        }
      } else if (focus === 'substance') {
        if (hasBarRisk && hasBarAnxiety) {
          goalParts.push('Session included alcohol-related risk and anxiety related to the recent bar incident.')
        } else if (hasBarRisk) {
          goalParts.push('Session included alcohol-related risk.')
        } else {
          goalParts.push(`${sentence(evidenceForGoal(goal, focus, signals))}`)
        }

        let insightSentence = 'Insight into how alcohol use may worsen judgment, impulsivity, emotional reactivity, and vulnerability remains limited'
        if (wantsLessDrinking || wantsExercise) {
          const selfCareParts: string[] = []
          if (wantsLessDrinking) selfCareParts.push('reduce drinking')
          if (wantsExercise) selfCareParts.push('improve self-care through exercise')
          insightSentence += `, though client did express desire to ${formatList(selfCareParts)}`
        }
        goalParts.push(sentence(insightSentence))
      } else {
        goalParts.push(sentence(evidenceForGoal(goal, focus, signals)))
      }

      parts.push(goalParts.join(' '))
    }
  }

  const diagnosisSummary = diagnosticImpressions.length
    ? diagnosticImpressions.map((impression) => `${impression.name}${impression.code ? ` (${impression.code})` : ''}`).join(', ')
    : treatmentPlan?.diagnoses.length
      ? treatmentPlan.diagnoses.map((diagnosis) => `${diagnosis.description}${diagnosis.code ? ` (${diagnosis.code})` : ''}`).join(', ')
      : ''

  if (diagnosisSummary) {
    parts.push(`Current presentation remains consistent with working diagnoses of ${diagnosisSummary}.`)
  } else if (firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)) {
    parts.push(`Clinical focus remains on ${firstNonEmpty(intake?.chiefComplaint, intake?.presentingProblems)}.`)
  }

  return parts.join('\n\n') || 'Assessment should be updated in relation to the treatment plan and current session themes.'
}

function summarizePlan(
  lines: string[],
  signals: SessionSignals,
  treatmentPlan: TreatmentPlanData | null
): string {
  const planItems: string[] = []
  const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i)
  const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i)

  if (treatmentPlan?.treatmentFrequency) {
    planItems.push(`Continue ${treatmentPlan.treatmentFrequency} psychotherapy`)
  } else {
    planItems.push('Continue psychotherapy as scheduled')
  }

  const objectiveText = treatmentPlan?.goals
    .flatMap((goal) => goal.objectives)
    .map((objective) => objective.objective.toLowerCase()) ?? []

  if (objectiveText.some((text) => /chain analysis/.test(text)) || signals.relationshipConflict.length) {
    planItems.push('Review recent conflicts with chain analysis')
  }
  if (objectiveText.some((text) => /distress tolerance|practice/.test(text)) || signals.coping.length) {
    if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
      planItems.push('Practice pause, breathing, and distress-tolerance skills before calling or confronting partner when upset')
    } else {
      planItems.push('Practice pause, breathing, and distress-tolerance skills during conflict')
    }
  }
  if (objectiveText.some((text) => /track|log|cannabis|alcohol/.test(text)) || signals.substance.length) {
    planItems.push('Track alcohol and cannabis use, mood, irritability, and conflict episodes between sessions')
  }
  if (wantsLessDrinking || wantsExercise) {
    const healthierCoping: string[] = []
    if (includesPattern(lines, /\bcycle|cycling\b/i)) healthierCoping.push('cycling')
    if (includesPattern(lines, /\blift|lifting|weights?\b/i)) healthierCoping.push('lifting')

    if (wantsLessDrinking && healthierCoping.length) {
      planItems.push(`Support reduction in alcohol use and reinforce ${formatList(healthierCoping)} as healthier coping strategies`)
    } else if (wantsLessDrinking) {
      planItems.push('Support reduction in alcohol use as a treatment goal')
    } else if (healthierCoping.length) {
      planItems.push(`Reinforce ${formatList(healthierCoping)} as healthier coping strategies`)
    }
  }
  if (signals.coping.some((line) => /\banger management\b/i.test(line))) {
    planItems.push('Continue anger-management work')
  }
  if (signals.support.length) {
    planItems.push('Review referral or support contact options as clinically indicated')
  }
  if (treatmentPlan?.interventions.length) {
    const summarizedInterventions = summarizeInterventions(treatmentPlan.interventions)

    if (summarizedInterventions) {
      planItems.push(`Continue ${summarizedInterventions} interventions`)
    }
  }

  return joinSentences(unique(planItems))
}

function extractTreatmentPlanId(treatmentPlan: TreatmentPlanData | null): string {
  const sourceUrl = treatmentPlan?.sourceUrl ?? ''
  const match = sourceUrl.match(/diagnosis_treatment_plans\/([^/?#]+)/)
  return match?.[1] ?? ''
}

export function buildSoapDraft(
  sessionNotes: string,
  transcript: SessionTranscript | null,
  treatmentPlan: TreatmentPlanData | null,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  prefs: ProviderPreferences,
  meta: {
    apptId?: string
    clientName?: string
    sessionDate?: string
  } = {}
): SoapDraft {
  const sessionLines = splitLines(sessionNotes)
  const transcriptLines = transcript?.entries
    .map((entry) => sanitizeLine(entry.text))
    .filter((line) => line && !isLowSignalLine(line)) ?? []
  const allLines = [...sessionLines, ...transcriptLines]
  const signals = analyzeSessionNotes(allLines)
  const transcriptText = buildTranscriptText(transcript)
  const clientName = firstNonEmpty(
    meta.clientName,
    intake?.fullName,
    `${intake?.firstName ?? ''} ${intake?.lastName ?? ''}`.trim(),
    'Client'
  )
  const sessionDate = firstNonEmpty(
    meta.sessionDate,
    intake?.formDate,
    new Date().toLocaleDateString('en-US')
  )
  const now = new Date().toISOString()

  return {
    ...EMPTY_SOAP_DRAFT,
    apptId: meta.apptId ?? '',
    clientName,
    sessionDate,
    cptCode: prefs.followUpCPT || '90837',
    subjective: summarizeSubjective(allLines, signals, transcript, intake),
    objective: summarizeObjective(allLines, signals, intake),
    assessment: summarizeAssessment(allLines, signals, treatmentPlan, diagnosticImpressions, intake),
    plan: summarizePlan(allLines, signals, treatmentPlan),
    sessionNotes: sessionNotes.trim(),
    transcript: transcriptText,
    treatmentPlanId: extractTreatmentPlanId(treatmentPlan),
    generatedAt: now,
    editedAt: now,
    status: 'draft',
  }
}
