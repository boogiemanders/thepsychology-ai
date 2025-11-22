import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type SupabaseClientOptions = Parameters<typeof createClient>[2]

export function getSupabaseClient(
  options?: SupabaseClientOptions,
  { requireServiceRole = false }: { requireServiceRole?: boolean } = {}
): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const key = requireServiceRole ? serviceKey : serviceKey || anonKey

  if (!url || !key) {
    console.warn(
      `[Supabase] Skipping Supabase client creation because ${
        !url ? 'NEXT_PUBLIC_SUPABASE_URL' : 'Supabase key'
      } is missing.`
    )
    return null
  }

  return createClient(url, key, options)
}
