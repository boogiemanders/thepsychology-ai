import { getSupabaseClient } from '@/lib/supabase-server'
import type { ProviderProfile, ClientIntakeProfile, PhiAccessType } from '@/types/matching'

// --------------------------------------------------------------------------
// Provider profiles
// --------------------------------------------------------------------------

export async function getProviderProfile(userId: string): Promise<ProviderProfile | null> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return null

  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching provider profile:', error)
  }

  return data as ProviderProfile | null
}

export async function upsertProviderProfile(
  userId: string,
  data: Partial<ProviderProfile>
): Promise<ProviderProfile | null> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return null

  // Remove fields that shouldn't be overwritten by client
  const { id, user_id, created_at, updated_at, credential_verified_at, credential_verified_by, bio_embedding, approach_embedding, ...safeData } = data as Record<string, unknown>

  const { data: result, error } = await supabase
    .from('provider_profiles')
    .upsert(
      { user_id: userId, ...safeData },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting provider profile:', error)
    return null
  }

  await addSecondaryRole(userId, 'provider')

  return result as ProviderProfile
}

async function addSecondaryRole(userId: string, role: 'client' | 'provider'): Promise<void> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return

  const { data: current } = await supabase
    .from('users')
    .select('user_role, secondary_roles')
    .eq('id', userId)
    .single()

  if (!current) return
  if (current.user_role === role) return

  const existing = (current.secondary_roles as string[] | null) ?? []
  if (existing.includes(role)) return

  const { error } = await supabase
    .from('users')
    .update({ secondary_roles: [...existing, role] })
    .eq('id', userId)

  if (error) {
    console.error(`Error adding ${role} role to user ${userId}:`, error)
  }
}

export async function submitProviderProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  // Fetch current profile
  const { data: profile, error: fetchError } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError || !profile) {
    return { success: false, error: 'Profile not found' }
  }

  if (profile.status !== 'draft') {
    return { success: false, error: `Cannot submit profile with status: ${profile.status}` }
  }

  // Validate required fields are present
  const required = ['license_type', 'license_number', 'license_state', 'bio_text', 'approach_text']
  const missing = required.filter((f) => !profile[f])
  if (missing.length > 0) {
    return { success: false, error: `Missing required fields: ${missing.join(', ')}` }
  }

  if (!profile.modalities?.length || !profile.conditions_treated?.length || !profile.populations_served?.length) {
    return { success: false, error: 'Specializations are required' }
  }

  if (!profile.telehealth_states?.length) {
    return { success: false, error: 'At least one telehealth state is required' }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('provider_profiles')
    .update({ status: 'pending_review' })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error submitting provider profile:', updateError)
    return { success: false, error: 'Failed to submit profile' }
  }

  return { success: true }
}

// --------------------------------------------------------------------------
// Client intake
// --------------------------------------------------------------------------

export async function getClientIntake(userId: string): Promise<ClientIntakeProfile | null> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return null

  const { data, error } = await supabase
    .from('client_intake_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching client intake:', error)
  }

  return data as ClientIntakeProfile | null
}

export async function upsertClientIntake(
  userId: string,
  data: Partial<ClientIntakeProfile>
): Promise<ClientIntakeProfile | null> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return null

  // Remove fields that shouldn't be overwritten
  const { id, user_id, created_at, updated_at, concern_embedding, preferences_embedding, hipaa_consent_given_at, matching_consent_given_at, ...safeData } = data as Record<string, unknown>

  const { data: result, error } = await supabase
    .from('client_intake_profiles')
    .upsert(
      { user_id: userId, ...safeData },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting client intake:', error)
    return null
  }

  await addSecondaryRole(userId, 'client')

  return result as ClientIntakeProfile
}

// --------------------------------------------------------------------------
// PHI access logging
// --------------------------------------------------------------------------

export async function logPhiAccess(params: {
  accessorId: string
  accessorRole: string
  clientId: string
  accessType: PhiAccessType
  resourceTable: string
  resourceId?: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string
}): Promise<void> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return

  const { error } = await supabase.from('phi_access_log').insert({
    accessor_id: params.accessorId,
    accessor_role: params.accessorRole,
    client_id: params.clientId,
    access_type: params.accessType,
    resource_table: params.resourceTable,
    resource_id: params.resourceId ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
    request_id: params.requestId ?? null,
  })

  if (error) {
    console.error('Error logging PHI access:', error)
  }
}

// --------------------------------------------------------------------------
// Auth helpers
// --------------------------------------------------------------------------

export async function getUserWithRole(authToken: string) {
  const supabase = getSupabaseClient(
    { global: { headers: { Authorization: `Bearer ${authToken}` } } },
    { requireServiceRole: true }
  )
  if (!supabase) return null

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  // Fetch role from users table
  const { data: profile } = await supabase
    .from('users')
    .select('user_role, secondary_roles')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email,
    role: profile?.user_role ?? 'student',
    secondaryRoles: (profile?.secondary_roles as string[]) ?? [],
  }
}

export function hasRole(
  user: { role: string; secondaryRoles: string[] },
  requiredRole: string
): boolean {
  return user.role === requiredRole || user.secondaryRoles.includes(requiredRole)
}
