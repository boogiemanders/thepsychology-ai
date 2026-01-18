import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

type Feature = 'topic_teacher' | 'quizzer' | 'recover' | 'practice_exam' | 'diagnostic_exam'
type RatingType = 'stars' | 'thumbs'

const VALID_FEATURES: Feature[] = ['topic_teacher', 'quizzer', 'recover', 'practice_exam', 'diagnostic_exam']
const VALID_RATING_TYPES: RatingType[] = ['stars', 'thumbs']

export async function POST(request: NextRequest) {
  try {
    const authedUserId = await requireAuthedUserId(request)
    if (!authedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      feature,
      ratingType,
      ratingValue,
      comment,
      sessionId,
      topic,
      domain,
      durationSeconds,
      metadata,
    } = body as {
      feature?: Feature
      ratingType?: RatingType
      ratingValue?: number
      comment?: string | null
      sessionId?: string | null
      topic?: string | null
      domain?: string | null
      durationSeconds?: number | null
      metadata?: Record<string, unknown> | null
    }

    // Validate feature
    if (!feature || !VALID_FEATURES.includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
    }

    // Validate rating type
    if (!ratingType || !VALID_RATING_TYPES.includes(ratingType)) {
      return NextResponse.json({ error: 'Invalid ratingType' }, { status: 400 })
    }

    // Validate rating value
    const normalizedRating = Number(ratingValue)
    if (ratingType === 'stars') {
      if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
        return NextResponse.json({ error: 'Stars rating must be 1-5' }, { status: 400 })
      }
    } else if (ratingType === 'thumbs') {
      if (normalizedRating !== 0 && normalizedRating !== 1) {
        return NextResponse.json({ error: 'Thumbs rating must be 0 (down) or 1 (up)' }, { status: 400 })
      }
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const payload = {
      user_id: authedUserId,
      feature,
      session_id: sessionId ?? null,
      rating_type: ratingType,
      rating_value: normalizedRating,
      comment: typeof comment === 'string' && comment.trim() ? comment.trim() : null,
      topic: typeof topic === 'string' ? topic : null,
      domain: typeof domain === 'string' ? domain : null,
      duration_seconds: typeof durationSeconds === 'number' ? durationSeconds : null,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('feature_ratings').insert(payload)
    if (error) {
      console.error('[feature-rating] insert failed:', error)
      return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
    }

    // Send Slack notification for low ratings
    const isLowRating =
      (ratingType === 'stars' && normalizedRating <= 2) ||
      (ratingType === 'thumbs' && normalizedRating === 0)

    if (isLowRating) {
      try {
        const featureLabel = feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const ratingDisplay =
          ratingType === 'stars'
            ? `${'⭐'.repeat(normalizedRating)} (${normalizedRating}/5)`
            : '👎 Thumbs down'

        const lines = [
          `⚠️ *Low Rating Alert*`,
          `Feature: ${featureLabel}`,
          `Rating: ${ratingDisplay}`,
        ]

        if (topic) lines.push(`Topic: ${topic}`)
        if (payload.comment) lines.push(`Comment: "${payload.comment.slice(0, 200)}"`)

        await sendSlackNotification(lines.join('\n'), 'metrics')
      } catch (slackError) {
        console.error('[feature-rating] slack notify failed (continuing):', slackError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[feature-rating] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
