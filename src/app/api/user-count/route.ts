import { getSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })

  if (!supabase) {
    return NextResponse.json({ count: 0 }, { status: 200 })
  }

  // Count auth users (not just users table) to include all signups
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 })

  if (error) {
    console.error('User count error:', error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }

  // The total count is available in the response
  const count = data.total ?? data.users.length

  return NextResponse.json({ count })
}
