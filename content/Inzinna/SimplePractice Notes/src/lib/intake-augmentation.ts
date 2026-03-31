import { IntakeData } from './types'

const OCCUPATION_PATTERN = /\b(software engineer|engineer|developer|teacher|student|manager|analyst|nurse|doctor|physician|therapist|consultant|designer|lawyer|attorney|accountant|entrepreneur|founder|product manager|project manager)\b/i

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitLines(notes: string): string[] {
  return notes
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
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

function collectMatchingLines(lines: string[], pattern: RegExp, limit = 4): string[] {
  return unique(lines.filter((line) => pattern.test(line))).slice(0, limit)
}

function joinLines(lines: string[]): string {
  return unique(lines).join('\n')
}

function extractHeaderName(lines: string[]): Partial<IntakeData> {
  for (const line of lines.slice(0, 4)) {
    const match = line.match(/^(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})$/)
    if (!match) continue

    const fullName = match[1].trim()
    const [firstName, ...rest] = fullName.split(/\s+/)
    return {
      fullName,
      firstName,
      lastName: rest.join(' '),
    }
  }

  return {}
}

function extractSex(notes: string): Partial<IntakeData> {
  const match = notes.match(/\b(?:\d{1,2}\s*(?:yo|year old)[-\s]*)?(male|female|man|woman)\b/i)
  if (!match) return {}

  const normalized = /female|woman/i.test(match[1]) ? 'female' : 'male'
  return {
    sex: normalized,
    genderIdentity: normalized,
  }
}

function extractOccupation(lines: string[]): Partial<IntakeData> {
  const lineMatch = lines.find((line) => OCCUPATION_PATTERN.test(line))
  if (!lineMatch) return {}

  const phraseMatch = lineMatch.match(OCCUPATION_PATTERN)
  const occupation = normalizeWhitespace(phraseMatch?.[1] ?? lineMatch).replace(/[.]+$/, '')
  return occupation ? { occupation } : {}
}

function extractSurgeries(lines: string[]): Partial<IntakeData> {
  const surgeries = joinLines(
    collectMatchingLines(lines, /\b(surger(?:y|ies)|acl|labrum|meniscus|rotator cuff)\b/i, 3)
  )
  return surgeries ? { surgeries } : {}
}

function extractMedicalHistory(lines: string[]): Partial<IntakeData> {
  const medicalHistory = joinLines(
    collectMatchingLines(
      lines,
      /\b(ankle|snowboard|foot|walk|pain|injur|stomach|nausea|queasy|abdominal|head|foggy|fogginess|acl|labrum)\b/i,
      6
    )
  )
  return medicalHistory ? { medicalHistory } : {}
}

function extractSleep(lines: string[]): Partial<IntakeData> {
  const troubleSleeping = joinLines(
    collectMatchingLines(lines, /\b(insomnia|trouble falling asleep|hard to fall asleep|sleep disturbance|sleep was fine|nightmares?)\b/i, 4)
  )
  return troubleSleeping ? { troubleSleeping } : {}
}

function extractTbi(lines: string[]): Partial<IntakeData> {
  const tbiLoc = joinLines(
    collectMatchingLines(lines, /\b(head|loc|loss of consciousness|concussion|conscious the whole time|didn.?t hit head|foggy|fogginess)\b/i, 4)
  )
  return tbiLoc ? { tbiLoc } : {}
}

function extractPriorTreatment(lines: string[]): Partial<IntakeData> {
  const priorTreatment = joinLines(
    collectMatchingLines(lines, /\b(took med|medication|therap|coaching|2018)\b/i, 4)
  )
  return priorTreatment ? { priorTreatment } : {}
}

function extractCounselingGoals(lines: string[]): Partial<IntakeData> {
  const counselingGoals = joinLines(
    collectMatchingLines(lines, /\b(want to|want better|meet regularly|more actionable|cope|cbt|dynamic|act)\b/i, 6)
  )
  return counselingGoals ? { counselingGoals } : {}
}

function extractRecentSymptoms(lines: string[]): Partial<IntakeData> {
  const recentSymptoms = joinLines(
    collectMatchingLines(
      lines,
      /\b(anxious|anxiety|insomnia|stomach pain|queasy|nausea|flashback|dissociation|foggy|fogginess|trouble concentrating|sleep disturbance|hopelessness|shock)\b/i,
      8
    )
  )
  return recentSymptoms ? { recentSymptoms } : {}
}

function extractChiefComplaint(notes: string): Partial<IntakeData> {
  const parts: string[] = []

  if (/\b(plane|airplane|flight).*(crash|accident)|hit fire truck|emergency exit\b/i.test(notes)) {
    parts.push('Trauma-related anxiety after airplane accident')
  } else if (/\b(accident|trauma)\b/i.test(notes)) {
    parts.push('Trauma-related symptoms after recent accident')
  }

  if (/\b(anxiety|anxious|overwhelmed|uneasiness|worry)\b/i.test(notes)) {
    parts.push('Anxiety and excessive worry')
  }

  if (/\b(insomnia|trouble falling asleep|sleep disturbance)\b/i.test(notes)) {
    parts.push('Sleep disturbance')
  }

  if (/\b(nausea|queasy|stomach pain|abdominal)\b/i.test(notes)) {
    parts.push('Nausea and stomach discomfort')
  }

  if (/\b(dissociation|foggy|fogginess|trouble concentrating|concentrating)\b/i.test(notes)) {
    parts.push('Concentration problems and fogginess')
  }

  if (/\b(hopelessness|hopeless)\b/i.test(notes)) {
    parts.push('Hopelessness')
  }

  const chiefComplaint = parts.join('; ')
  return chiefComplaint ? { chiefComplaint } : {}
}

export function deriveIntakeFromManualNotes(notes: string): Partial<IntakeData> {
  const trimmedNotes = notes.trim()
  if (!trimmedNotes) return {}

  const lines = splitLines(trimmedNotes)

  return {
    ...extractHeaderName(lines),
    ...extractSex(trimmedNotes),
    ...extractOccupation(lines),
    ...extractChiefComplaint(trimmedNotes),
    ...extractSurgeries(lines),
    ...extractMedicalHistory(lines),
    ...extractSleep(lines),
    ...extractTbi(lines),
    ...extractPriorTreatment(lines),
    ...extractCounselingGoals(lines),
    ...extractRecentSymptoms(lines),
  }
}

function pickString(primary: string, fallback?: string): string {
  return primary.trim() || fallback?.trim() || ''
}

export function augmentIntakeWithManualNotes(intake: IntakeData): IntakeData {
  if (!intake.manualNotes.trim()) return intake

  const derived = deriveIntakeFromManualNotes(intake.manualNotes)

  return {
    ...intake,
    fullName: pickString(intake.fullName, derived.fullName),
    firstName: pickString(intake.firstName, derived.firstName),
    lastName: pickString(intake.lastName, derived.lastName),
    sex: pickString(intake.sex, derived.sex),
    genderIdentity: pickString(intake.genderIdentity, derived.genderIdentity),
    chiefComplaint: pickString(intake.chiefComplaint, derived.chiefComplaint),
    counselingGoals: pickString(intake.counselingGoals, derived.counselingGoals),
    priorTreatment: pickString(intake.priorTreatment, derived.priorTreatment),
    medicalHistory: pickString(intake.medicalHistory, derived.medicalHistory),
    surgeries: pickString(intake.surgeries, derived.surgeries),
    troubleSleeping: pickString(intake.troubleSleeping, derived.troubleSleeping),
    tbiLoc: pickString(intake.tbiLoc, derived.tbiLoc),
    occupation: pickString(intake.occupation, derived.occupation),
    recentSymptoms: pickString(intake.recentSymptoms, derived.recentSymptoms),
  }
}
