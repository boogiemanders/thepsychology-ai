import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { siteConfig } from '@/lib/config'
import { getPricingInfo } from '@/lib/pricing-tiers'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set; checkout sessions cannot be created.')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

// Founding ($20/mo) and standard ($30/mo) price IDs
const FALLBACK_PRO_PRICE = 'price_1SWv6wAHUPMmLYsCy5yObtDu'

function getProPriceId(): string {
  const { isFoundingPrice } = getPricingInfo()

  if (isFoundingPrice) {
    return process.env.STRIPE_PRICE_ID_PRO_FOUNDING || FALLBACK_PRO_PRICE
  }

  return process.env.STRIPE_PRICE_ID_PRO_STANDARD || FALLBACK_PRO_PRICE
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
    const { userId, userEmail } = (await req.json()) as {
      planTier?: string
      userId?: string
      userEmail?: string | null
    }

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 })
    }

    const priceId = getProPriceId()
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
        planTier: 'pro',
      },
      subscription_data: {
        metadata: {
          userId,
          planTier: 'pro',
        },
      },
      success_url: `${baseUrl}/dashboard?upgrade=success`,
      cancel_url: `${baseUrl}/dashboard?upgrade=cancelled`,
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
