import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'
import { NextRequest, NextResponse } from 'next/server'

const VALID_REWARD_TYPES = ['video', 'testimonial'] as const
type RewardType = (typeof VALID_REWARD_TYPES)[number]

const ALLOWED_VIDEO_DOMAINS = [
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'facebook.com',
]

function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_VIDEO_DOMAINS.some((d) => parsed.hostname.includes(d))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { rewardType, data } = body as { rewardType: RewardType; data: { video_url?: string; text?: string } }

    if (!VALID_REWARD_TYPES.includes(rewardType)) {
      return NextResponse.json({ error: 'Invalid reward type. Must be "video" or "testimonial".' }, { status: 400 })
    }

    // Validate submission data
    if (rewardType === 'video') {
      if (!data?.video_url || !isValidVideoUrl(data.video_url)) {
        return NextResponse.json(
          { error: 'Please provide a valid URL from Instagram, TikTok, LinkedIn, or Facebook.' },
          { status: 400 }
        )
      }
    }

    if (rewardType === 'testimonial') {
      if (!data?.text || data.text.trim().length < 20) {
        return NextResponse.json(
          { error: 'Testimonial must be at least 20 characters.' },
          { status: 400 }
        )
      }
    }

    // Check for existing submission of the same type
    // Referrals allow up to 4, others allow 1
    const { data: existing } = await supabase
      .from('user_rewards')
      .select('id')
      .eq('user_id', user.id)
      .eq('reward_type', rewardType)

    const existingCount = existing?.length ?? 0
    const maxAllowed = rewardType === 'referral' ? 4 : 1

    if (existingCount >= maxAllowed) {
      return NextResponse.json(
        { error: rewardType === 'referral' ? 'You have reached the maximum of 4 referrals.' : 'You have already submitted this type of reward.' },
        { status: 409 }
      )
    }

    // Insert reward
    const submissionData = rewardType === 'video'
      ? { video_url: data.video_url }
      : { text: data.text!.trim() }

    const { error: insertError } = await supabase
      .from('user_rewards')
      .insert({
        user_id: user.id,
        reward_type: rewardType,
        status: 'pending',
        submission_data: submissionData,
      })

    if (insertError) {
      console.error('Reward insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit reward' }, { status: 500 })
    }

    // Slack + email notification
    const label = rewardType === 'video' ? 'Video' : 'Testimonial'
    const detail = rewardType === 'video' ? data.video_url : `"${data.text!.trim().slice(0, 80)}..."`
    await sendSlackNotification(
      `🎁 New Pro reward submission (${label}) from ${user.email}\n${detail}`,
      'feedback'
    )

    if (isNotificationEmailConfigured()) {
      await sendNotificationEmail({
        subject: `New reward submission (${label}) from ${user.email}`,
        text: `${user.email} submitted a ${label.toLowerCase()} reward.\n\n${detail}\n\nReview it: https://www.thepsychology.ai/admin/rewards`,
      }).catch((err) => console.error('Reward email notification failed:', err))
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Rewards submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
