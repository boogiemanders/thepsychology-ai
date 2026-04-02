/**
 * Builds LLM prompts for SOAP note generation from session transcripts.
 * Combines clinical context (intake, diagnoses, treatment plan, MSE)
 * with the session transcript into a structured prompt.
 */

import { IntakeData, DiagnosticImpression, TreatmentPlanData, MseChecklist, SessionTranscript, ProviderPreferences, AssessmentResult } from './types'

const MAX_TRANSCRIPT_WORDS = 20_000

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a licensed psychologist. Your task is to generate a SOAP progress note from a session transcript and clinical context.

OUTPUT FORMAT: Return a valid JSON object with exactly four string keys:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.

DOCUMENTATION STANDARDS:
- Use third-person clinical prose (e.g., "Client reported..." not "I said...")
- Use DSM-5 terminology for diagnoses and symptoms
- Include direct client quotes in the Subjective section using quotation marks
- Reference specific content from the session — do not write generic filler
- Only include information explicitly stated in the transcript or session notes
- Do NOT fabricate quotes, symptoms, or clinical observations not present in the data
- Write for insurance/medical necessity — be specific about functional impairment and treatment rationale

SECTION REQUIREMENTS:

SUBJECTIVE: What the client reported. Include:
- Primary concerns discussed this session
- Symptom changes since last session (better, worse, same)
- Relevant life events or stressors mentioned
- Client's own words as direct quotes for key statements
- Mood self-report if stated
- Risk factors: SI/HI denial or endorsement (always document)
- Substance use updates if discussed

OBJECTIVE: What the clinician observed. Include:
- Full Mental Status Exam in this exact format:
  Mental Status Exam:
  Appearance: [from checklist or transcript observations]
  Behavior: [from checklist or transcript observations]
  Speech: [from checklist or transcript observations]
  Mood/Affect: [mood is client's words; affect is clinician's observation]
  Thoughts: [thought process and content, SI/HI status]
  Cognition: [orientation, attention, memory observations]
  Insight/Judgment: [from checklist or inferred from session]
- Behavioral observations during session (engagement, emotional responses, coping demonstrated)
- Screening scores if administered (PHQ-9, GAD-7, C-SSRS)

ASSESSMENT: Clinical analysis. Include:
- Current symptom presentation and severity
- Progress or regression relative to treatment goals (reference specific goals if provided)
- Diagnostic formulation — how current presentation relates to active diagnoses
- Functional impact on daily life, work, relationships
- Protective and risk factors observed
- Clinical reasoning for treatment approach
- Statement of medical necessity for continued treatment

PLAN: Next steps. Include:
- Continue/modify treatment frequency and modality
- Specific focus for next session based on this session's content
- Interventions to use or continue (name specific techniques: CBT, exposure, MI, etc.)
- Between-session assignments or skills to practice
- Any referrals, medication coordination, or safety planning
- Next appointment date/time if mentioned`

export function buildSoapPrompt(
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

  // === PRIOR ASSESSMENTS ===
  const assessments: string[] = []
  const formatAssessment = (a: AssessmentResult | null, label: string) => {
    if (!a) return
    assessments.push(`${label}: ${a.totalScore} — ${a.severity}`)
  }
  if (intake) {
    formatAssessment(intake.phq9, 'PHQ-9')
    formatAssessment(intake.gad7, 'GAD-7')
    formatAssessment(intake.cssrs, 'C-SSRS')
  }
  if (assessments.length > 0) {
    sections.push(`=== PRIOR ASSESSMENTS ===\n${assessments.join('\n')}`)
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
    `=== INSTRUCTIONS ===\nGenerate a SOAP progress note for this session. The treating clinician is ${providerName}. ` +
      `Use the MSE checklist data for the Objective section's Mental Status Exam. ` +
      `Use the transcript and session notes to populate the Subjective, Assessment, and Plan sections. ` +
      `Reference treatment plan goals in the Assessment section when relevant. ` +
      `Return ONLY valid JSON with keys: subjective, objective, assessment, plan.`
  )

  return {
    system: SYSTEM_PROMPT,
    user: sections.join('\n\n'),
  }
}

function formatTranscript(transcript: SessionTranscript, prefs: ProviderPreferences): string {
  const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(' ') || 'Clinician'
  const lines: string[] = []
  let wordCount = 0

  for (const entry of transcript.entries) {
    const speaker = entry.speaker === 'clinician' ? providerName : 'Client'
    const line = `${speaker}: ${entry.text}`
    const words = line.split(/\s+/).length
    wordCount += words

    if (wordCount > MAX_TRANSCRIPT_WORDS) {
      lines.push('[... transcript truncated for length ...]')
      // Add last few entries to capture session closing
      const lastEntries = transcript.entries.slice(-10)
      for (const last of lastEntries) {
        const s = last.speaker === 'clinician' ? providerName : 'Client'
        lines.push(`${s}: ${last.text}`)
      }
      break
    }

    lines.push(line)
  }

  return lines.join('\n')
}
