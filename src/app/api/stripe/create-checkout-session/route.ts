import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { siteConfig } from '@/lib/config'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set; checkout sessions cannot be created.')
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2025-01-27.acacia',
    })
  : null

type PlanName = 'Pro' | 'Pro + Coaching'

const PRICE_MAP: Record<PlanName, string> = {
  Pro: 'price_1SWflILfe9KP6dYg1x5x44Ep',
  'Pro + Coaching': 'price_1SWgnkLfe9KP6dYg8IgPfoez',
}

function getBaseUrl(req: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 },
      )
    }

    const body = await req.json()
    const { planName, userId, userEmail } = body as {
      planName?: PlanName
      userId?: string
      userEmail?: string | null
    }

    if (!planName || !(planName in PRICE_MAP)) {
      return NextResponse.json(
        { error: 'Invalid or missing planName' },
        { status: 400 },
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 },
      )
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Missing user email' },
        { status: 400 },
      )
    }

    const priceId = PRICE_MAP[planName]

    const baseUrl = getBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail ?? undefined,
      client_reference_id: userId,
      metadata: {
        userId,
        planName,
      },
      success_url: `${baseUrl}/dashboard?upgrade=success`,
      cancel_url: `${baseUrl}/#pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
