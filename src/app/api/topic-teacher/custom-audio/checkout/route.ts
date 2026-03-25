import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'
import { lookupExistingGeneration } from '@/lib/custom-audio-utils'
import { siteConfig } from '@/lib/config'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const customAudioPriceId = process.env.STRIPE_PRICE_ID_CUSTOM_AUDIO

function getBaseUrl(req: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url
  if (fromEnv) return (fromEnv as string).replace(/\/$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: NextRequest) {
  if (!stripe || !customAudioPriceId) {
    return NextResponse.json({ error: 'Stripe custom audio is not configured' }, { status: 500 })
  }

  try {
    const { userId, userEmail, lessonId, interest, language, contentHash, lessonSlug } = (await req.json()) as {
      userId: string
      userEmail: string
      lessonId: string
      interest?: string | null
      language?: string | null
      contentHash: string
      lessonSlug?: string | null
    }

    if (!userId || !userEmail || !lessonId || !contentHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing completed generation with same content hash
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const existing = await lookupExistingGeneration(supabase, userId, lessonId, contentHash)
    if (existing) {
      return NextResponse.json({ alreadyGenerated: true, generationId: existing.id })
    }

    // Also check for in-progress generation
    const { data: pending } = await supabase
      .from('custom_audio_generations')
      .select('id, status')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('content_hash', contentHash)
      .in('status', ['pending', 'generating'])
      .single()

    if (pending) {
      return NextResponse.json({ alreadyGenerating: true, generationId: pending.id })
    }

    const baseUrl = getBaseUrl(req)
    const returnPath = lessonSlug
      ? `/topic-teacher?topic=${encodeURIComponent(lessonSlug)}`
      : '/topic-teacher'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [{ price: customAudioPriceId, quantity: 1 }],
      metadata: {
        userId,
        lessonId,
        interest: interest || '',
        language: language || '',
        contentHash,
        generationType: 'custom_audio',
      },
      success_url: `${baseUrl}${returnPath}${returnPath.includes('?') ? '&' : '?'}custom-audio=success`,
      cancel_url: `${baseUrl}${returnPath}${returnPath.includes('?') ? '&' : '?'}custom-audio=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[CustomAudio] Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
