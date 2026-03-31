import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'
import { sendLicenseKeyEmail } from '@/lib/user-email'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!stripeSecretKey || !webhookSecret) {
  console.warn('[Stripe] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET; webhook events cannot be processed.')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

// Price IDs to determine plan tier
const PRICE_TO_TIER: Record<string, 'pro'> = {
  // Live price IDs (legacy)
  'price_1SWv6wAHUPMmLYsCy5yObtDu': 'pro',
  'price_1SWv6IAHUPMmLYsCa98Z3Po6': 'pro', // was coaching, now pro
  // Test price IDs
  'price_1SaZCyAHUPMmLYsChA0LhNDs': 'pro',
  'price_1SxOOQAHUPMmLYsCIsVx16ln': 'pro', // was coaching, now pro
  // Founding price ($20/mo) and standard price ($30/mo) — added at runtime
  ...(process.env.STRIPE_PRICE_ID_PRO_FOUNDING ? { [process.env.STRIPE_PRICE_ID_PRO_FOUNDING]: 'pro' as const } : {}),
  ...(process.env.STRIPE_PRICE_ID_PRO_STANDARD ? { [process.env.STRIPE_PRICE_ID_PRO_STANDARD]: 'pro' as const } : {}),
}

async function updateUserSubscription(
  userId: string,
  tier: 'pro',
  stripeCustomerId?: string
) {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    throw new Error('Supabase service role client is not configured')
  }

  // First check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, subscription_tier, stripe_customer_id')
    .eq('id', userId)
    .single()

  console.log('[Stripe] User lookup result:', { userId, existingUser, fetchError })

  if (fetchError || !existingUser) {
    throw new Error(`User not found in database: ${userId}`)
  }

  // Build update data - clear trial_ends_at since they're paying now
  const updateData: Record<string, unknown> = {
    subscription_tier: tier,
    subscription_started_at: new Date().toISOString(),
    trial_ends_at: null,
  }

  if (stripeCustomerId && !existingUser.stripe_customer_id) {
    updateData.stripe_customer_id = stripeCustomerId
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()

  console.log('[Stripe] Supabase update result:', { data, error, userId, tier, stripeCustomerId })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error(`Update returned no rows for userId: ${userId}`)
  }
}

async function getTierFromSession(session: Stripe.Checkout.Session): Promise<'pro' | null> {
  // First check metadata
  if (session.metadata?.planTier) {
    console.log('[Stripe] Got tier from metadata:', session.metadata.planTier)
    return 'pro'
  }

  // Otherwise, try to determine from line items
  if (!stripe) {
    console.error('[Stripe] Stripe client not initialized')
    return null
  }

  try {
    console.log('[Stripe] Fetching line items for session:', session.id)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
    const priceId = lineItems.data[0]?.price?.id
    const mappedTier = priceId ? PRICE_TO_TIER[priceId] : null

    console.log('[Stripe] Line items result:', {
      lineItemsCount: lineItems.data.length,
      priceId,
      mappedTier,
      availablePriceIds: Object.keys(PRICE_TO_TIER),
    })

    if (priceId && mappedTier) {
      return mappedTier
    }
  } catch (err) {
    console.error('[Stripe] Error fetching line items:', err)
  }

  console.error('[Stripe] Could not determine tier from session')
  return null
}

async function getTierFromSubscription(subscription: Stripe.Subscription): Promise<'pro' | null> {
  const priceId = subscription.items.data[0]?.price?.id
  return priceId ? PRICE_TO_TIER[priceId] ?? null : null
}

async function findUserForStripeCustomer(
  stripeCustomerId: string,
  subscription?: Stripe.Subscription
): Promise<{ id: string; subscription_tier?: string | null; stripe_customer_id?: string | null } | null> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    throw new Error('Supabase service role client is not configured')
  }

  // Prefer explicit userId on subscription metadata when available.
  const metadataUserId = subscription?.metadata?.userId
  if (metadataUserId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, subscription_tier, stripe_customer_id')
      .eq('id', metadataUserId)
      .single()
    if (!error && data) return data
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, subscription_tier, stripe_customer_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (error || !data) return null
  return data
}

async function setUserTierById(
  userId: string,
  update: { subscription_tier: 'free' | 'pro'; stripe_customer_id?: string; subscription_started_at?: string | null }
) {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    throw new Error('Supabase service role client is not configured')
  }

  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: update.subscription_tier,
      stripe_customer_id: update.stripe_customer_id,
      subscription_started_at: update.subscription_started_at ?? undefined,
    })
    .eq('id', userId)

  if (error) throw error
}

async function logFunnelEvent(
  userId: string | null,
  eventName: string,
  metadata?: Record<string, unknown>
) {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return

  try {
    await supabase.from('funnel_events').insert({
      user_id: userId,
      event_name: eventName,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Stripe] Failed to log funnel event:', error)
  }
}

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const signature = (await headers()).get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    console.log('[Stripe] Webhook received:', {
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Handle custom audio one-time payment
      if (session.metadata?.generationType === 'custom_audio') {
        const userId = session.metadata.userId
        const lessonId = session.metadata.lessonId
        const contentHash = session.metadata.contentHash
        const interest = session.metadata.interest || null
        const language = session.metadata.language || null

        console.log('[Stripe] Processing custom audio payment', {
          sessionId: session.id,
          userId,
          lessonId,
          contentHash,
        })

        if (!userId || !lessonId || !contentHash) {
          console.error('[Stripe] Missing custom audio metadata', { metadata: session.metadata })
          return NextResponse.json({ error: 'Missing custom audio metadata' }, { status: 500 })
        }

        const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
        if (!supabase) {
          return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Insert generation record
        const { getCustomAudioR2Prefix } = await import('@/lib/custom-audio-utils')
        const genId = crypto.randomUUID()
        const r2Prefix = getCustomAudioR2Prefix(genId)

        const { error: insertError } = await supabase
          .from('custom_audio_generations')
          .insert({
            id: genId,
            user_id: userId,
            lesson_id: lessonId,
            interest,
            language,
            content_hash: contentHash,
            r2_prefix: r2Prefix,
            status: 'pending',
            stripe_checkout_session_id: session.id,
          })

        if (insertError) {
          console.error('[Stripe] Failed to insert custom audio generation:', insertError)
          return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 })
        }

        // Fire-and-forget: trigger generation
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thepsychology.ai'
        const internalSecret = process.env.CUSTOM_AUDIO_INTERNAL_SECRET || process.env.SUPABASE_WEBHOOK_SECRET
        fetch(`${baseUrl}/api/topic-teacher/custom-audio/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${internalSecret}`,
          },
          body: JSON.stringify({ generationId: genId }),
        }).catch((err) => {
          console.error('[Stripe] Failed to trigger custom audio generation:', err)
        })

        await sendSlackNotification(
          `🎧 Custom audio purchased! ${session.customer_email || 'Unknown'} for lesson ${lessonId}`,
          'payments'
        )

        await logFunnelEvent(userId, 'custom_audio_purchased', {
          lessonId,
          interest,
          language,
          sessionId: session.id,
        })

        return NextResponse.json({ received: true })
      }

      const userId = (session.metadata?.userId || session.client_reference_id) as string | undefined
      const planTier = await getTierFromSession(session)
      const stripeCustomerId = typeof session.customer === 'string'
        ? session.customer
        : (session.customer as { id?: string } | null)?.id

      console.log('[Stripe] Processing checkout.session.completed', {
        sessionId: session.id,
        userId,
        planTier,
        stripeCustomerId,
        customerEmail: session.customer_email,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
        clientReferenceId: session.client_reference_id,
      })

      if (!userId || !planTier) {
        console.error('[Stripe] Missing critical metadata on checkout session', {
          sessionId: session.id,
          customerEmail: session.customer_email,
          customerId: session.customer,
          userId,
          planTier,
          metadata: session.metadata,
          clientReferenceId: session.client_reference_id,
          note: 'Cannot update subscription without userId and planTier - returning 500 for retry',
        })
        // Return 500 so Stripe retries the webhook (up to 8 times over 72 hours)
        return NextResponse.json(
          { error: 'Missing required userId or planTier' },
          { status: 500 }
        )
      }

      console.log('[Stripe] Updating subscription for user', { userId, planTier, stripeCustomerId })
      await updateUserSubscription(userId, planTier, stripeCustomerId)
      console.log('[Stripe] Subscription updated successfully', { userId, planTier, stripeCustomerId })

      // Generate extension license key if the user doesn't have one yet, then email it
      try {
        const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
        if (supabase) {
          const { data: userData } = await supabase
            .from('users')
            .select('extension_license_key')
            .eq('id', userId)
            .single()

          let licenseKey = userData?.extension_license_key as string | null | undefined
          if (!licenseKey) {
            licenseKey = crypto.randomUUID()
            await supabase
              .from('users')
              .update({ extension_license_key: licenseKey })
              .eq('id', userId)
            console.log('[Stripe] Generated extension license key for user:', userId)
          }

          // Email the license key to the customer (non-blocking)
          if (licenseKey && session.customer_email) {
            sendLicenseKeyEmail({ to: session.customer_email, licenseKey }).catch((err) => {
              console.warn('[Stripe] Could not send license key email:', err)
            })
          }
        }
      } catch (err) {
        // Non-blocking: don't fail the webhook if license key generation fails
        console.warn('[Stripe] Could not generate extension license key:', err)
      }

      await logFunnelEvent(userId ?? null, 'checkout_completed', {
        planTier,
        stripeCustomerId,
        sessionId: session.id,
      })

      // Slack notification for new subscription
      await sendSlackNotification(
        `💰 New subscription! ${session.customer_email || 'Unknown'} subscribed to Pro`,
        'payments'
      )

      // Email notification for new subscription
      if (isNotificationEmailConfigured()) {
        await sendNotificationEmail({
          subject: `New Pro subscription: ${session.customer_email || 'Unknown'}`,
          text: `New Pro subscription!\n\nEmail: ${session.customer_email || 'Unknown'}\nUser ID: ${userId}\nStripe Customer: ${stripeCustomerId || 'N/A'}\nSession: ${session.id}`,
        }).catch((err) => console.error('[Stripe] Failed to send payment email:', err))
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const stripeCustomerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : (subscription.customer as { id?: string } | null)?.id

      if (!stripeCustomerId) {
        console.warn('[Stripe] Subscription event missing customer id', { eventType: event.type, eventId: event.id })
        return NextResponse.json({ received: true })
      }

      const user = await findUserForStripeCustomer(stripeCustomerId, subscription)
      if (!user) {
        console.warn('[Stripe] No user found for customer', { stripeCustomerId, eventType: event.type })
        return NextResponse.json({ received: true })
      }

      const status = subscription.status
      const isEntitled = status === 'active' || status === 'trialing' || status === 'past_due'
      const tier = await getTierFromSubscription(subscription)

      if (isEntitled && tier) {
        await setUserTierById(user.id, {
          subscription_tier: tier,
          stripe_customer_id: stripeCustomerId,
          subscription_started_at: new Date().toISOString(),
        })
      } else {
        await setUserTierById(user.id, {
          subscription_tier: 'free',
          stripe_customer_id: stripeCustomerId,
        })

        await logFunnelEvent(user.id, 'subscription_cancelled', {
          status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? null,
          cancellationReason: subscription.cancellation_details?.reason ?? null,
        })

        // Slack notification for cancellation
        const reason = subscription.cancellation_details?.reason || 'no reason given'
        await sendSlackNotification(
          `😢 Subscription cancelled (${reason})`,
          'payments'
        )
      }
    }

    // Handle failed payments
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const customerEmail = invoice.customer_email || 'Unknown'
      const attemptCount = invoice.attempt_count || 1

      await sendSlackNotification(
        `⚠️ Payment failed for ${customerEmail} (attempt ${attemptCount})`,
        'payments'
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe] Error handling webhook event:', {
      error,
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
