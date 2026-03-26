import { NextRequest, NextResponse } from 'next/server'
import {
  getUserWithRole,
  hasRole,
  submitProviderProfile,
} from '@/lib/supabase-matching'
import { sendSlackNotification } from '@/lib/notify-slack'

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasRole(user, 'provider')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await submitProviderProfile(user.id)
    if (!result) {
      return NextResponse.json({ error: 'Failed to submit provider profile' }, { status: 500 })
    }

    await sendSlackNotification(
      `New provider profile submitted for review: ${user.email}`,
      'feedback'
    )

    return NextResponse.json({ success: true, status: 'pending_review' })
  } catch (error) {
    console.error('Provider profile submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
