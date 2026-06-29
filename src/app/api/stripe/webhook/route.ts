import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'
import { sendGa4Event, deterministicClientId } from '@/lib/ga4-measurement-protocol'
import { sendMetaCapiEvent } from '@/lib/meta-capi'

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
  // Founding price ($20/mo), standard price ($30/mo), current price ($40/mo) — added at runtime
  ...(process.env.STRIPE_PRICE_ID_PRO_FOUNDING ? { [process.env.STRIPE_PRICE_ID_PRO_FOUNDING]: 'pro' as const } : {}),
  ...(process.env.STRIPE_PRICE_ID_PRO_STANDARD ? { [process.env.STRIPE_PRICE_ID_PRO_STANDARD]: 'pro' as const } : {}),
  ...(process.env.STRIPE_PRICE_ID_PRO_CURRENT ? { [process.env.STRIPE_PRICE_ID_PRO_CURRENT]: 'pro' as const } : {}),
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

// Attribution fields copied into checkout session metadata at creation time
// (see create-checkout-session). Falls back to the users table for sessions
// that predate the metadata copy.
const ATTRIBUTION_KEYS = [
  'referral_source',
  'landing_page',
  'landing_referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
] as const

async function loadAttribution(
  metadata: Stripe.Metadata | null,
  userId: string
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  let hasAny = false
  for (const key of ATTRIBUTION_KEYS) {
    const value = metadata?.[key]
    out[key] = typeof value === 'string' && value.length > 0 ? value : null
    if (out[key]) hasAny = true
  }
  if (hasAny) return out

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return out

  // select('*') (not a column list) so a not-yet-migrated gclid column can't throw.
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return out

  for (const key of ATTRIBUTION_KEYS) {
    const value = (data as unknown as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.length > 0) out[key] = value
  }
  return out
}

async function loadUserContact(
  userId: string
): Promise<{ email: string | null; name: string | null; createdAt: string | null }> {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return { email: null, name: null, createdAt: null }

  const { data } = await supabase
    .from('users')
    .select('email, full_name, created_at')
    .eq('id', userId)
    .maybeSingle()
  const row = data as {
    email?: string | null
    full_name?: string | null
    created_at?: string | null
  } | null
  return {
    email: row?.email ?? null,
    name: row?.full_name ?? null,
    createdAt: row?.created_at ?? null,
  }
}

function formatSignupDate(createdAt: string | null): string {
  if (!createdAt) return 'unknown'
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'unknown'
  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  return days >= 1 ? `${formatted} (${days} day${days === 1 ? '' : 's'} ago)` : formatted
}

function formatAttributionLines(a: Record<string, string | null>): string[] {
  const hasUtm = a.utm_source || a.utm_medium || a.utm_campaign || a.utm_content || a.utm_term
  return [
    `- Referral source (self-reported): ${a.referral_source ?? 'unknown'}`,
    `- Landing page (first touch): ${a.landing_page ?? 'unknown'}`,
    ...(a.landing_referrer ? [`- Landing referrer: ${a.landing_referrer}`] : []),
    ...(hasUtm
      ? [
          `- UTM source: ${a.utm_source ?? 'none'}`,
          `- UTM medium: ${a.utm_medium ?? 'none'}`,
          `- UTM campaign: ${a.utm_campaign ?? 'none'}`,
          ...(a.utm_content ? [`- UTM content: ${a.utm_content}`] : []),
          ...(a.utm_term ? [`- UTM term: ${a.utm_term}`] : []),
        ]
      : ['- UTM attribution: none (direct / organic)']),
    ...(a.gclid ? [`- Google Ads click (gclid): ${a.gclid}`] : []),
  ]
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

  // Tripwire: log every received event. Best-effort, never blocks the handler.
  try {
    const obj = event.data.object as { customer?: string | { id?: string } | null }
    const customerId =
      typeof obj?.customer === 'string'
        ? obj.customer
        : (obj?.customer as { id?: string } | null)?.id ?? null
    const supabaseLog = getSupabaseClient(undefined, { requireServiceRole: true })
    if (supabaseLog) {
      await supabaseLog
        .from('stripe_webhook_log')
        .upsert(
          { event_id: event.id, event_type: event.type, customer_id: customerId },
          { onConflict: 'event_id', ignoreDuplicates: true }
        )
    }
  } catch (err) {
    console.warn('[Stripe] Failed to log webhook event', err)
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

      await logFunnelEvent(userId ?? null, 'checkout_completed', {
        planTier,
        stripeCustomerId,
        sessionId: session.id,
      })

      // GA4 purchase conversion via Measurement Protocol. The Stripe webhook
      // runs server-side and can't reach the browser gtag, so we POST directly
      // to GA4. amount_total is in cents; GA4 wants a major-unit number.
      const purchaseValue = (session.amount_total ?? 0) / 100
      const purchaseCurrency = (session.currency ?? 'usd').toUpperCase()
      // Prefer the real GA client_id captured at checkout (if present in
      // metadata), else fall back to a stable per-user id so the same user
      // always maps to one GA client.
      const gaClientId = session.metadata?.ga_client_id || deterministicClientId(userId)
      await sendGa4Event({
        clientId: gaClientId,
        userId,
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: session.id,
              value: purchaseValue,
              currency: purchaseCurrency,
              items: [
                {
                  item_id: planTier,
                  item_name: 'thePsychology.ai Pro',
                  price: purchaseValue,
                  quantity: 1,
                },
              ],
            },
          },
        ],
      }).catch((err) => console.error('[Stripe] Failed to send GA4 purchase event:', err))

      // Meta CAPI Purchase. Fires server-side so it survives ad blockers and
      // iOS14 restrictions. Email is hashed inside sendMetaCapiEvent.
      const contactForMeta = await loadUserContact(userId).catch(() => ({ email: null, name: null, createdAt: null }))
      sendMetaCapiEvent({
        events: [{
          name: 'Purchase',
          eventId: session.id,
          email: contactForMeta.email,
          sourceUrl: 'https://thepsychology.ai/dashboard',
          customData: {
            value: purchaseValue,
            currency: purchaseCurrency,
          },
        }],
      }).catch((err) => console.error('[Stripe] Failed to send Meta CAPI purchase event:', err))

      // Slack notification for new subscription (no PII: name/email intentionally omitted)
      await sendSlackNotification(
        `New Pro subscription`,
        'payments'
      )

      // Email notification for new subscription
      // PII (email, signup date) is included here but stays out of Slack: this email
      // goes only to the founder's inbox, Slack goes to a shared channel.
      if (isNotificationEmailConfigured()) {
        const [attribution, contact] = await Promise.all([
          loadAttribution(session.metadata ?? null, userId).catch((err) => {
            console.error('[Stripe] Failed to load attribution for payment email:', err)
            return {} as Record<string, string | null>
          }),
          loadUserContact(userId).catch((err) => {
            console.error('[Stripe] Failed to load user contact for payment email:', err)
            return { email: null, name: null, createdAt: null }
          }),
        ])
        const customerEmail =
          contact.email ?? session.customer_details?.email ?? session.customer_email ?? 'unknown'
        const customerName = contact.name ?? session.customer_details?.name ?? null
        await sendNotificationEmail({
          subject: `New Pro subscription: ${customerEmail}`,
          text: [
            'New Pro subscription!',
            '',
            ...(customerName ? [`Name: ${customerName}`] : []),
            `Email: ${customerEmail}`,
            `First signed up: ${formatSignupDate(contact.createdAt)}`,
            `User ID: ${userId}`,
            `Stripe Customer: ${stripeCustomerId || 'N/A'}`,
            `Session: ${session.id}`,
            '',
            'Attribution:',
            ...formatAttributionLines(attribution),
          ].join('\n'),
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

    // Clear grace period on successful payment (covers retry-after-fail case)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const stripeCustomerId =
        typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as { id?: string } | null)?.id

      if (stripeCustomerId) {
        try {
          const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
          if (supabase) {
            await supabase
              .from('users')
              .update({ grace_period_ends_at: null })
              .eq('stripe_customer_id', stripeCustomerId)
              .not('grace_period_ends_at', 'is', null)
          }
        } catch (err) {
          console.warn('[Stripe] Failed to clear grace_period_ends_at on payment success', err)
        }
      }
    }

    // Handle failed payments
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const customerEmail = invoice.customer_email || 'Unknown'
      const attemptCount = invoice.attempt_count || 1
      const stripeCustomerId =
        typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as { id?: string } | null)?.id

      // Start the 7-day grace countdown if not already running for this customer.
      // Preserved across Stripe Smart Retries so the deadline doesn't reset.
      // Only send the customer email on the FIRST failure (when the update
      // actually flips grace_period_ends_at from null). Later Stripe retries
      // re-fire this webhook but should not spam the user.
      let daysRemaining = 7
      let isFirstFailure = true
      if (stripeCustomerId) {
        try {
          const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
          if (supabase) {
            const graceEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            const { data: updatedRows } = await supabase
              .from('users')
              .update({ grace_period_ends_at: graceEnds })
              .eq('stripe_customer_id', stripeCustomerId)
              .is('grace_period_ends_at', null)
              .select('id')

            isFirstFailure = (updatedRows?.length ?? 0) > 0

            const { data: userRow } = await supabase
              .from('users')
              .select('grace_period_ends_at')
              .eq('stripe_customer_id', stripeCustomerId)
              .single()

            if (userRow?.grace_period_ends_at) {
              const msLeft = new Date(userRow.grace_period_ends_at).getTime() - Date.now()
              daysRemaining = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
            }
          }
        } catch (err) {
          console.warn('[Stripe] Failed to set/read grace_period_ends_at on payment failure', err)
        }
      }
      const daysLabel = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`

      // Stable, never-expiring URL. The dashboard settings page has an
      // "Update Payment Method" button that mints a fresh Stripe portal
      // session at click time — so this link still works no matter how
      // late the user opens the email.
      const settingsUrl = 'https://thepsychology.ai/dashboard/settings'

      // Look up user name and recent topic for personalization
      let recentTopic: string | null = null
      let firstName: string | null = null
      if (stripeCustomerId) {
        try {
          const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
          if (supabase) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, full_name')
              .eq('stripe_customer_id', stripeCustomerId)
              .single()
            if (userData) {
              firstName = userData.full_name?.split(' ')[0] ?? null
              const { data: topicRow } = await supabase
                .from('topic_mastery')
                .select('topic')
                .eq('user_id', userData.id)
                .order('last_attempted', { ascending: false, nullsFirst: false })
                .limit(1)
                .single()
              recentTopic = topicRow?.topic ?? null
            }
          }
        } catch (userErr) {
          console.warn('[Stripe] Could not look up user data for payment failure email', userErr)
        }
      }

      // Send customer-facing email — only on the first failure.
      // Stripe Smart Retries fire this webhook multiple times; we don't
      // want to spam the customer with the same email every retry.
      if (isFirstFailure && customerEmail !== 'Unknown' && isNotificationEmailConfigured(customerEmail)) {
        const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
        const topicLine = recentTopic
          ? `<p>Your lessons on <strong>${recentTopic}</strong> have been tailored to your interests. We'd love to keep that going.</p>`
          : ''

        const intro =
          daysRemaining > 0
            ? `We weren't able to process your payment for your <strong>thePsychology.ai Pro</strong> subscription. You have ${daysLabel} to update your payment method before your account is downgraded to the free plan.`
            : `We weren't able to process your payment for your <strong>thePsychology.ai Pro</strong> subscription and your Pro access has been paused. You can restore it any time by updating your payment method.`
        const introText =
          daysRemaining > 0
            ? `We weren't able to process your payment for your thePsychology.ai Pro subscription. You have ${daysLabel} to update your payment method before your account is downgraded to the free plan.`
            : `We weren't able to process your payment for your thePsychology.ai Pro subscription and your Pro access has been paused. You can restore it any time by updating your payment method.`

        const html = `
<p>${greeting}</p>
<p>${intro}</p>
${topicLine}
<p>Go to your settings page and click the <strong>Update Payment Method</strong> button:</p>
<p><a href="${settingsUrl}" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;border:1px solid #111827;mso-padding-alt:0;"><span style="color:#ffffff;">Open Settings</span></a></p>
<p>Or paste this link into your browser: <a href="${settingsUrl}">${settingsUrl}</a></p>
<p>This is an automated message. If you have any questions, you can reply to this email and Anders will get back to you.</p>
<p>The thePsychology.ai Team</p>
`.trim()

        const text = [
          greeting,
          '',
          introText,
          ...(recentTopic
            ? [`Your lessons on ${recentTopic} have been tailored to your interests. We'd love to keep that going.`]
            : []),
          '',
          'Go to your settings page and click the "Update Payment Method" button:',
          settingsUrl,
          '',
          'This is an automated message. If you have any questions, you can reply to this email and Anders will get back to you.',
          '',
          'The thePsychology.ai Team',
        ].join('\n')

        await sendNotificationEmail({
          to: customerEmail,
          cc: 'DrChan@thepsychology.ai',
          subject: 'Action required: Payment failed for your thePsychology.ai Pro subscription',
          text,
          html,
        })
      }

      await sendSlackNotification(
        `⚠️ Payment failed for ${customerEmail} (attempt ${attemptCount}${isFirstFailure ? ', email sent' : ', email skipped — retry'})`,
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
