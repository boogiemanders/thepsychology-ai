import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

// Lazy-initialized export for backward compatibility
export const supabase = {
  get from() {
    return getSupabaseClient().from.bind(getSupabaseClient())
  },
  get auth() {
    return getSupabaseClient().auth
  },
  get storage() {
    return getSupabaseClient().storage
  },
  get rpc() {
    return getSupabaseClient().rpc.bind(getSupabaseClient())
  }
} as any
