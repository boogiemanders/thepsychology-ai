// Single source of truth for the .edu student offer.
// A .edu (or international academic) email at signup unlocks a full month
// free trial instead of the standard 7 days. Used client-side to show the
// offer live on the signup form, and server-side to actually grant the days.

// Matches: anything.edu, plus international academic domains like
// .ac.uk, .edu.au, .ac.nz, .edu.ca, etc.
const ACADEMIC_DOMAIN = /(?:\.edu|\.(?:ac|edu)\.[a-z]{2,})$/i

export function isEduEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const at = email.lastIndexOf("@")
  if (at === -1) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain) return false
  return ACADEMIC_DOMAIN.test(domain)
}

// Trial lengths in days. Keep these as the only place these numbers live.
export const STANDARD_TRIAL_DAYS = 7
export const EDU_TRIAL_DAYS = 30

export function trialDaysForEmail(email: string | null | undefined): number {
  return isEduEmail(email) ? EDU_TRIAL_DAYS : STANDARD_TRIAL_DAYS
}
