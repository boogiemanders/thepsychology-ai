import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Extracts and validates a Bearer token from the request via Supabase auth.
 * Returns the authenticated user_id on success, or a NextResponse error on failure.
 */
export async function requireMobileAuth(
  req: NextRequest
): Promise<{ userId: string } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Missing or malformed Authorization header' },
        { status: 401 }
      ),
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[mobile-auth] Missing Supabase environment variables')
    return {
      error: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    }
  }

  const anon = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await anon.auth.getUser(token)

  if (error || !data.user?.id) {
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  return { userId: data.user.id }
}

/**
 * Creates a Supabase client with the service role key for server-side operations.
 * Returns null if environment variables are not configured.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  return createClient(url, serviceKey)
}
