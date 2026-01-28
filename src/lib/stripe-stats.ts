import Stripe from 'stripe'

/**
 * Count checkout.session.completed events in the last 24 hours.
 * Returns 0 if Stripe is not configured or on error.
 */
export async function getStripeConversionsLast24h(): Promise<number> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return 0
  }

  const stripe = new Stripe(secretKey)
  const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60

  try {
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      created: { gte: since },
      limit: 100,
    })
    return events.data.length
  } catch (error) {
    console.error('[stripe-stats] Error fetching events:', error)
    return 0
  }
}
