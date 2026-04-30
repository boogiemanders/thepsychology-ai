export type Variation = 'safe' | 'expressive' | 'experimental'
export type LauncherStyle = 'circle' | 'pill' | 'pulse'
export type AccentName = 'royal' | 'peach' | 'plum' | 'mint'

export interface AssessmentOption {
  label: string
  score: number
}

export interface Recommendation {
  icon: 'cbt' | 'group'
  title: string
  detail: string
}

export interface Clinician {
  name: string
  specialty: string
  modality: string
  match: number
  bio: string
  slots: string[]
}

export interface CrisisAction {
  label: string
  sub: string
  cta: string
  primary?: boolean
}

export interface HistoryThread {
  id: string
  title: string
  preview: string
  when: string
  tag: string
  tagColor: 'mint' | 'peri' | 'peach'
}

export interface SourceTag { title: string; doc: string }

export type HandoffIntent = 'scheduling' | 'billing' | 'clinical' | 'general'

export interface SchedulingSubmit {
  name: string
  email: string
  phone?: string
  modality: 'telehealth' | 'in-person' | 'either'
  preferredTimes: string[]
  insurance: string
  concerns: string
}

export interface ContactClinicianSubmit {
  name: string
  email: string
  phone?: string
  clinician: string
  message: string
  urgency: 'low' | 'normal' | 'urgent'
}

export type Message =
  | { from: 'bot'; text: string; kind?: undefined; sub?: undefined; sources?: SourceTag[] }
  | { from: 'bot'; kind: 'intro'; text: string; sub?: string }
  | { from: 'bot'; kind: 'crisis'; text: string; sub?: string }
  | { from: 'bot'; kind: 'crisis-actions'; actions: CrisisAction[] }
  | { from: 'bot'; kind: 'assessment-question'; step: number; total: number; question: string; options: AssessmentOption[] }
  | { from: 'bot'; kind: 'results'; score: number; max: number; level: 'Mild' | 'Moderate' | 'Severe'; summary: string; recommendations: Recommendation[] }
  | { from: 'bot'; kind: 'clinician-card'; clinician: Clinician }
  | { from: 'bot'; kind: 'handoff-loading'; text: string }
  | { from: 'bot'; kind: 'scheduling-form' }
  | { from: 'bot'; kind: 'contact-clinician-form'; clinicians: string[] }
  | { from: 'bot'; kind: 'handoff-success'; intent: HandoffIntent; etaText: string }
  | { from: 'user'; text: string }
  | { from: 'human'; name: string; text: string; avatar: string }
  | { from: 'system'; text: string }

export interface ComposerState {
  value: string
  placeholder: string
  typing?: boolean
}

export interface InziState {
  id: string
  label: string
  title: string
  view?: 'history'
  messages?: Message[]
  threads?: HistoryThread[]
  chips?: string[]
  composer?: ComposerState | null
  botTyping?: boolean
}

export interface InzinnaTherapist {
  name: string
  credentials: string
  specialty: string
  modality: string
  bio: string
}

// Pulled from https://drinzinna.com/our-therapists
export const INZINNA_THERAPISTS: InzinnaTherapist[] = [
  { name: 'Dr. Greg Inzinna', credentials: 'PhD, Licensed Clinical Psychologist', specialty: 'Director of Clinical Training', modality: 'Individual, couples, family. Trauma, anxiety, depression.', bio: 'Licensed Clinical Psychologist and professor with postdoctoral fellowship at Yeshiva University. Supervises graduate therapists and teaches lifespan psychopathology and group therapy.' },
  { name: 'Dr. Bret Boatwright', credentials: 'PsyD, Licensed Clinical Psychologist', specialty: 'Director of Assessment, ADHD specialist', modality: 'Psychodynamic, mindfulness, somatic. ADHD assessment, neurodivergence.', bio: 'Specializes in neurodivergent individuals and ADHD diagnosis. Uses psychodynamic and somatic approaches to address rejection sensitivity dysphoria and emotion regulation.' },
  { name: 'Juan Carlos Espinal', credentials: 'LMSW', specialty: 'Director of Youth Development', modality: 'ACT, emotion regulation coaching, couples, executive functioning.', bio: 'Bilingual social worker with 10+ years mental health experience. Integrates coaching to help clients explore personal growth.' },
  { name: 'Dr. Karen Terry', credentials: 'PsyD, MBA, CASAC-T, Limited-Permit Psychologist', specialty: 'Anxiety, mood, trauma, couples', modality: 'CBT, psychodynamic.', bio: 'Blends evidence-based CBT with psychodynamic approaches for individuals and couples, with focus on PTSD and non-verbal learning disorder.' },
  { name: 'Dr. Emily Underwood', credentials: 'PsyD, Limited-Permit Psychologist', specialty: 'General therapy', modality: 'Mixed.', bio: 'Limited details on the public page.' },
  { name: 'Isabelle Feinstein', credentials: 'LMSW', specialty: 'Anxiety, trauma, family therapy', modality: 'Family-systems oriented.', bio: 'Social worker specializing in anxiety, trauma, and family dynamics in a supportive therapeutic environment.' },
  { name: 'Filomena DiFranco', credentials: 'MHC-LP, CASAC-T', specialty: 'Anxiety, depression, trauma, relationships', modality: 'Evidence-based, client-centered.', bio: 'Psychotherapist committed to fostering meaningful growth through compassionate, evidence-based methods.' },
  { name: 'Dr. Lorin Singh', credentials: 'PsyD, Limited-Permit Psychologist', specialty: 'Trauma, crisis management', modality: 'CBT, trauma-focused, crisis management.', bio: '9+ years in mental health. Dedicated to fostering safe spaces for clients to overcome emotional obstacles.' },
  { name: 'Dr. Marcus Ramirez Santoyo', credentials: 'Limited-Permit Psychologist', specialty: 'Multilingual therapy', modality: 'Mixed.', bio: 'Practices therapy in German, Spanish, and English.' },
  { name: 'Rachel Beyer', credentials: 'LMSW', specialty: 'Eating disorders, anxiety, depression, trauma, life transitions', modality: 'CBT, DBT, psychodynamic, ACT, mindfulness.', bio: 'Eating disorder treatment experience from IOP and PHP. Affirming care for LGBTQ+ and neurodivergent clients.' },
  { name: 'Joelle Gill', credentials: 'LMSW', specialty: 'Individual and family therapy', modality: 'Relational, strengths-based.', bio: 'Virtual psychotherapist emphasizing relationship strengthening and communication through empathetic, collaborative practice.' },
]

export const INZ_STATES: InziState[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    title: 'Empty / welcome',
    messages: [
      { from: 'bot', kind: 'intro', text: "hi, I'm Inzi", sub: "I'm here to help you figure out what kind of support might be right for you. nothing you say here is binding. it's just a conversation." },
    ],
    chips: [
      "Take the 5-min self-assessment",
      "Schedule a session",
      "Help me find a therapist",
      "Send a message to my therapist",
      "Insurance and billing questions",
      "I'm in crisis",
    ],
    composer: { value: '', placeholder: "type a message..." },
  },
  {
    id: 'user-typing',
    label: 'User typing',
    title: 'User is composing',
    messages: [
      { from: 'bot', kind: 'intro', text: "hi, I'm Inzi", sub: "I'm here to help you figure out what kind of support might be right for you." },
      { from: 'user', text: "I think I might be dealing with anxiety but I'm not sure if I need therapy" },
      { from: 'bot', text: "thank you for sharing that. wanting to be sure is completely normal. would it help to walk through a quick 5-minute screener together? it's not diagnostic. it just gives you something concrete to look at." },
    ],
    chips: ["yes, let's do it", "tell me more first", "what do you mean by 'screener'?"],
    composer: { value: "what does the assessment actually ask abou", placeholder: "type a message...", typing: true },
  },
  {
    id: 'bot-typing',
    label: 'Bot typing',
    title: 'Bot is thinking',
    messages: [
      { from: 'bot', kind: 'intro', text: "hi, I'm Inzi", sub: "I'm here to help you figure out what kind of support might be right for you." },
      { from: 'user', text: "I think I might be dealing with anxiety but I'm not sure if I need therapy" },
    ],
    botTyping: true,
    composer: { value: '', placeholder: "type a message..." },
  },
  {
    id: 'chips',
    label: 'Quick replies',
    title: 'Quick reply chips',
    messages: [
      { from: 'bot', text: "got it. anxiety is one of the most common reasons people start therapy, and there's a lot we can do for it." },
      { from: 'bot', text: "before we go further, can I ask: how long has this been showing up for you?" },
    ],
    chips: ["a few weeks", "a couple of months", "6 months or more", "as long as I can remember", "I'd rather not say"],
    composer: { value: '', placeholder: "or type your own answer..." },
  },
  {
    id: 'assessment-progress',
    label: 'Self-assess',
    title: 'Self-assessment in progress',
    messages: [
      { from: 'bot', text: "great. I'm going to ask 7 short questions. there are no wrong answers. just go with your gut." },
      { from: 'bot', kind: 'assessment-question', step: 4, total: 7, question: "Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?", options: [
        { label: "Not at all", score: 0 },
        { label: "Several days", score: 1 },
        { label: "More than half the days", score: 2 },
        { label: "Nearly every day", score: 3 },
      ]},
    ],
    composer: null,
  },
  {
    id: 'assessment-results',
    label: 'Results',
    title: 'Self-assessment results',
    messages: [
      { from: 'bot', text: "thanks for taking that. here's what your answers suggest. remember, this isn't a diagnosis, just a starting point." },
      { from: 'bot', kind: 'results', score: 12, max: 21, level: 'Moderate', summary: "Your responses suggest you're experiencing a moderate level of anxiety symptoms. many people in this range find real relief from talking with a therapist, especially using approaches like CBT.", recommendations: [
        { icon: 'cbt', title: 'CBT-focused therapist', detail: 'Strong fit for moderate anxiety. Practical, skill-building.' },
        { icon: 'group', title: 'Group support', detail: 'Lower cost option. Useful alongside or instead of 1:1.' },
      ]},
    ],
    chips: ["match me with a therapist", "show me CBT clinicians", "what does CBT cost?"],
    composer: { value: '', placeholder: "type a message..." },
  },
  {
    id: 'booking',
    label: 'Booking',
    title: 'Inline booking card',
    messages: [
      { from: 'bot', text: "I found 3 Inzinna clinicians who specialize in anxiety + CBT and have openings this week. take your time. switching later is always fine." },
      { from: 'bot', kind: 'clinician-card', clinician: {
        name: 'Dr. Karen Terry, PsyD',
        specialty: 'Anxiety, mood disorders, trauma, couples',
        modality: 'CBT + psychodynamic · virtual',
        match: 94,
        bio: 'Blends evidence-based CBT with psychodynamic depth. Particular focus on PTSD and non-verbal learning disorder.',
        slots: ['Tue 4:30 PM', 'Wed 11:00 AM', 'Thu 6:00 PM'],
      }},
    ],
    chips: ["see two more matches", "filter by insurance", "I'd rather meet in person"],
    composer: { value: '', placeholder: "type a message..." },
  },
  {
    id: 'crisis',
    label: 'Crisis',
    title: 'Gentle crisis handoff',
    messages: [
      { from: 'user', text: "honestly some days I just don't want to be here anymore" },
      { from: 'bot', kind: 'crisis', text: "I hear you, and I'm really glad you said that out loud.", sub: "what you're feeling deserves more support than I can give you in a chat. you're not alone, and there are people trained for exactly this moment, right now." },
      { from: 'bot', kind: 'crisis-actions', actions: [
        { label: 'Call or text 988', sub: 'Suicide & Crisis Lifeline. 24/7, free.', cta: 'tel:988', primary: true },
        { label: 'Text HOME to 741741', sub: 'Crisis Text Line. Confidential.', cta: 'sms:741741' },
        { label: 'Connect me to an Inzinna clinician now', sub: 'a real person within 10 minutes', cta: '#', primary: true },
      ]},
    ],
    composer: { value: '', placeholder: "I'm here whenever you're ready..." },
  },
  {
    id: 'handoff',
    label: 'Human handoff',
    title: 'Connecting to a real person',
    messages: [
      { from: 'user', text: "can I talk to a real person?" },
      { from: 'bot', text: "of course. I'm pulling in a care coordinator from the Inzinna team. they'll pick up here in under a minute." },
      { from: 'bot', kind: 'handoff-loading', text: "connecting..." },
      { from: 'system', text: "Sara from Inzinna joined the conversation" },
      { from: 'human', name: 'Sara', text: "hi! I'm Sara, one of the care coordinators here. I read through your conversation with Inzi. totally understand. let's find you a good fit. mind if I ask a couple quick questions?", avatar: 'S' },
    ],
    chips: ["sure, go ahead", "before that. what's the cost?"],
    composer: { value: '', placeholder: "reply to Sara..." },
  },
  {
    id: 'history',
    label: 'History',
    title: 'Saved conversations',
    view: 'history',
    threads: [
      { id: 't1', title: 'starting therapy for the first time', preview: 'matched with Dr. Maya Okafor. booked Tue 4:30 PM', when: 'today', tag: 'booked', tagColor: 'mint' },
      { id: 't2', title: 'self-assessment for anxiety', preview: 'score: 12 / 21 (moderate)', when: 'yesterday', tag: 'assessment', tagColor: 'peri' },
      { id: 't3', title: 'insurance + cost questions', preview: 'we accept Aetna, BCBS, Cigna, United...', when: '2 days ago', tag: 'info', tagColor: 'peach' },
      { id: 't4', title: 'how does CBT actually work?', preview: 'walked through what to expect in a session', when: 'last week', tag: 'info', tagColor: 'peach' },
    ],
    composer: { value: '', placeholder: "start a new conversation..." },
  },
]
