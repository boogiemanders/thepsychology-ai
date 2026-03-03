import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: true }
    )
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Fetch rewards and referral code in parallel
    const [rewardsResult, userResult] = await Promise.all([
      supabase
        .from('user_rewards')
        .select('id, reward_type, status, submission_data, created_at')
        .eq('user_id', user.id),
      supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single(),
    ])

    return NextResponse.json({
      rewards: rewardsResult.data ?? [],
      referralCode: userResult.data?.referral_code ?? null,
    })
  } catch (error) {
    console.error('Rewards status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
