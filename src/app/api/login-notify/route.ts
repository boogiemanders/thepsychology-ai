import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: NextRequest) {
  try {
    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null

    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ ok: true })
    }

    // Verify the token and get user info
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user?.email) {
      return NextResponse.json({ ok: true })
    }

    const email = data.user.email
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    })

    await sendSlackNotification(
      `🔑 Login: ${email} at ${timestamp}`,
      'alerts'
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    // Silently fail - this is not critical
    console.debug('[login-notify] error:', error)
    return NextResponse.json({ ok: true })
  }
}
