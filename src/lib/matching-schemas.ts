import { z } from 'zod'
import { LAUNCH_STATES } from '@/lib/matching-constants'

// --------------------------------------------------------------------------
// Provider onboarding — per-step schemas
// --------------------------------------------------------------------------

export const providerCredentialsSchema = z.object({
  license_type: z.string().min(1, 'License type is required'),
  license_number: z.string().min(1, 'License number is required'),
  license_state: z.enum(LAUNCH_STATES, {
    errorMap: () => ({ message: 'Only CA and NY supported at launch' }),
  }),
  npi_number: z
    .string()
    .regex(/^\d{10}$/, 'NPI must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  multi_state_licensed: z.boolean().default(false),
  licensed_states: z.array(z.string()).default([]),
})

export const providerSpecializationsSchema = z.object({
  modalities: z.array(z.string()).min(1, 'Select at least one modality'),
  conditions_treated: z.array(z.string()).min(1, 'Select at least one condition'),
  populations_served: z.array(z.string()).min(1, 'Select at least one population'),
})

export const providerStyleSchema = z.object({
  style_directive: z.number().int().min(1).max(10).optional(),
  style_present_focused: z.number().int().min(1).max(10).optional(),
  style_insight_behavioral: z.number().int().min(1).max(10).optional(),
  style_warmth_professional: z.number().int().min(1).max(10).optional(),
})

export const providerCulturalSchema = z.object({
  languages_spoken: z.array(z.string()).min(1).default(['English']),
  lgbtq_affirming: z.boolean().default(false),
  faith_integrated: z.boolean().default(false),
  faith_traditions: z.array(z.string()).default([]),
  racial_cultural_focus: z.array(z.string()).default([]),
})

export const providerPracticalSchema = z.object({
  insurance_networks: z.array(z.string()).default([]),
  accepts_self_pay: z.boolean().default(true),
  self_pay_rate_cents: z.number().int().positive().optional(),
  sliding_scale_available: z.boolean().default(false),
  sliding_scale_min_cents: z.number().int().positive().optional(),
  telehealth_states: z
    .array(z.enum(LAUNCH_STATES))
    .min(1, 'Select at least one telehealth state'),
})

export const providerBioSchema = z.object({
  bio_text: z.string().min(100, 'Bio must be at least 100 characters').max(2000),
  approach_text: z.string().min(50, 'Approach description required').max(1500),
})

// Combined for final submission validation
export const providerOnboardSchema = providerCredentialsSchema
  .merge(providerSpecializationsSchema)
  .merge(providerStyleSchema)
  .merge(providerCulturalSchema)
  .merge(providerPracticalSchema)
  .merge(providerBioSchema)

export type ProviderOnboardValues = z.infer<typeof providerOnboardSchema>

// --------------------------------------------------------------------------
// Client intake — per-step schemas
// --------------------------------------------------------------------------

export const clientConsentSchema = z.object({
  hipaa_consent: z.literal(true, {
    errorMap: () => ({ message: 'HIPAA consent is required to continue' }),
  }),
  matching_consent: z.literal(true, {
    errorMap: () => ({ message: 'Matching consent is required to continue' }),
  }),
})

export const clientConcernsSchema = z.object({
  conditions_seeking_help: z.array(z.string()).min(1, 'Select at least one concern'),
  concern_severity: z.number().int().min(1).max(10),
  presenting_concerns_text: z.string().max(1000).optional(),
})

export const clientHistorySchema = z.object({
  has_previous_therapy: z.boolean(),
  previous_therapy_count: z.enum(['none', '1-3', '4-10', '10+']).optional(),
  what_worked_text: z.string().max(500).optional(),
  what_didnt_work_text: z.string().max(500).optional(),
})

export const clientPreferencesSchema = z.object({
  preferred_modalities: z.array(z.string()).default([]),
  preferred_therapist_gender: z
    .enum(['no_preference', 'female', 'male', 'nonbinary'])
    .default('no_preference'),
  preferred_therapist_age: z
    .enum(['no_preference', '25-35', '35-50', '50+'])
    .default('no_preference'),
  pref_style_directive: z.number().int().min(1).max(10).optional(),
  pref_style_present_focused: z.number().int().min(1).max(10).optional(),
  pref_style_insight_behavioral: z.number().int().min(1).max(10).optional(),
  pref_style_warmth_professional: z.number().int().min(1).max(10).optional(),
  lgbtq_affirming_required: z.boolean().default(false),
  faith_integrated_preferred: z.boolean().default(false),
  cultural_background: z.string().max(200).optional(),
})

export const clientInsuranceSchema = z.object({
  has_insurance: z.boolean(),
  insurance_payer_name: z.string().optional(),
  insurance_member_id: z.string().optional(),
  insurance_group_number: z.string().optional(),
  insurance_plan_name: z.string().optional(),
  interested_in_self_pay: z.boolean().default(false),
  max_self_pay_rate_cents: z.number().int().positive().optional(),
})

export const clientPracticalSchema = z.object({
  state_of_residence: z.enum(LAUNCH_STATES, {
    errorMap: () => ({ message: 'Only CA and NY supported at launch' }),
  }),
  telehealth_preference: z
    .enum(['telehealth_only', 'in_person_only', 'no_preference'])
    .default('telehealth_only'),
  availability_notes: z.string().max(300).optional(),
})

// Combined for full intake validation (excludes consent — that's separate)
export const clientIntakeSchema = clientConcernsSchema
  .merge(clientHistorySchema)
  .merge(clientPreferencesSchema)
  .merge(clientInsuranceSchema)
  .merge(clientPracticalSchema)

export type ClientIntakeValues = z.infer<typeof clientIntakeSchema>
