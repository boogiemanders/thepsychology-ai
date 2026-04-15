/**
 * Builds LLM prompts for supervision prep generation from session data.
 * Combines clinical context (intake, diagnoses, treatment plan, MSE)
 * with the session transcript into a structured supervision agenda prompt.
 */

import { IntakeData, DiagnosticImpression, TreatmentPlanData, MseChecklist, SessionTranscript, ProviderPreferences } from './types'

const MAX_TRANSCRIPT_WORDS = 4_000
const MAX_TOTAL_PROMPT_CHARS = 36_000

const SYSTEM_PROMPT = `You are a clinical supervision preparation assistant for a licensed psychologist. Generate a supervision prep agenda from session data and clinical context.

OUTPUT FORMAT: Return a valid JSON object with exactly four string keys:
{"caseSummary":"...","discussionQuestions":"...","blindSpotFlags":"...","modalityPrompts":"..."}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.

SECTION REQUIREMENTS:

caseSummary: A 3-5 sentence anonymized case summary. Use "Client" instead of the client's name. Include presenting problems, active diagnoses, treatment modality, and current phase of treatment. Ground every sentence in data from the intake, treatment plan, or session content.

discussionQuestions: 3-5 questions for supervision discussion. Each question MUST cite a specific observation from the session transcript or session notes. Frame as open-ended clinical questions (e.g., "Client reported X during session — how might this inform..."). Questions should surface decision points, clinical dilemmas, or areas where the clinician wants input.

blindSpotFlags: 2-4 potential blind spots or areas the clinician may not be considering. Each blind spot MUST reference a specific data point from the intake, diagnoses, treatment plan, MSE, or transcript. Frame as considerations, not conclusions (e.g., "Client's history of X combined with current presentation of Y may warrant consideration of...").

modalityPrompts: 2-3 modality-specific prompts tied to the active treatment modalities listed in the treatment plan. Each prompt should connect the session content to a specific technique or framework from that modality (e.g., for CBT: "Client's automatic thought about X could be examined using a thought record..."). If no treatment modalities are specified, generate prompts based on evidence-based approaches relevant to the active diagnoses.

STYLE RULES:
- Frame everything as questions or considerations, NOT recommendations.
- This is a thinking aid to help the clinician prepare for supervision. Not a substitute for clinical supervision.
- Use "Client" throughout — never use the client's actual name.
- Be specific and grounded in session data — avoid generic supervision questions.
- Use plain clinical language, not academic or literary prose.`

export function buildSupervisionPrompt(
  transcript: SessionTranscript | null,
  sessionNotes: string,
  intake: IntakeData | null,
  diagnosticImpressions: DiagnosticImpression[],
  treatmentPlan: TreatmentPlanData | null,
  mseChecklist: MseChecklist | null,
  prefs: ProviderPreferences
): { system: string; user: string } {
  const sections: string[] = []

  // === PATIENT CONTEXT ===
  if (intake) {
    const contextLines: string[] = []
    const name = [intake.firstName, intake.lastName].filter(Boolean).join(' ') || intake.fullName || 'Client'
    contextLines.push(`Client: ${name}`)
    if (intake.dob) contextLines.push(`DOB: ${intake.dob}`)
    if (intake.sex) contextLines.push(`Sex: ${intake.sex}`)
    if (intake.genderIdentity) contextLines.push(`Gender identity: ${intake.genderIdentity}`)
    if (intake.race || intake.ethnicity) contextLines.push(`Race/ethnicity: ${[intake.race, intake.ethnicity].filter(Boolean).join(', ')}`)
    if (intake.occupation) contextLines.push(`Occupation: ${intake.occupation}`)
    if (intake.livingArrangement) contextLines.push(`Living arrangement: ${intake.livingArrangement}`)
    if (intake.maritalStatus) contextLines.push(`Marital status: ${intake.maritalStatus}`)
    if (intake.medications) contextLines.push(`Current medications: ${intake.medications}`)
    if (intake.chiefComplaint) contextLines.push(`Chief complaint (from intake): ${intake.chiefComplaint}`)
    if (intake.suicidalIdeation) contextLines.push(`SI history: ${intake.suicidalIdeation}`)
    if (intake.homicidalIdeation) contextLines.push(`HI history: ${intake.homicidalIdeation}`)
    if (intake.substanceUseHistory) contextLines.push(`Substance use: ${intake.substanceUseHistory}`)
    if (intake.medicalHistory) contextLines.push(`Medical history: ${intake.medicalHistory}`)
    if (intake.surgeries) contextLines.push(`Surgeries: ${intake.surgeries}`)
    if (intake.tbiLoc) contextLines.push(`TBI/LOC: ${intake.tbiLoc}`)

    if (contextLines.length > 1) {
      sections.push(`=== PATIENT CONTEXT ===\n${contextLines.join('\n')}`)
    }
  }

  // === ACTIVE DIAGNOSES ===
  if (diagnosticImpressions.length > 0) {
    const diagLines = diagnosticImpressions.map((d) => {
      const parts = [`${d.code} ${d.name} (${d.confidence} confidence)`]
      if (d.diagnosticReasoning) parts.push(`  Reasoning: ${d.diagnosticReasoning}`)
      return parts.join('\n')
    })
    sections.push(`=== ACTIVE DIAGNOSES ===\n${diagLines.join('\n')}`)
  }

  // === TREATMENT PLAN ===
  if (treatmentPlan && treatmentPlan.goals.length > 0) {
    const tpLines: string[] = []
    if (treatmentPlan.treatmentFrequency) tpLines.push(`Frequency: ${treatmentPlan.treatmentFrequency}`)
    if (treatmentPlan.treatmentType) tpLines.push(`Type: ${treatmentPlan.treatmentType}`)
    for (const goal of treatmentPlan.goals) {
      tpLines.push(`Goal ${goal.goalNumber}: ${goal.goal} (Status: ${goal.status || 'active'})`)
      for (const obj of goal.objectives) {
        tpLines.push(`  ${obj.id}: ${obj.objective}`)
      }
    }
    if (treatmentPlan.interventions.length > 0) {
      tpLines.push(`Interventions: ${treatmentPlan.interventions.join('; ')}`)
    }
    sections.push(`=== TREATMENT PLAN ===\n${tpLines.join('\n')}`)
  }

  // === MSE CHECKLIST ===
  if (mseChecklist) {
    const mseLines: string[] = []
    const fmt = (label: string, values: string[]) => {
      if (values.length > 0) mseLines.push(`${label}: ${values.join(', ')}`)
    }
    fmt('Appearance', mseChecklist.appearance)
    fmt('Behavior', mseChecklist.behavior)
    fmt('Speech', mseChecklist.speech)
    if (mseChecklist.mood) mseLines.push(`Mood (client's words): "${mseChecklist.mood}"`)
    fmt('Affect', mseChecklist.affect)
    fmt('Thought process', mseChecklist.thoughtProcess)
    fmt('Thought content', mseChecklist.thoughtContent)
    fmt('Perceptions', mseChecklist.perceptions)
    fmt('Cognition', mseChecklist.cognition)
    if (mseChecklist.insight) mseLines.push(`Insight: ${mseChecklist.insight}`)
    if (mseChecklist.judgment) mseLines.push(`Judgment: ${mseChecklist.judgment}`)
    sections.push(`=== MSE CHECKLIST (clinician observations) ===\n${mseLines.join('\n')}`)
  }

  // === CLINICIAN SESSION NOTES ===
  const trimmedNotes = sessionNotes.trim()
  if (trimmedNotes) {
    sections.push(`=== CLINICIAN SESSION NOTES ===\n${trimmedNotes}`)
  }

  // === SESSION TRANSCRIPT ===
  if (transcript && transcript.entries.length > 0) {
    const transcriptText = formatTranscript(transcript, prefs)
    sections.push(`=== SESSION TRANSCRIPT ===\n${transcriptText}`)
  }

  // === INSTRUCTIONS ===
  const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(' ') || 'Clinician'
  sections.push(
    `=== INSTRUCTIONS ===\nGenerate a supervision prep agenda for this session. The treating clinician is ${providerName}. ` +
      `Use "Client" instead of the client's name in all output. ` +
      `Each discussion question must reference specific session content. ` +
      `Each blind spot must cite a data point. ` +
      `Return ONLY valid JSON with keys: caseSummary, discussionQuestions, blindSpotFlags, modalityPrompts.`
  )

  let userPrompt = sections.join('\n\n')

  // Final safety: if the total prompt is still too large, trim the transcript section
  if (userPrompt.length > MAX_TOTAL_PROMPT_CHARS) {
    const transcriptIdx = sections.findIndex((s) => s.startsWith('=== SESSION TRANSCRIPT'))
    if (transcriptIdx >= 0) {
      sections[transcriptIdx] = '=== SESSION TRANSCRIPT ===\n[Transcript omitted — too large for context window. Supervision prep generated from session notes, MSE, and clinical context only.]'
      userPrompt = sections.join('\n\n')
    }
  }

  return {
    system: SYSTEM_PROMPT,
    user: userPrompt,
  }
}

function formatTranscript(transcript: SessionTranscript, prefs: ProviderPreferences): string {
  const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(' ') || 'Clinician'

  // Format all entries
  const allLines = transcript.entries.map((entry) => {
    const speaker = entry.speaker === 'clinician' ? providerName : 'Client'
    return `${speaker}: ${entry.text}`
  })

  const totalWords = allLines.reduce((sum, line) => sum + line.split(/\s+/).length, 0)

  // If it fits, return everything
  if (totalWords <= MAX_TRANSCRIPT_WORDS) {
    return allLines.join('\n')
  }

  // Otherwise: keep first 20% (opening context) + last 30% (closing/plan) + note the gap
  const keepStart = Math.floor(allLines.length * 0.2)
  const keepEnd = Math.floor(allLines.length * 0.3)
  const startLines = allLines.slice(0, keepStart)
  const endLines = allLines.slice(-keepEnd)
  const skipped = allLines.length - keepStart - keepEnd

  return [
    ...startLines,
    `\n[... ${skipped} transcript lines omitted for length — focus on opening context above and session content below ...]\n`,
    ...endLines,
  ].join('\n')
}
