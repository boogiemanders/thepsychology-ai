/**
 * Builds LLM prompts for SOAP note generation from session transcripts.
 * Combines clinical context (intake, diagnoses, treatment plan, MSE)
 * with the session transcript into a structured prompt.
 */

import { IntakeData, DiagnosticImpression, TreatmentPlanData, MseChecklist, SessionTranscript, ProviderPreferences, AssessmentResult } from './types'

// ~16k context with ~4k reserved for system prompt + output = ~12k tokens for user prompt
// Rough estimate: 1 token ≈ 0.75 words, so ~9000 words max for user prompt
const MAX_TRANSCRIPT_WORDS = 4_000 // leave room for context sections + system prompt + output
const MAX_TOTAL_PROMPT_CHARS = 36_000 // ~9k tokens worth of chars

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a licensed psychologist. Your task is to generate a SOAP progress note from a session transcript and clinical context.

OUTPUT FORMAT: Return a valid JSON object with exactly four string keys:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.
Do NOT include leading labels like "Subjective:" or "Plan:" inside the string values. The app already labels each section.

STYLE TARGET:
- Write like an insurance-ready SimplePractice follow-up note: dense, concrete, clinically grounded, and easy to skim.
- Use paragraph prose, not bullets.
- Group content by theme, not by transcript order.
- Prefer "Client reported," "Client described," "Client expressed," "Clinician provided," and "Client responded" style sentences.
- Pack in useful details, but keep every sentence anchored to material actually present in the transcript, session notes, intake, MSE checklist, diagnoses, or treatment plan.
- Keep the tone clinical and practical, not literary, not robotic, and not overly polished.

HOW TO EXTRACT FROM A TRANSCRIPT:
1. Read the entire transcript and identify the KEY THEMES discussed (e.g., anxiety, parenting stress, work conflict, trauma history). Do NOT retell the conversation chronologically.
2. For each theme, extract: (a) what the client reported, (b) specific details and numbers (scores, frequencies, dates), (c) notable quotes that capture the client's experience.
3. Note what the clinician assessed or screened for (e.g., "clinician conducted PTSD criteria screening" or "clinician explored substance use history").
4. Identify trajectory: did the client report improvement, worsening, or no change on any symptoms?
5. Extract any scheduling, homework, or next-step decisions made during the session.
6. Convert raw client language to clinical prose: "my stomach hurts when I'm worried" → "Client reports somatic manifestation of anxiety (GI distress)."
7. When the session includes dreams, family stories, political stress, body symptoms, or other indirect material, document both the content and the connection the client or clinician made to current stressors.
8. When the clinician taught or reviewed a skill, name it clearly and note how the client engaged with it.

DOCUMENTATION STANDARDS:
- Use third-person clinical prose (e.g., "Client reported..." not "I said...")
- Use DSM-5 terminology for diagnoses and symptoms
- Use plain, direct language at about an early-teen reading level when possible
- Prefer simple words over formal or academic wording (e.g., "worry" over "apprehension," "got worse" over "exacerbated")
- Keep the note sounding clinical, but not polished or overly literary
- Reference specific content from the session — do not write generic filler
- Only include information explicitly stated in the transcript or session notes
- Do NOT fabricate quotes, symptoms, or clinical observations not present in the data
- Write for insurance/medical necessity — be specific about functional impairment and treatment rationale
- Organize by theme, not chronologically
- If a detail is missing, leave it out or use a cautious neutral statement based on supplied checklist data. Do not invent.

SECTION REQUIREMENTS:

SUBJECTIVE: What the client reported. Organize by THEME, not chronology:
- Primary concerns discussed this session (group related topics together)
- Symptom changes since last session (better, worse, same) — quantify when possible
- Relevant life events or stressors mentioned (with dates/details from transcript)
- Mood self-report if stated (use client's words)
- Risk factors: SI/HI denial or endorsement (ALWAYS document — write "Client denied SI/HI" if not discussed in session). This sentence is MANDATORY.
- Substance use: if active diagnoses include any F1x.xx substance use code, OR substance use appears in the intake / overview note, the Subjective MUST quantify current frequency and amount (e.g., "Client reports drinking 2/5 bottles of Soju and Patron on weekends and smoking cannabis 5-6 times per week"). Pull from the recent clinical note or intake if the transcript does not update it. This is MANDATORY when substance F-codes are active.
- Include functional details when relevant: work strain, family stress, sleep disruption, appetite changes, social avoidance, exercise changes, or deadline pressure
- LENGTH MATCHES CONTENT: Subjective length should match content density of the session. Sessions packed with new updates, multiple stressors, and quantifiable changes warrant 200-300 words. Sessions that explore historical context with fewer present-week updates can be 120-180 words. Do NOT pad to hit an arbitrary length. Do NOT under-cover when content exists. Every theme from the Pass 1 list MUST get at least one sentence in Subjective with a concrete anchor (named person, dollar amount, frequency, duration, specific event, quote, named platform, or specific behavior). Generic clinical language without an anchor is forbidden.
- If dream content or imagery was discussed, document the dream details briefly and link them to waking stressors only if the transcript supports that link
- Keep it concise, but not skeletal — this should read like a real therapy note, not a shorthand fragment

OBJECTIVE: What the clinician observed and assessed. Include:
- Diagnostic assessment activities conducted this session (e.g., "Clinician assessed for PTSD criteria; client does not meet full criteria at this time")
- Clinical data points extracted during the interview: substance use quantified, injury/medical history, self-report scales or ratings
- Behavioral observations during session (engagement, emotional responses, coping demonstrated)
- Interventions or psychoeducation delivered this session and the client's response to them. NAME the technique even when the clinician did not say its name out loud. Specifically:
  • Externalizing an internal experience as a named PART (e.g., "the doubting part", "the inner critic"), visualizing parts (age, appearance, where they sit), dialoguing between parts, or exploring a part's protective function = "Internal Family Systems parts work" (or "parts work"). Label it that way in Objective AND in Plan.
  • Holding two opposite truths at once = "dialectical reframing" or "dialectics".
  • Tracking trigger -> thought -> feeling -> behavior = "CBT thought record" or "cognitive restructuring".
  • Slow exposure to a feared stimulus = "graded exposure".
  • Naming + accepting an emotion without trying to change it = "mindful acceptance" or "ACT defusion" depending on framing.
  • "It makes sense you would feel X, even though I don't agree" = "validation without agreement".
  • Pairing a new desired behavior with an existing automatic habit (e.g., breathing practice tied to tooth-brushing) = "habit stacking".
  Use these names. Generic phrases like "psychoeducation on emotions" are not acceptable when a named technique was actually performed.
- End the Objective section with an embedded Mental Status Exam block. MUST use LITERAL NEWLINE characters between every category. Do NOT collapse onto one line. Do NOT separate categories with semicolons or commas. Use this exact layout verbatim, including the line breaks:

Mental Status Exam:
Appearance: ...
Behavior: ...
Speech: ...
Mood/Affect: ...
Thoughts: ...
Cognition: ...
Insight/Judgment: ...

- Screening scores if administered (PHQ-9, GAD-7, C-SSRS)

ASSESSMENT: Clinical synthesis structured BY TREATMENT PLAN GOAL.

MANDATORY STRUCTURE when active treatment plan goals are provided:
1. For EACH active treatment plan goal, write a labeled paragraph that begins exactly: "Goal to [paraphrase the goal]: [Significant progress / Moderate progress / Minimal progress / No improvement / Goal needs revision / Not addressed this session]." Follow that label with 2-4 sentences of SPECIFIC session evidence supporting the rating (what the client did, said, demonstrated, or struggled with this session).
2. The "Not addressed this session" label fires ONLY when literally zero session content relates to the goal. If a goal-related topic appears even briefly — especially client-reported symptom CHANGE (improvement, worsening, stability), a related trigger, a flashback, a coping skill use, a related life event, or any direct mention of the goal area — you MUST rate it with a progress label (Significant / Moderate / Minimal / No improvement / Goal needs revision) and cite the brief evidence. Example: if a trauma goal is set and the client says "intrusive thoughts are less overwhelming this week" and mentions a subway flashback, that is "Significant progress" with evidence, not "Not addressed". Reserve "Not addressed this session" for goals where the topic genuinely never came up. Do NOT invent indirect connections; but do NOT under-credit content that IS in the transcript.
3. After all per-goal paragraphs, write ONE synthesis paragraph covering: diagnostic formulation (does the presentation fit the active F-codes), current symptom severity, historical patterns and family-of-origin dynamics if relevant, functional impact, protective and risk factors, and an explicit statement of medical necessity for continued treatment.

Other requirements:
- Use DSM-5 terminology and reference the active F-codes by name when discussing the formulation.
- If the session revealed family-of-origin, intergenerational, or longstanding coping patterns, include that synthesis in the closing paragraph.
- Tie protective factors (support system, insight, motivation) and risk factors to specific session content, not generic descriptors.

PLAN: Actionable next steps (5-8 specific directives, written as dense prose paragraph(s), not bulleted UI):
- Treatment frequency, modality, and scheduling changes (include specific day/time if discussed)
- At least one item naming a CONTINUING INTERVENTION from the treatment plan's intervention list (ACT, DBT, EFT, MI, CBT, exposure, etc.). Name the technique and how it applies to this client's content.
- At least one specific TOPIC for the next session pulled from a theme that emerged this session (e.g., "Process family enmeshment and approval-seeking vs autonomy", "Explore words-vs-actions integrity gap and client's self-discrediting pattern").
- Between-session assignments or skills to practice (e.g., distress tolerance practice, weekly substance-use log if Goal 2 is active).
- CONCRETE CLIENT COMMITMENTS: any specific behavior, contact, boundary, or action the client COMMITTED to in session MUST appear in Plan as a discrete item. Examples: "Client will maintain individual contact with [named friend] while avoiding group gatherings", "Client will track substance use in a daily log", "Client will call [named person] before next session". Pull these verbatim from the transcript. Do NOT drop them.
- Psychoeducation directions if relevant (e.g., trauma bonding, sunk cost fallacy, ambivalence, family-of-origin patterns).
- Any referrals, medication coordination, or safety planning.
- The next appointment statement appears in the INSTRUCTIONS block — use the date provided there verbatim.
- Each directive must reference specific session content, not generic advice.

CONCISENESS RULES (apply to ALL sections):
- Each section should be 3-5 dense sentences or bullet points. Not 1-2, not 8-10.
- Every sentence must be anchored to something specific from the session data.
- Do NOT write generic filler like "Consider exploring the client's feelings about..." or "Continue to monitor..."
- Do NOT repeat the same observation across sections.
- Prefer concrete details (scores, dates, quotes, specific behaviors) over vague descriptors.
- If a detail is not in the data, leave it out entirely — do not pad with boilerplate.

EXAMPLE OUTPUT (synthetic, for STYLE/DEPTH reference only — do NOT copy any content from this example into real notes):
{"subjective":"Client reported increased work stress and ongoing anxiety since last session. He has applied behavioral experiments from previous session, reducing overwork by approximately 1% weekly and increasing enjoyable activities including tennis and gym. Client resumed physical exercise for first time since recent medical event, noting 30-minute cardio session improved mood. He described morning anxiety with intrusive work-related thoughts upon waking, possibly dream-related. Client wrote a full-page private journal entry when overwhelmed this morning, then used behavioral activation via midday walk. He reported feeling urges to scream and tear up during work interactions due to repeated direct messages from a former supervisor. Client advocated for himself by speaking candidly with current supervisor, presenting concerns about project pressure and productivity impact. He connected former supervisor's communication style to early family anxiety patterns, identifying a deja vu response. Client expressed values conflict between financial optimization and meaningful work aligned with his morals, noting comparison with peers and industry growth contributes to self-esteem strain and affects relationship with partner. Client denied SI/HI.","objective":"Client was cooperative and engaged throughout session. He demonstrated self-advocacy by writing down overwhelming thoughts and communicating professionally with his supervisor despite emotional distress. Client showed insight connecting workplace dynamics to family-of-origin anxiety patterns. He problem-solved actively by using physical activity and expressive writing as coping strategies. Client read portions of journal entry aloud, demonstrating trust. He showed values clarity around integrity and working with passionate colleagues versus purely financial optimization.\n\nMental Status Exam:\nAppearance: Casually dressed, appropriate grooming\nBehavior: Cooperative, engaged, emotionally expressive\nSpeech: Normal rate and volume\nMood/Affect: Anxious and frustrated initially, more balanced by session end\nThoughts: Linear and goal-directed, no SI/HI, preoccupied with work pressure and peer comparisons\nCognition: Alert, oriented x3, strong abstract reasoning\nInsight/Judgment: Excellent insight into anxiety triggers and values conflicts; judgment intact","assessment":"Client presents with generalized anxiety with somatic features including morning anxiety, intrusive work-related thoughts on waking, and urges to cry or scream under pressure, consistent with active GAD diagnosis. He demonstrates adaptive coping via behavioral activation, expressive writing, and professional self-advocacy, indicating good engagement with prior interventions. Anxiety is triggered by former supervisor's communication pattern, which the client identified as mirroring family-of-origin anxiety patterns — a significant insight gain. Client shows a values conflict between financial optimization and meaningful work, with comparison-driven self-esteem concerns affecting his romantic relationship. Client's strong self-awareness, willingness to advocate for needs, and ability to distinguish emotion from professional behavior support a positive prognosis. Continued treatment is medically necessary to address anxiety symptoms, values clarification, self-esteem concerns tied to financial comparisons, and further emotion-regulation skill building.","plan":"Continue weekly individual therapy. Validated client's self-advocacy with current supervisor as a wise-mind application. Provided psychoeducation on anxiety as a physical information system using an ancestral fight-or-flight frame. Offered a visualization technique of imagining frustrating work problems under bike pedals during exercise. Encouraged continued expressive writing and behavioral activation via gym and tennis. Client will continue the 1% behavioral experiment, prioritizing enjoyable activities over overwork. Discussed bringing a notebook to work for in-the-moment journaling. Next session will explore self-esteem concerns related to financial comparisons and values conflicts."}

Note how the example: (a) organizes Subjective by THEME (stress → coping → advocacy → family link → values/FOMO → SI denial), not chronology; (b) embeds the Mental Status Exam at the end of Objective with the exact labeled layout; (c) ties Assessment to specific session content AND names medical necessity; (d) makes every Plan item concrete and session-specific. Match this depth and structure — but with the current session's actual content, not this example's content.`

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
    formatAssessment(intake.dass21, 'DASS-21')
  }
  if (assessments.length > 0) {
    sections.push(`=== PRIOR ASSESSMENTS ===\n${assessments.join('\n')}`)
  }

  if (intake?.overviewClinicalNote.trim()) {
    sections.push(`=== RECENT CLINICAL NOTE FROM PROFILE OVERVIEW ===\n${intake.overviewClinicalNote.trim()}`)
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
  const next = new Date()
  next.setDate(next.getDate() + 7)
  const nextSessionDateStr = next.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  sections.push(
    `=== INSTRUCTIONS ===\nGenerate a SOAP progress note for this session. The treating clinician is ${providerName}. ` +
      `Use the MSE checklist data for the Objective section's Mental Status Exam. ` +
      `Use the transcript and session notes to populate the Subjective, Assessment, and Plan sections. ` +
      `Aim for a dense, insurance-ready SimplePractice follow-up note rather than brief SOAP fragments. ` +
      `Objective should include both session interventions/observations and the exact "Mental Status Exam:" block with line breaks between every category. ` +
      `Assessment MUST contain one labeled paragraph PER active treatment plan goal (with progress rating) before the synthesis paragraph, when goals are provided. ` +
      `Assessment must also explicitly state why continued treatment is medically necessary when the data supports that. ` +
      `When closing the Plan, write: "Next appointment scheduled for ${nextSessionDateStr} at the same time" — substitute the verbatim date string. If the transcript explicitly states a different date/time, use that instead. ` +
      `Write in plain, simple clinical language rather than formal or academic language. ` +
      `Return ONLY valid JSON with keys: subjective, objective, assessment, plan.`
  )

  let userPrompt = sections.join('\n\n')

  // Final safety: if the total prompt is still too large, trim the transcript section
  if (userPrompt.length > MAX_TOTAL_PROMPT_CHARS) {
    const transcriptIdx = sections.findIndex((s) => s.startsWith('=== SESSION TRANSCRIPT'))
    if (transcriptIdx >= 0) {
      // Remove transcript and add a note
      sections[transcriptIdx] = '=== SESSION TRANSCRIPT ===\n[Transcript omitted — too large for context window. SOAP generated from session notes, MSE, and clinical context only.]'
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
