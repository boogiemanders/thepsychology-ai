// Survey configuration for DIPS Research
// Defines all survey questions, options, and structure

export const TRAINING_LEVELS = [
  { value: "extern", label: "Extern (pre-doctoral practicum)" },
  { value: "intern", label: "Intern (doctoral internship)" },
  { value: "postdoc", label: "Postdoctoral fellow" },
  { value: "early_career", label: "Early career psychologist (0–3 years post-licensure)" },
  { value: "licensed", label: "Licensed psychologist (3+ years)" },
  { value: "other", label: "Other" },
] as const;

export const THEORETICAL_ORIENTATIONS = [
  { value: "cbt", label: "Cognitive-behavioral (CBT/DBT/ACT)" },
  { value: "psychodynamic", label: "Psychodynamic/psychoanalytic" },
  { value: "humanistic", label: "Humanistic/person-centered" },
  { value: "integrative", label: "Integrative/eclectic" },
  { value: "other", label: "Other" },
] as const;

export const CLINICAL_SETTINGS = [
  { value: "community_mental_health", label: "Community Mental Health" },
  { value: "private_practice", label: "Private Practice" },
  { value: "hospital", label: "Hospital/Inpatient" },
  { value: "university_counseling", label: "University Counseling Center" },
  { value: "va", label: "VA/Military" },
  { value: "school", label: "School-Based" },
  { value: "forensic", label: "Forensic" },
  { value: "other", label: "Other" },
] as const;

export const WEEKLY_CLIENT_HOURS = [
  { value: "0-5", label: "0–5 hours" },
  { value: "6-10", label: "6–10 hours" },
  { value: "11-15", label: "11–15 hours" },
  { value: "16-20", label: "16–20 hours" },
  { value: "21+", label: "21+ hours" },
] as const;

export const WEEKLY_SUPERVISION_HOURS = [
  { value: "0-1", label: "0–1 hour" },
  { value: "1.1-2", label: "1.1–2 hours" },
  { value: "2.1-3", label: "2.1–3 hours" },
  { value: "3.1-4", label: "3.1–4 hours" },
  { value: "4+", label: "4+ hours" },
] as const;

export const AGE_RANGES = [
  { value: "22-26", label: "22–26" },
  { value: "27-31", label: "27–31" },
  { value: "32-36", label: "32–36" },
  { value: "37-41", label: "37–41" },
  { value: "42+", label: "42+" },
] as const;

export const GENDER_OPTIONS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const RACE_ETHNICITY_OPTIONS = [
  { value: "american_indian", label: "American Indian or Alaska Native" },
  { value: "asian", label: "Asian" },
  { value: "black", label: "Black or African American" },
  { value: "hispanic", label: "Hispanic or Latino" },
  { value: "native_hawaiian", label: "Native Hawaiian or Pacific Islander" },
  { value: "white", label: "White" },
  { value: "multiracial", label: "Multiracial" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

// Skills for Importance/Ability/Confidence matrix
export const CLINICAL_SKILLS = [
  { id: "case_conceptualization", label: "Case conceptualization and treatment planning" },
  { id: "therapeutic_alliance", label: "Therapeutic alliance building and rapport" },
  { id: "evidence_based_intervention", label: "Evidence-based intervention delivery (e.g., CBT, exposure)" },
  { id: "crisis_assessment", label: "Crisis assessment and safety planning" },
  { id: "diagnostic_assessment", label: "Diagnostic assessment and differential diagnosis" },
  { id: "therapeutic_ruptures", label: "Managing therapeutic ruptures and resistance" },
  { id: "cultural_humility", label: "Cultural humility and diversity-responsive practice" },
  { id: "documentation", label: "Documentation and clinical record-keeping" },
  { id: "ethical_decision_making", label: "Ethical decision-making in complex situations" },
  { id: "self_reflection", label: "Self-reflection and use of supervision" },
] as const;

// Sources of competence (multi-select)
export const COMPETENCE_SOURCES = [
  { id: "coursework", label: "Graduate coursework" },
  { id: "practicum", label: "Practicum experience" },
  { id: "supervision", label: "Individual supervision" },
  { id: "group_supervision", label: "Group supervision" },
  { id: "workshops", label: "Workshops/trainings" },
  { id: "self_study", label: "Self-study/reading" },
  { id: "peer_consultation", label: "Peer consultation" },
  { id: "ai_tools", label: "AI-assisted learning tools" },
  { id: "simulation", label: "Simulation/role-play" },
  { id: "other", label: "Other" },
] as const;

// Feasibility/Acceptability items
export const FEASIBILITY_ITEMS = [
  { id: "fa1", text: "An AI training tool would fit well into my current clinical workflow." },
  { id: "fa2", text: "I would feel comfortable using AI-generated feedback to improve my clinical skills." },
  { id: "fa3", text: "An AI tool could provide timely feedback when my supervisor is unavailable." },
  { id: "fa4", text: "I believe an AI tool could help me identify blind spots in my clinical practice." },
  { id: "fa5", text: "Using an AI training tool would be worth the time investment required." },
  { id: "fa6", text: "I trust that an AI tool could provide clinically accurate and evidence-based guidance." },
  { id: "fa7", text: "An AI training tool would complement (not replace) human supervision effectively." },
  { id: "fa8", text: "I would recommend an AI clinical training tool to my peers." },
  { id: "fa9", text: "The benefits of using an AI training tool would outweigh any concerns I have." },
  { id: "fa10", text: "I would use an AI training tool regularly if it were available to me." },
] as const;

// Barriers checklist
export const BARRIERS = [
  { id: "b1", label: "Lack of time in my schedule" },
  { id: "b2", label: "Concerns about data privacy and confidentiality" },
  { id: "b3", label: "Skepticism about AI accuracy or clinical validity" },
  { id: "b4", label: "Preference for human-only supervision" },
  { id: "b5", label: "Technical difficulties or poor user interface" },
  { id: "b6", label: "Lack of institutional support or endorsement" },
  { id: "b7", label: "Cost or lack of funding" },
  { id: "b8", label: "Concerns about AI replacing human supervisors" },
  { id: "b9", label: "Uncertainty about how to integrate it into my workflow" },
  { id: "b10", label: "Lack of training on how to use the tool effectively" },
  { id: "b11", label: "Concerns about bias in AI algorithms" },
  { id: "b12", label: "Fear of being evaluated or judged by the tool" },
  { id: "b13", label: "Other (please specify)" },
  { id: "b14", label: "Ethics (cognitive learning, social/political impacts, environmental impacts)" },
] as const;

// Privacy/HIPAA scenarios (7.1-7.4 use dealbreaker/acceptable/unsure)
export const PRIVACY_SCENARIOS = [
  { id: "p1", text: "The AI tool requires you to input de-identified case vignettes (no names, dates, or identifying details)." },
  { id: "p2", text: "The AI tool stores your anonymized interaction data to improve the algorithm over time." },
  { id: "p3", text: "The AI tool shares aggregated, non-identifiable usage data with your training program for educational purposes." },
  { id: "p4", text: "Your supervisor can view your AI tool usage patterns (frequency, topics) but NOT specific case content." },
] as const;

// Privacy scenario 7.5 has different response options
export const HIPAA_COMPLIANCE_SCENARIO = {
  id: "p5",
  text: "The AI tool is HIPAA-compliant and uses end-to-end encryption for all data.",
} as const;

export type HipaaComplianceResponse = "required" | "preferred" | "no_effect";

// AI tool perception options (Section 4.2)
export const AI_TOOL_PERCEPTIONS = [
  { id: "ai_listen", label: "It listens to my session (audio)" },
  { id: "ai_live_transcription", label: "Live transcription during session" },
  { id: "ai_after_transcript", label: "After-session transcript only" },
  { id: "ai_after_summary", label: "After-session summary / note draft" },
  { id: "ai_roleplay", label: "Roleplay practice (simulated patient)" },
  { id: "ai_supervision_prep", label: "Supervision prep (agenda + questions)" },
  { id: "ai_treatment_planning", label: "Treatment planning suggestions" },
  { id: "other", label: "Other" },
] as const;

// Timepoint options
export const TIMEPOINT_OPTIONS = [
  { value: "week_0", label: "Week 0" },
  { value: "week_4", label: "Week 4" },
  { value: "week_8", label: "Week 8" },
  { value: "week_12", label: "Week 12" },
] as const;

// Supervisor survey - AI policy options
export const AI_POLICY_OPTIONS = [
  { value: "encouraged", label: "AI use is encouraged" },
  { value: "permitted", label: "AI use is permitted with guidelines" },
  { value: "no_policy", label: "No specific policy exists" },
  { value: "discouraged", label: "AI use is discouraged" },
  { value: "prohibited", label: "AI use is prohibited" },
  { value: "unknown", label: "Unknown/unsure" },
] as const;

// Supervisor impact items
export const SUPERVISOR_IMPACT_ITEMS = [
  { id: "si1", text: "AI tools could help me provide more consistent feedback to trainees" },
  { id: "si2", text: "AI training tools would free up supervision time for advanced topics" },
  { id: "si3", text: "I would trust AI to assess basic clinical competencies" },
  { id: "si4", text: "AI tools could help identify trainees who need additional support" },
  { id: "si5", text: "I am concerned AI might undermine the supervisory relationship" },
  { id: "si6", text: "AI tools would be beneficial for trainees between supervision sessions" },
  { id: "si7", text: "I would want oversight of how trainees use AI training tools" },
] as const;

// Per-trainee rating skill areas
export const TRAINEE_SKILL_AREAS = [
  { id: "ts1", label: "Assessment & Diagnosis" },
  { id: "ts2", label: "Treatment Planning" },
  { id: "ts3", label: "Therapeutic Relationship" },
  { id: "ts4", label: "Intervention Skills" },
  { id: "ts5", label: "Documentation" },
  { id: "ts6", label: "Professional Development" },
  { id: "ts7", label: "Ethical Practice" },
] as const;

// Patient check-in items
export const PATIENT_ITEMS = [
  { id: "pi1", text: "I felt heard and understood during my session" },
  { id: "pi2", text: "My therapist explained things in a way I could understand" },
  { id: "pi3", text: "I felt comfortable sharing my concerns" },
  { id: "pi4", text: "I feel hopeful about making progress" },
  { id: "pi5", text: "The session addressed what was important to me" },
  { id: "pi6", text: "I would recommend this therapist to others" },
  { id: "pi7", text: "Overall, how would you rate today's session?" },
] as const;

// Likert scale labels
export const LIKERT_5_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
] as const;

export const IMPORTANCE_LABELS = [
  "Not important",
  "Somewhat important",
  "Important",
  "Very important",
  "Critical",
] as const;

export const ABILITY_LABELS = [
  "Novice",
  "Advanced beginner",
  "Competent",
  "Proficient",
  "Expert",
] as const;

export const CONFIDENCE_LABELS = [
  "Not confident",
  "Slightly confident",
  "Moderately confident",
  "Very confident",
  "Extremely confident",
] as const;

export const CHANGE_OPTIONS = [
  { value: "significant_decline", label: "Significant Decline" },
  { value: "slight_decline", label: "Slight Decline" },
  { value: "no_change", label: "No Change" },
  { value: "slight_improvement", label: "Slight Improvement" },
  { value: "significant_improvement", label: "Significant Improvement" },
] as const;

// Survey types for API
export type SurveyType = "trainee" | "supervisor" | "rating" | "patient";

// Survey metadata
export const SURVEYS = {
  trainee: {
    id: "trainee",
    title: "Clinician/Trainee Survey",
    description: "Comprehensive assessment of training needs, skills, and attitudes toward AI training tools",
    duration: "10-12 min",
    color: "#6366f1",
  },
  supervisor: {
    id: "supervisor",
    title: "Supervisor Survey",
    description: "Assessment of supervision practices and attitudes toward AI in clinical training",
    duration: "5 min",
    color: "#8b5cf6",
  },
  rating: {
    id: "rating",
    title: "Per-Trainee Rating",
    description: "Quick rating form for supervisors to assess specific trainee competencies",
    duration: "60-90 sec",
    color: "#a855f7",
  },
  patient: {
    id: "patient",
    title: "Patient Check-In",
    description: "Brief session feedback form for therapy clients",
    duration: "2-3 min",
    color: "#d946ef",
  },
} as const;
