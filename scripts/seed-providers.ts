import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SeedProvider = {
  slug: string
  license_type: string
  license_number: string
  license_state: 'CA' | 'NY'
  licensed_states: ('CA' | 'NY')[]
  multi_state_licensed: boolean
  modalities: string[]
  conditions_treated: string[]
  populations_served: string[]
  languages_spoken: string[]
  lgbtq_affirming: boolean
  faith_integrated: boolean
  faith_traditions: string[]
  racial_cultural_focus: string[]
  insurance_networks: string[]
  accepts_self_pay: boolean
  self_pay_rate_cents: number
  sliding_scale_available: boolean
  telehealth_only: boolean
  telehealth_states: ('CA' | 'NY')[]
  style_directive: number
  style_present_focused: number
  style_insight_behavioral: number
  style_warmth_professional: number
  bio_text: string
  approach_text: string
}

const PROVIDERS: SeedProvider[] = [
  {
    slug: '1',
    license_type: 'Psychologist, PhD',
    license_number: 'PSY-28401',
    license_state: 'CA',
    licensed_states: ['CA'],
    multi_state_licensed: false,
    modalities: ['CBT', 'ACT', 'Motivational Interviewing'],
    conditions_treated: ['Anxiety', 'Depression', 'Life Transitions', 'Stress/Burnout'],
    populations_served: ['Adults (18+)', 'Healthcare Workers'],
    languages_spoken: ['English', 'Spanish'],
    lgbtq_affirming: true,
    faith_integrated: false,
    faith_traditions: [],
    racial_cultural_focus: ['Hispanic/Latinx', 'Immigrant/Refugee'],
    insurance_networks: ['Aetna', 'Cigna', 'United/Optum'],
    accepts_self_pay: true,
    self_pay_rate_cents: 22500,
    sliding_scale_available: true,
    telehealth_only: true,
    telehealth_states: ['CA'],
    style_directive: 7,
    style_present_focused: 8,
    style_insight_behavioral: 8,
    style_warmth_professional: 7,
    bio_text:
      'Bilingual psychologist based in the Bay Area. I work with working adults navigating anxiety, burnout, and identity questions tied to being first-gen or bicultural. Most of my clients come to me after trying talk therapy that felt too vague. My sessions are structured but warm, and I\'ll tell you what I\'m noticing.',
    approach_text:
      'Primarily CBT and ACT. I use motivational interviewing when ambivalence is in the way. Homework is light but real. Expect skills practice between sessions.',
  },
  {
    slug: '2',
    license_type: 'Psychologist, PsyD',
    license_number: 'PSY-31122',
    license_state: 'CA',
    licensed_states: ['CA', 'NY'],
    multi_state_licensed: true,
    modalities: ['EMDR', 'IFS', 'Somatic'],
    conditions_treated: ['Trauma/PTSD', 'Anxiety', 'Grief/Loss', 'Identity/Self-Esteem'],
    populations_served: ['Adults (18+)', 'LGBTQ+'],
    languages_spoken: ['English'],
    lgbtq_affirming: true,
    faith_integrated: false,
    faith_traditions: [],
    racial_cultural_focus: ['African American/Black'],
    insurance_networks: ['BCBS', 'Aetna', 'Out-of-Network Only'],
    accepts_self_pay: true,
    self_pay_rate_cents: 27500,
    sliding_scale_available: false,
    telehealth_only: true,
    telehealth_states: ['CA', 'NY'],
    style_directive: 4,
    style_present_focused: 5,
    style_insight_behavioral: 4,
    style_warmth_professional: 9,
    bio_text:
      'Trauma specialist. I work mostly with queer and Black adults who carry complex trauma, grief, or a long history of feeling unseen in therapy. I move slow, I go deep, and I will not push past what your body can hold.',
    approach_text:
      'EMDR and IFS are my primary tools. Somatic work grounds every session. I don\'t assign homework. Progress shows up in how you move through your week.',
  },
  {
    slug: '3',
    license_type: 'Psychologist, PhD',
    license_number: 'PSY-29988',
    license_state: 'CA',
    licensed_states: ['CA'],
    multi_state_licensed: false,
    modalities: ['DBT', 'CBT'],
    conditions_treated: ['OCD', 'Anxiety', 'Eating Disorders', 'Bipolar Disorder'],
    populations_served: ['Adults (18+)', 'Adolescents (13-17)'],
    languages_spoken: ['English', 'Mandarin'],
    lgbtq_affirming: false,
    faith_integrated: false,
    faith_traditions: [],
    racial_cultural_focus: ['Asian American/Pacific Islander'],
    insurance_networks: ['Kaiser', 'BCBS', 'Cigna'],
    accepts_self_pay: true,
    self_pay_rate_cents: 20000,
    sliding_scale_available: true,
    telehealth_only: true,
    telehealth_states: ['CA'],
    style_directive: 9,
    style_present_focused: 7,
    style_insight_behavioral: 9,
    style_warmth_professional: 5,
    bio_text:
      'I specialize in OCD and eating disorders using evidence-based protocols. If you\'re tired of therapy that felt like open-ended talking, we\'re a fit. I run sessions like a clinician, not a friend. You\'ll leave each session with a plan.',
    approach_text:
      'ERP for OCD, CBT-E for eating disorders, DBT skills for emotional dysregulation. Homework is expected. Measurable progress is the goal.',
  },
  {
    slug: '4',
    license_type: 'Psychologist, PhD',
    license_number: 'PSY-30456',
    license_state: 'CA',
    licensed_states: ['CA'],
    multi_state_licensed: false,
    modalities: ['Psychodynamic', 'IFS'],
    conditions_treated: ['Relationship Issues', 'Identity/Self-Esteem', 'Depression', 'Grief/Loss'],
    populations_served: ['Adults (18+)', 'Couples'],
    languages_spoken: ['English'],
    lgbtq_affirming: false,
    faith_integrated: true,
    faith_traditions: ['Christian'],
    racial_cultural_focus: [],
    insurance_networks: ['Aetna', 'Out-of-Network Only'],
    accepts_self_pay: true,
    self_pay_rate_cents: 25000,
    sliding_scale_available: false,
    telehealth_only: true,
    telehealth_states: ['CA'],
    style_directive: 3,
    style_present_focused: 3,
    style_insight_behavioral: 3,
    style_warmth_professional: 8,
    bio_text:
      'I work with adults and couples who want to understand themselves at depth. Faith can be part of the work if that matters to you, or it can sit quietly in the background. My clients tend to stay in therapy for a while because the change is real.',
    approach_text:
      'Psychodynamic foundation, IFS when parts work fits. I don\'t give homework. Sessions are for what surfaces in the room.',
  },
  {
    slug: '5',
    license_type: 'Psychologist, PhD',
    license_number: 'PSY-NY-12788',
    license_state: 'NY',
    licensed_states: ['NY'],
    multi_state_licensed: false,
    modalities: ['CBT', 'ACT', 'Mindfulness'],
    conditions_treated: ['ADHD', 'Anxiety', 'Stress/Burnout', 'Life Transitions'],
    populations_served: ['Adults (18+)'],
    languages_spoken: ['English'],
    lgbtq_affirming: true,
    faith_integrated: false,
    faith_traditions: [],
    racial_cultural_focus: [],
    insurance_networks: ['Oscar', 'United/Optum', 'Cigna'],
    accepts_self_pay: true,
    self_pay_rate_cents: 24000,
    sliding_scale_available: true,
    telehealth_only: true,
    telehealth_states: ['NY'],
    style_directive: 8,
    style_present_focused: 9,
    style_insight_behavioral: 8,
    style_warmth_professional: 7,
    bio_text:
      'I work with adult ADHD and anxiety, often both at once. Most of my clients are high-functioning professionals who look fine on paper and feel like they are drowning. We build systems that actually work for your brain.',
    approach_text:
      'CBT with ADHD-specific adaptations, ACT for values work, mindfulness where it helps. Expect structure, accountability, and practical tools.',
  },
  {
    slug: '6',
    license_type: 'Psychologist, PhD',
    license_number: 'PSY-NY-14522',
    license_state: 'NY',
    licensed_states: ['NY'],
    multi_state_licensed: false,
    modalities: ['EMDR', 'CBT', 'Somatic'],
    conditions_treated: ['Trauma/PTSD', 'Anxiety', 'Depression', 'Grief/Loss'],
    populations_served: ['Adults (18+)', 'First Responders', 'Veterans'],
    languages_spoken: ['English'],
    lgbtq_affirming: false,
    faith_integrated: false,
    faith_traditions: [],
    racial_cultural_focus: [],
    insurance_networks: ['Aetna', 'BCBS', 'Cigna'],
    accepts_self_pay: true,
    self_pay_rate_cents: 26000,
    sliding_scale_available: false,
    telehealth_only: false,
    telehealth_states: ['NY'],
    style_directive: 6,
    style_present_focused: 7,
    style_insight_behavioral: 6,
    style_warmth_professional: 6,
    bio_text:
      'I work with first responders, veterans, and people who have been through the kind of events most therapists don\'t want to hear about in detail. I can hear it. We can work with it.',
    approach_text:
      'EMDR is my primary tool for trauma. CBT for co-occurring anxiety and depression. Somatic work to keep you in your body through the process.',
  },
  {
    slug: '7',
    license_type: 'Psychologist, PsyD',
    license_number: 'PSY-NY-15203',
    license_state: 'NY',
    licensed_states: ['NY'],
    multi_state_licensed: false,
    modalities: ['Gottman Method', 'EFT', 'Psychodynamic'],
    conditions_treated: ['Relationship Issues', 'Life Transitions', 'Identity/Self-Esteem'],
    populations_served: ['Adults (18+)', 'Couples'],
    languages_spoken: ['English', 'French'],
    lgbtq_affirming: true,
    faith_integrated: false,
    faith_traditions: [],
    racial_cultural_focus: ['Multicultural/Multiracial'],
    insurance_networks: ['Out-of-Network Only'],
    accepts_self_pay: true,
    self_pay_rate_cents: 30000,
    sliding_scale_available: false,
    telehealth_only: true,
    telehealth_states: ['NY'],
    style_directive: 6,
    style_present_focused: 6,
    style_insight_behavioral: 5,
    style_warmth_professional: 8,
    bio_text:
      'Couples therapist. I see partnerships that feel stuck, disconnected, or on the edge. I\'m direct without being harsh. Most of my couples report feeling like they can talk to each other again within the first few months.',
    approach_text:
      'Gottman Method as the backbone. EFT when attachment injuries are the core issue. Individual psychodynamic work when couples work needs it.',
  },
  {
    slug: '8',
    license_type: 'Psychologist, PhD',
    license_number: 'PSY-NY-16100',
    license_state: 'NY',
    licensed_states: ['NY', 'CA'],
    multi_state_licensed: true,
    modalities: ['CBT', 'DBT', 'ACT'],
    conditions_treated: ['Depression', 'Anxiety', 'Substance Use', 'Bipolar Disorder'],
    populations_served: ['Adults (18+)', 'Older Adults (65+)'],
    languages_spoken: ['English', 'Spanish', 'Portuguese'],
    lgbtq_affirming: true,
    faith_integrated: true,
    faith_traditions: ['Secular/Non-Religious', 'Spiritual but not religious'],
    racial_cultural_focus: ['Hispanic/Latinx'],
    insurance_networks: ['Aetna', 'BCBS', 'Cigna', 'United/Optum', 'Oscar'],
    accepts_self_pay: true,
    self_pay_rate_cents: 18000,
    sliding_scale_available: true,
    telehealth_only: true,
    telehealth_states: ['NY', 'CA'],
    style_directive: 7,
    style_present_focused: 7,
    style_insight_behavioral: 7,
    style_warmth_professional: 7,
    bio_text:
      'Trilingual psychologist serving adults across the full range of mood and substance use concerns. Sliding scale is real here. I take insurance and I take it seriously.',
    approach_text:
      'Integrated CBT, DBT skills, and ACT for values clarity. I coordinate with prescribers when meds are part of the picture.',
  },
]

async function createOrGetUser(email: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing?.id) return existing.id as string

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: `seed-${Math.random().toString(36).slice(2)}!Aa1`,
    email_confirm: true,
  })

  if (error) {
    console.error(`auth.admin.createUser failed for ${email}:`, error.message)
    return null
  }

  return created.user?.id ?? null
}

async function seed() {
  const results: { email: string; userId: string; providerId: string }[] = []

  for (const p of PROVIDERS) {
    const email = `seed-psych-${p.slug}@thepsychology.test`
    const userId = await createOrGetUser(email)
    if (!userId) {
      console.error(`skip ${email}: no user id`)
      continue
    }

    const { data: existingProfile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingProfile?.id) {
      console.log(`skip ${email}: profile already exists (${existingProfile.id})`)
      results.push({ email, userId, providerId: existingProfile.id as string })
      continue
    }

    const { slug, ...profile } = p
    void slug
    const { data: inserted, error } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: userId,
        status: 'active',
        ...profile,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`insert failed for ${email}:`, error.message)
      continue
    }

    console.log(`created ${email} -> provider ${inserted.id}`)
    results.push({ email, userId, providerId: inserted.id as string })
  }

  console.log('\nSeed summary:')
  console.table(results)
}

seed().catch((err) => {
  console.error('seed failed:', err)
  process.exit(1)
})
