import type { DomainId } from './enums'

export interface Intervention {
  id: string
  name: string
  domain: DomainId
  description: string
  protocol: string
  indications: string[]
  contraindications: string[]
}

export const INTERVENTIONS: Intervention[] = [
  // Somatic Domain (3)
  {
    id: 'somatic_grounding',
    name: 'Somatic Grounding',
    domain: 'somatic',
    description: 'Body-based grounding techniques to increase awareness of physical sensations and connection to the present moment.',
    protocol: '1. Guide client to notice feet on floor\n2. Progress to body scan (feet → legs → torso → arms → head)\n3. Identify 3 neutral or pleasant sensations\n4. Practice pendulation between comfort and tension areas',
    indications: ['Dissociation', 'Anxiety', 'Hyperarousal', 'Poor body awareness'],
    contraindications: ['Acute trauma flashbacks', 'Severe dissociation without stabilization'],
  },
  {
    id: 'progressive_relaxation',
    name: 'Progressive Muscle Relaxation',
    domain: 'somatic',
    description: 'Systematic tensing and releasing of muscle groups to reduce physical tension and promote body awareness.',
    protocol: '1. Start with hands - clench fists for 5 seconds\n2. Release and notice the difference for 10 seconds\n3. Progress through arms, shoulders, face, torso, legs\n4. End with full body release and awareness',
    indications: ['Muscle tension', 'Anxiety', 'Sleep difficulties', 'Chronic pain'],
    contraindications: ['Recent injury', 'Severe chronic pain conditions'],
  },
  {
    id: 'deep_pressure',
    name: 'Deep Pressure Protocol',
    domain: 'somatic',
    description: 'Proprioceptive input through deep pressure to support nervous system regulation.',
    protocol: '1. Apply firm, consistent pressure to shoulders or arms\n2. Use weighted blanket or compression tools\n3. Hold for 20-30 seconds\n4. Gradually release and notice changes in body state',
    indications: ['Proprioceptive seeking', 'Hyperarousal', 'Anxiety', 'Difficulty with transitions'],
    contraindications: ['Tactile defensiveness', 'Recent injury', 'Touch aversion'],
  },

  // Emotional Domain (3)
  {
    id: 'emotion_naming',
    name: 'Emotion Naming & Validation',
    domain: 'emotional',
    description: 'Structured approach to identifying, naming, and validating emotional experiences.',
    protocol: '1. Ask "What are you noticing right now?"\n2. Help identify the emotion using emotion wheel if needed\n3. Validate: "It makes sense you would feel..."\n4. Explore where the emotion shows up in body',
    indications: ['Alexithymia', 'Emotional dysregulation', 'Poor emotional vocabulary'],
    contraindications: ['Active crisis', 'Overwhelming emotional flooding'],
  },
  {
    id: 'window_tolerance',
    name: 'Window of Tolerance Work',
    domain: 'emotional',
    description: 'Psychoeducation and tracking of arousal states to expand capacity for emotional regulation.',
    protocol: '1. Teach window of tolerance concept\n2. Identify current state (hyper/hypo/within window)\n3. Track patterns over time\n4. Practice micro-movements toward window',
    indications: ['Emotional dysregulation', 'Trauma responses', 'Anxiety', 'Mood instability'],
    contraindications: ['Active crisis requiring stabilization first'],
  },
  {
    id: 'containment',
    name: 'Emotional Containment',
    domain: 'emotional',
    description: 'Visualization and somatic techniques to create a sense of emotional safety and boundaries.',
    protocol: '1. Guide visualization of safe container\n2. Practice "putting away" overwhelming content\n3. Establish somatic anchor for safety\n4. Practice accessing container between sessions',
    indications: ['Emotional flooding', 'Intrusive thoughts', 'Trauma processing'],
    contraindications: ['Severe dissociation', 'Inability to visualize'],
  },

  // Neurological Domain (3)
  {
    id: 'rhythmic_regulation',
    name: 'Rhythmic Regulation',
    domain: 'neurological',
    description: 'Use of rhythm and pattern to regulate nervous system arousal and improve processing.',
    protocol: '1. Establish baseline arousal\n2. Introduce rhythmic stimulus (tapping, swinging, music)\n3. Match rhythm to current state, then gradually modify\n4. Notice changes in arousal and processing',
    indications: ['Hyperarousal', 'Hypoarousal', 'Processing difficulties', 'Attention challenges'],
    contraindications: ['Seizure disorders (with certain rhythms)', 'Severe auditory sensitivity'],
  },
  {
    id: 'bilateral_stimulation',
    name: 'Bilateral Stimulation',
    domain: 'neurological',
    description: 'Alternating left-right stimulation to support processing and integration.',
    protocol: '1. Choose modality (visual, auditory, or tactile)\n2. Establish comfortable pace\n3. Apply while processing target content\n4. Check in regularly about changes in disturbance level',
    indications: ['Trauma processing', 'Anxiety', 'Stuck processing', 'Integration work'],
    contraindications: ['Seizure disorders', 'Eye conditions (for visual)'],
  },
  {
    id: 'sensory_diet',
    name: 'Sensory Diet Planning',
    domain: 'neurological',
    description: 'Individualized schedule of sensory activities to support optimal arousal throughout the day.',
    protocol: '1. Assess sensory preferences and needs\n2. Identify alerting vs. calming activities\n3. Create schedule matching activities to times of day\n4. Build in "heavy work" at key transition times',
    indications: ['Sensory processing differences', 'Arousal dysregulation', 'Attention difficulties'],
    contraindications: ['None specific'],
  },

  // Social Domain (3)
  {
    id: 'social_engagement',
    name: 'Social Engagement System Activation',
    domain: 'social',
    description: 'Techniques to activate the ventral vagal social engagement system for connection and safety.',
    protocol: '1. Establish eye contact at comfortable level\n2. Use prosodic voice patterns\n3. Mirror and attune to client\n4. Notice facial muscle relaxation and engagement cues',
    indications: ['Social withdrawal', 'Attachment difficulties', 'Flat affect', 'Connection difficulties'],
    contraindications: ['Acute trauma responses', 'Severe social anxiety without preparation'],
  },
  {
    id: 'co_regulation',
    name: 'Co-Regulation Practice',
    domain: 'social',
    description: 'Therapist-led regulation support to build client capacity for self-regulation.',
    protocol: '1. Model regulated state through breath and presence\n2. Attune to client rhythm and gradually lead toward regulation\n3. Name the process: "I notice we are breathing together"\n4. Gradually fade support as client builds capacity',
    indications: ['Dysregulation', 'Attachment trauma', 'Limited self-regulation skills'],
    contraindications: ['Therapist in dysregulated state'],
  },
  {
    id: 'boundary_work',
    name: 'Interpersonal Boundary Work',
    domain: 'social',
    description: 'Somatic and relational exercises to establish healthy interpersonal boundaries.',
    protocol: '1. Explore current boundary patterns\n2. Practice saying "no" with somatic support\n3. Notice body signals around boundaries\n4. Role-play boundary scenarios',
    indications: ['Boundary difficulties', 'Enmeshment', 'Relationship distress', 'Trauma history'],
    contraindications: ['Active abusive relationships (safety planning first)'],
  },

  // Environmental Domain (3)
  {
    id: 'environment_modification',
    name: 'Environment Modification',
    domain: 'environmental',
    description: 'Assessment and modification of physical environment to support nervous system regulation.',
    protocol: '1. Assess current environment (lighting, sound, temperature, visual clutter)\n2. Identify triggers and supports\n3. Create modification plan\n4. Establish "regulation stations" in key environments',
    indications: ['Environmental sensitivity', 'Sensory overwhelm', 'Difficulty with transitions'],
    contraindications: ['None specific'],
  },
  {
    id: 'transition_support',
    name: 'Transition Support Protocol',
    domain: 'environmental',
    description: 'Structured approach to managing transitions between environments and activities.',
    protocol: '1. Identify challenging transitions\n2. Create predictable transition rituals\n3. Build in sensory support during transitions\n4. Practice "arriving" exercises after transitions',
    indications: ['Transition difficulties', 'Anxiety', 'ADHD', 'Autism spectrum'],
    contraindications: ['None specific'],
  },
  {
    id: 'safe_space',
    name: 'Safe Space Development',
    domain: 'environmental',
    description: 'Creating internal and external safe spaces for regulation and refuge.',
    protocol: '1. Identify elements of safety (sensory, relational, environmental)\n2. Create physical safe space in home/work\n3. Develop internal safe space visualization\n4. Practice accessing both in session and at home',
    indications: ['Anxiety', 'Trauma', 'Overwhelm', 'Limited safety experiences'],
    contraindications: ['None specific'],
  },
]

export function getInterventionsByDomain(domain: DomainId): Intervention[] {
  return INTERVENTIONS.filter(i => i.domain === domain)
}

export function getInterventionById(id: string): Intervention | undefined {
  return INTERVENTIONS.find(i => i.id === id)
}
