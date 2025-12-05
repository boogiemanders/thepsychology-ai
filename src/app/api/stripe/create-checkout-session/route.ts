import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { siteConfig } from '@/lib/config'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set; checkout sessions cannot be created.')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

const FALLBACK_PRICE_IDS: Record<'pro' | 'pro_coaching', string> = {
  pro: 'price_1SWv6wAHUPMmLYsCy5yObtDu',
  pro_coaching: 'price_1SWv6IAHUPMmLYsCa98Z3Po6',
}

const priceIdByTier: Record<'pro' | 'pro_coaching', string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID_PRO || FALLBACK_PRICE_IDS.pro,
  pro_coaching: process.env.STRIPE_PRICE_ID_PRO_COACHING || FALLBACK_PRICE_IDS.pro_coaching,
}

function getBaseUrl(req: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const { planTier, userId, userEmail } = (await req.json()) as {
      planTier?: 'pro' | 'pro_coaching'
      userId?: string
      userEmail?: string | null
    }

    if (!planTier || !userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 })
    }

    const priceId = priceIdByTier[planTier]
    if (!priceId) {
      return NextResponse.json({ error: 'Plan configuration missing' }, { status: 400 })
    }

    const baseUrl = getBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planTier,
      },
      subscription_data: {
        metadata: {
          userId,
          planTier,
        },
      },
      success_url: `${baseUrl}/dashboard?upgrade=success`,
      cancel_url: `${baseUrl}/trial-expired?upgrade=cancelled`,
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
