import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!stripeSecret) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set; webhook cannot be verified.')
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2025-01-27.acacia' })
  : null

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('[Stripe] Missing configuration for webhook processing.')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await req.arrayBuffer()
  const payload = Buffer.from(body)
  const sig = (await headers()).get('stripe-signature') as string | null

  let event: Stripe.Event

  try {
    if (!sig) {
      throw new Error('Missing Stripe signature header')
    }
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = (session.metadata?.userId ||
          session.client_reference_id) as string | undefined
        const planName = session.metadata?.planName as string | undefined

        if (!userId || !planName) {
          console.warn('[Stripe] Missing userId or planName on checkout.session.completed')
          break
        }

        const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
        if (!supabase) {
          console.error('[Stripe] Supabase not configured in webhook')
          break
        }

        const tier =
          planName === 'Pro'
            ? 'pro'
            : planName === 'Pro + Coaching'
            ? 'pro_coaching'
            : null

        if (!tier) {
          console.warn('[Stripe] Unknown planName in webhook:', planName)
          break
        }

        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_started_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('[Stripe] Failed to update user subscription:', error)
        } else {
          console.log(`[Stripe] Updated subscription_tier to ${tier} for user ${userId}`)
        }

        break
      }
      default:
        // For now, ignore other event types
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('[Stripe] Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}

