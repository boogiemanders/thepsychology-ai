/**
 * De-identification engine for PHI.
 * Replaces personally-identifiable information with tokens before sending to cloud APIs.
 * Re-identifies tokens back to real values after receiving the response.
 *
 * PHI categories stripped:
 * - Client name → [CLIENT_1]
 * - DOB → [DOB_1]
 * - Exact dates → [DATE_1], [DATE_2], ...
 * - Address/location → [LOCATION_1]
 * - Phone/email → stripped entirely
 * - Employer → [EMPLOYER_1]
 * - MRN/member ID → stripped entirely
 * - Insurance → stripped entirely
 * - Emergency contact → stripped entirely
 *
 * Uses intake data fields + regex patterns — no LLM needed for detection.
 * Mapping stored in chrome.storage.session (auto-deleted on browser close).
 */

import { IntakeData } from './types'
import { FIRST_NAMES, AMBIGUOUS_NAMES } from './first-names'

export interface DeidentifyMapping {
  [token: string]: string
}

export interface DeidentifyResult {
  sanitized: string
  mapping: DeidentifyMapping
}

/**
 * Build a list of PHI patterns to replace from intake data.
 * Returns patterns sorted longest-first to avoid partial replacements.
 */
function buildPhiPatterns(intake: IntakeData): Array<{ pattern: string; token: string }> {
  const patterns: Array<{ pattern: string; token: string }> = []
  let dateCounter = 0

  function addIfPresent(value: string | undefined, token: string): void {
    const trimmed = value?.trim()
    if (!trimmed || trimmed.length < 2) return
    // Skip generic/negative values
    if (/^(no|none|n\/a|na|denied|denies|negative|yes|y)$/i.test(trimmed)) return
    patterns.push({ pattern: trimmed, token })
  }

  // Client name — full name and individual parts
  const fullName = [intake.firstName, intake.lastName].filter(Boolean).join(' ').trim()
  if (fullName) addIfPresent(fullName, '[CLIENT_1]')
  if (intake.fullName && intake.fullName !== fullName) addIfPresent(intake.fullName, '[CLIENT_1]')
  if (intake.firstName && intake.firstName.length >= 2) addIfPresent(intake.firstName, '[CLIENT_FIRST]')
  if (intake.lastName && intake.lastName.length >= 2) addIfPresent(intake.lastName, '[CLIENT_LAST]')

  // DOB
  if (intake.dob) {
    addIfPresent(intake.dob, '[DOB_1]')
    // Also match common reformats of the DOB
    const dobDate = new Date(intake.dob)
    if (!Number.isNaN(dobDate.getTime())) {
      const isoDate = dobDate.toISOString().split('T')[0]
      addIfPresent(isoDate, '[DOB_1]')
      // MM/DD/YYYY format
      const mmddyyyy = `${String(dobDate.getMonth() + 1).padStart(2, '0')}/${String(dobDate.getDate()).padStart(2, '0')}/${dobDate.getFullYear()}`
      addIfPresent(mmddyyyy, '[DOB_1]')
    }
  }

  // Address components
  if (intake.address.raw) addIfPresent(intake.address.raw, '[LOCATION_1]')
  if (intake.address.street) addIfPresent(intake.address.street, '[LOCATION_STREET]')
  if (intake.address.city && intake.address.city.length >= 3) addIfPresent(intake.address.city, '[LOCATION_CITY]')
  if (intake.address.zip) addIfPresent(intake.address.zip, '[LOCATION_ZIP]')

  // Phone — strip entirely (replace with empty)
  if (intake.phone) addIfPresent(intake.phone, '[PHONE_STRIPPED]')

  // Email — strip entirely
  if (intake.email) addIfPresent(intake.email, '[EMAIL_STRIPPED]')

  // Emergency contact
  if (intake.emergencyContact) addIfPresent(intake.emergencyContact, '[EMERGENCY_CONTACT_STRIPPED]')

  // Insurance
  if (intake.insuranceCompany) addIfPresent(intake.insuranceCompany, '[INSURANCE_STRIPPED]')
  if (intake.memberId) addIfPresent(intake.memberId, '[MRN_STRIPPED]')
  if (intake.groupNumber) addIfPresent(intake.groupNumber, '[GROUP_STRIPPED]')

  // Employer/occupation — keep as general context, but replace if it's specific enough to be identifying
  if (intake.occupation && intake.occupation.length > 20) {
    addIfPresent(intake.occupation, '[EMPLOYER_1]')
  }

  // Form metadata
  if (intake.signedBy) addIfPresent(intake.signedBy, '[PROVIDER_1]')

  // Dates from form
  if (intake.formDate) {
    dateCounter++
    addIfPresent(intake.formDate, `[DATE_${dateCounter}]`)
  }
  if (intake.signedAt) {
    dateCounter++
    addIfPresent(intake.signedAt, `[DATE_${dateCounter}]`)
  }

  // Client ID from URL
  if (intake.clientId) addIfPresent(intake.clientId, '[CLIENT_ID_STRIPPED]')

  // Prescribing MD and PCP names (could be identifying)
  if (intake.prescribingMD) addIfPresent(intake.prescribingMD, '[PROVIDER_MD]')
  if (intake.primaryCarePhysician) addIfPresent(intake.primaryCarePhysician, '[PROVIDER_PCP]')

  // Sort longest-first so "John Smith" is replaced before "John"
  patterns.sort((a, b) => b.pattern.length - a.pattern.length)

  return patterns
}

// Regex patterns for common PHI formats that may not be in intake fields
const DATE_PATTERN = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\w+ \d{1,2},?\s*\d{4})\b/g
const PHONE_PATTERN = /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
const SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g

/**
 * De-identify text by replacing PHI with tokens.
 * Returns the sanitized text and a mapping for re-identification.
 */
export function deidentify(text: string, intake: IntakeData | null): DeidentifyResult {
  if (!text) return { sanitized: '', mapping: {} }

  const mapping: DeidentifyMapping = {}
  let sanitized = text

  // Step 1: Replace known PHI from intake data (exact string matches)
  if (intake) {
    const patterns = buildPhiPatterns(intake)
    for (const { pattern, token } of patterns) {
      // Case-insensitive replacement of exact strings
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'gi')
      if (regex.test(sanitized)) {
        // Only add to mapping if not a "stripped" token (those get removed, not re-identified)
        if (!token.includes('STRIPPED')) {
          mapping[token] = pattern
        }
        sanitized = sanitized.replace(regex, token)
      }
    }
  }

  // Step 2: Regex-based patterns for residual PHI
  let dateCounter = Object.keys(mapping).filter((k) => k.startsWith('[DATE_')).length

  // Dates not already tokenized
  sanitized = sanitized.replace(DATE_PATTERN, (match) => {
    // Skip tokens we already placed
    if (match.startsWith('[')) return match
    dateCounter++
    const token = `[DATE_${dateCounter}]`
    mapping[token] = match
    return token
  })

  // Phone numbers
  sanitized = sanitized.replace(PHONE_PATTERN, '[PHONE_STRIPPED]')

  // Email addresses
  sanitized = sanitized.replace(EMAIL_PATTERN, '[EMAIL_STRIPPED]')

  // SSNs
  sanitized = sanitized.replace(SSN_PATTERN, '[SSN_STRIPPED]')

  // Step 3: Scrub unknown first names mentioned in the text (partners, kids,
  // co-workers, etc. that aren't in intake). Only matches capitalized tokens
  // against a curated dictionary to avoid false positives on lowercase words.
  let personCounter = 0
  const personTokenByName: Record<string, string> = {}
  sanitized = sanitized.replace(/\b[A-Z][a-z]{1,19}\b/g, (match) => {
    const lower = match.toLowerCase()
    if (AMBIGUOUS_NAMES.has(lower)) return match
    if (!FIRST_NAMES.has(lower)) return match
    if (personTokenByName[lower]) return personTokenByName[lower]
    personCounter++
    const token = `[PERSON_${personCounter}]`
    personTokenByName[lower] = token
    mapping[token] = match
    return token
  })

  // Clean up: remove stripped tokens (they leave no trace)
  sanitized = sanitized
    .replace(/\[PHONE_STRIPPED\]/g, '')
    .replace(/\[EMAIL_STRIPPED\]/g, '')
    .replace(/\[SSN_STRIPPED\]/g, '')
    .replace(/\[MRN_STRIPPED\]/g, '')
    .replace(/\[GROUP_STRIPPED\]/g, '')
    .replace(/\[INSURANCE_STRIPPED\]/g, '')
    .replace(/\[EMERGENCY_CONTACT_STRIPPED\]/g, '')
    .replace(/\[CLIENT_ID_STRIPPED\]/g, '')
    // Clean up double spaces left by stripping
    .replace(/\s{2,}/g, ' ')
    .trim()

  return { sanitized, mapping }
}

/**
 * Re-identify tokens in text back to real values using the mapping.
 */
export function reidentify(text: string, mapping: DeidentifyMapping): string {
  if (!text || !Object.keys(mapping).length) return text

  let result = text
  // Replace tokens longest-first to avoid partial matches
  const tokens = Object.keys(mapping).sort((a, b) => b.length - a.length)
  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), mapping[token])
  }

  return result
}

/**
 * Save de-identification mapping to session storage (auto-deleted on browser close).
 */
export async function saveDeidentifyMapping(mapping: DeidentifyMapping): Promise<void> {
  await chrome.storage.session.set({ spn_deid_mapping: mapping })
}

/**
 * Retrieve de-identification mapping from session storage.
 */
export async function getDeidentifyMapping(): Promise<DeidentifyMapping | null> {
  const result = await chrome.storage.session.get('spn_deid_mapping')
  return (result.spn_deid_mapping as DeidentifyMapping) ?? null
}

/**
 * Clear de-identification mapping from session storage.
 */
export async function clearDeidentifyMapping(): Promise<void> {
  await chrome.storage.session.remove('spn_deid_mapping')
}
