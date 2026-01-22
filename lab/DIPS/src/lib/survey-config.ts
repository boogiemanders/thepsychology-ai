// Survey configuration for DIPS Research
// Defines all survey questions, options, and structure

export const TRAINING_LEVELS = [
  { value: "practicum", label: "Practicum Student" },
  { value: "intern", label: "Intern" },
  { value: "postdoc", label: "Postdoctoral Fellow" },
  { value: "early_career", label: "Early Career (0-5 years)" },
  { value: "mid_career", label: "Mid Career (5-15 years)" },
  { value: "senior", label: "Senior (15+ years)" },
] as const;

export const THEORETICAL_ORIENTATIONS = [
  { value: "cbt", label: "Cognitive-Behavioral (CBT)" },
  { value: "psychodynamic", label: "Psychodynamic/Psychoanalytic" },
  { value: "humanistic", label: "Humanistic/Person-Centered" },
  { value: "integrative", label: "Integrative/Eclectic" },
  { value: "behavioral", label: "Behavioral" },
  { value: "dbt", label: "DBT" },
  { value: "act", label: "ACT" },
  { value: "systems", label: "Systems/Family" },
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

export const CLINICAL_HOURS_RANGES = [
  { value: "0-500", label: "0-500 hours" },
  { value: "501-1000", label: "501-1,000 hours" },
  { value: "1001-2000", label: "1,001-2,000 hours" },
  { value: "2001-4000", label: "2,001-4,000 hours" },
  { value: "4001+", label: "4,001+ hours" },
] as const;

export const AGE_RANGES = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55-64", label: "55-64" },
  { value: "65+", label: "65+" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
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

// Skills for Importance/Ability and Confidence/Competence matrices
export const CLINICAL_SKILLS = [
  { id: "assessment", label: "Conducting psychological assessments" },
  { id: "diagnosis", label: "Developing accurate diagnoses" },
  { id: "treatment_planning", label: "Creating treatment plans" },
  { id: "therapeutic_alliance", label: "Building therapeutic alliance" },
  { id: "intervention_selection", label: "Selecting appropriate interventions" },
  { id: "case_conceptualization", label: "Case conceptualization" },
  { id: "documentation", label: "Clinical documentation" },
  { id: "risk_assessment", label: "Risk assessment" },
  { id: "cultural_competence", label: "Cultural competence" },
  { id: "ethical_decision_making", label: "Ethical decision-making" },
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
  { id: "fa1", text: "I would be willing to use an AI tool to practice clinical skills" },
  { id: "fa2", text: "An AI training tool would fit into my current learning routine" },
  { id: "fa3", text: "I believe AI could provide useful feedback on my clinical work" },
  { id: "fa4", text: "I would trust AI-generated suggestions for treatment approaches" },
  { id: "fa5", text: "AI tools could help me learn faster than traditional methods alone" },
  { id: "fa6", text: "I would feel comfortable practicing difficult conversations with AI" },
  { id: "fa7", text: "AI feedback would be a valuable supplement to supervisor feedback" },
  { id: "fa8", text: "I would recommend an AI training tool to peers" },
  { id: "fa9", text: "An AI tool could help me feel more prepared for real sessions" },
  { id: "fa10", text: "I believe AI training tools will become standard in clinical education" },
] as const;

// Barriers checklist
export const BARRIERS = [
  { id: "b1", label: "Cost/affordability" },
  { id: "b2", label: "Time constraints" },
  { id: "b3", label: "Lack of institutional support" },
  { id: "b4", label: "Privacy/confidentiality concerns" },
  { id: "b5", label: "Skepticism about AI accuracy" },
  { id: "b6", label: "Preference for human instruction" },
  { id: "b7", label: "Technical difficulties/access issues" },
  { id: "b8", label: "Ethical concerns about AI in mental health" },
  { id: "b9", label: "Fear that AI will replace human clinicians" },
  { id: "b10", label: "Lack of evidence base for AI training tools" },
  { id: "b11", label: "Concern about developing bad habits" },
  { id: "b12", label: "Over-reliance on technology" },
  { id: "b13", label: "Other (please specify)" },
] as const;

// Privacy/HIPAA scenarios
export const PRIVACY_SCENARIOS = [
  { id: "p1", text: "The AI tool stores de-identified session transcripts for model improvement" },
  { id: "p2", text: "The AI tool uses cloud-based processing (data leaves local device)" },
  { id: "p3", text: "The AI tool requires linking to your professional license number" },
  { id: "p4", text: "Session recordings with simulated patients are reviewed by human trainers" },
  { id: "p5", text: "The AI company shares aggregate (non-identifiable) usage data with researchers" },
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
  "Not Important",
  "Slightly Important",
  "Moderately Important",
  "Very Important",
  "Essential",
] as const;

export const ABILITY_LABELS = [
  "Cannot Do",
  "Beginner",
  "Developing",
  "Competent",
  "Expert",
] as const;

export const CONFIDENCE_LABELS = [
  "Not Confident",
  "Slightly Confident",
  "Moderately Confident",
  "Very Confident",
  "Extremely Confident",
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
