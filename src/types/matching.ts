export type UserRole = 'student' | 'client' | 'provider' | 'admin'

export type ProviderStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'inactive'

export type PhiAccessType =
  | 'intake_view'
  | 'insurance_view'
  | 'profile_match_view'
  | 'admin_view'
  | 'export'

export interface ProviderProfile {
  id: string
  user_id: string
  status: ProviderStatus
  license_type: string | null
  license_number: string | null
  license_state: string | null
  npi_number: string | null
  multi_state_licensed: boolean
  licensed_states: string[]
  credential_verified_at: string | null
  credential_verified_by: string | null
  modalities: string[]
  conditions_treated: string[]
  populations_served: string[]
  style_directive: number | null
  style_present_focused: number | null
  style_insight_behavioral: number | null
  style_warmth_professional: number | null
  languages_spoken: string[]
  lgbtq_affirming: boolean
  faith_integrated: boolean
  faith_traditions: string[]
  racial_cultural_focus: string[]
  insurance_networks: string[]
  accepts_self_pay: boolean
  self_pay_rate_cents: number | null
  sliding_scale_available: boolean
  sliding_scale_min_cents: number | null
  telehealth_only: boolean
  telehealth_states: string[]
  bio_text: string | null
  approach_text: string | null
  created_at: string
  updated_at: string
}

export interface ClientIntakeProfile {
  id: string
  user_id: string
  conditions_seeking_help: string[]
  concern_severity: number | null
  presenting_concerns_text: string | null
  has_previous_therapy: boolean | null
  previous_therapy_count: string | null
  what_worked_text: string | null
  what_didnt_work_text: string | null
  preferred_modalities: string[]
  preferred_therapist_gender: string | null
  preferred_therapist_age: string | null
  pref_style_directive: number | null
  pref_style_present_focused: number | null
  pref_style_insight_behavioral: number | null
  pref_style_warmth_professional: number | null
  preferred_languages: string[]
  lgbtq_affirming_required: boolean
  faith_integrated_preferred: boolean
  cultural_background: string | null
  has_insurance: boolean | null
  insurance_payer_name: string | null
  insurance_payer_id: string | null
  insurance_member_id: string | null
  insurance_group_number: string | null
  insurance_plan_name: string | null
  interested_in_self_pay: boolean
  max_self_pay_rate_cents: number | null
  state_of_residence: string | null
  telehealth_preference: string
  availability_notes: string | null
  hipaa_consent_given_at: string | null
  matching_consent_given_at: string | null
  created_at: string
  updated_at: string
}

export interface PhiAccessLogEntry {
  id: string
  accessor_id: string
  accessor_role: string
  client_id: string
  access_type: PhiAccessType
  resource_table: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  request_id: string | null
  created_at: string
}
