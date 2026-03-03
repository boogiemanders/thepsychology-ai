import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'
import { NextRequest, NextResponse } from 'next/server'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const raw = process.env.RECOVER_ADMIN_EMAILS || process.env.ADMIN_EMAILS || 'chanders0@yahoo.com'
  const adminEmails = raw.split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

function getClients(request: NextRequest) {
  const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
  if (!authToken) return null

  // Auth client: uses user JWT to verify identity
  const authClient = getSupabaseClient(
    { global: { headers: { Authorization: `Bearer ${authToken}` } } },
    { requireServiceRole: true }
  )
  // Service client: uses service role key for DB operations (bypasses RLS)
  const serviceClient = getSupabaseClient({}, { requireServiceRole: true })

  if (!authClient || !serviceClient) return null
  return { authClient, serviceClient }
}

// GET - List pending rewards with user email
export async function GET(request: NextRequest) {
  try {
    const clients = getClients(request)
    if (!clients) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await clients.authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'pending'

    const { data, error } = await clients.serviceClient
      .from('user_rewards')
      .select('id, user_id, reward_type, status, submission_data, created_at, reviewed_at, reviewed_by')
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin rewards fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    // Fetch user emails for all rewards
    const userIds = [...new Set((data ?? []).map((r) => r.user_id))]
    const { data: users } = userIds.length > 0
      ? await clients.serviceClient.from('users').select('id, email').in('id', userIds)
      : { data: [] }

    const userMap = new Map((users ?? []).map((u) => [u.id, u.email]))

    const rewards = (data ?? []).map((r) => ({
      ...r,
      user_email: userMap.get(r.user_id) ?? 'unknown',
    }))

    return NextResponse.json({ rewards })
  } catch (error) {
    console.error('Admin rewards error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Approve or reject a reward
export async function PATCH(request: NextRequest) {
  try {
    const clients = getClients(request)
    if (!clients) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await clients.authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { rewardId, action } = await request.json()

    if (!rewardId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request. Provide rewardId and action (approve/reject).' }, { status: 400 })
    }

    // Fetch the reward
    const { data: reward, error: fetchError } = await clients.serviceClient
      .from('user_rewards')
      .select('*')
      .eq('id', rewardId)
      .single()

    if (fetchError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (reward.status !== 'pending') {
      return NextResponse.json({ error: 'Reward has already been reviewed' }, { status: 409 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update reward status
    const { error: updateError } = await clients.serviceClient
      .from('user_rewards')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.email,
      })
      .eq('id', rewardId)

    if (updateError) {
      console.error('Reward update error:', updateError)
      return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 })
    }

    // If approved, extend the user's trial
    const REWARD_DAYS: Record<string, number> = { video: 28, testimonial: 14, referral: 7 }
    if (action === 'approve') {
      const days = REWARD_DAYS[reward.reward_type] ?? 7
      const { error: rpcError } = await clients.serviceClient.rpc('extend_trial', {
        p_user_id: reward.user_id,
        p_days: days,
      })

      if (rpcError) {
        console.error('extend_trial RPC error:', rpcError)
        return NextResponse.json({ error: 'Reward approved but trial extension failed' }, { status: 500 })
      }

      // Fetch user email for notification
      const { data: rewardUser } = await clients.serviceClient
        .from('users')
        .select('email')
        .eq('id', reward.user_id)
        .single()

      await sendSlackNotification(
        `✅ Pro reward approved (${reward.reward_type}) for ${rewardUser?.email ?? reward.user_id} — +${days} days Pro`,
        'feedback'
      )
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Admin rewards PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
