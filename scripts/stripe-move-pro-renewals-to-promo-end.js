/**
 * Moves existing Pro subscribers' next billing date to the promo end (Jan 22).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-move-pro-renewals-to-promo-end.js --dry-run
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-move-pro-renewals-to-promo-end.js --apply
 *
 * Optional:
 *   PROMO_PRO_END_AT=2026-02-01T04:59:59.000Z (default matches Jan 31 23:59:59 EST)
 *
 * Notes:
 * - This script targets subscriptions that include your "pro" price ID (defaults match your webhook mappings).
 * - Stripe may restrict updating `billing_cycle_anchor` for some subscriptions; failures are logged.
 */

const Stripe = require('stripe')

const PRO_PRICE_IDS = new Set([
  // Live
  'price_1SWv6wAHUPMmLYsCy5yObtDu',
  // Test
  'price_1SaZCyAHUPMmLYsChA0LhNDs',
])

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  return {
    dryRun: args.has('--dry-run') || (!args.has('--apply')),
    apply: args.has('--apply'),
  }
}

function parsePromoEndSeconds() {
  const endAt = process.env.PROMO_PRO_END_AT || '2026-02-01T04:59:59.000Z'
  const ms = Date.parse(endAt)
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid PROMO_PRO_END_AT: ${endAt}`)
  }
  return Math.floor(ms / 1000)
}

async function main() {
  const { dryRun, apply } = parseArgs(process.argv)
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error('Missing STRIPE_SECRET_KEY')

  const promoEndSeconds = parsePromoEndSeconds()
  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

  console.log(`[promo] Target billing_cycle_anchor: ${promoEndSeconds} (${new Date(promoEndSeconds * 1000).toISOString()})`)
  console.log(`[promo] Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}`)

  let updated = 0
  let scanned = 0

  for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
    scanned++

    const items = sub.items?.data || []
    const matchesPro = items.some((it) => it?.price?.id && PRO_PRICE_IDS.has(it.price.id))
    if (!matchesPro) continue

    const currentEnd = sub.current_period_end
    const alreadyAtOrAfter = typeof currentEnd === 'number' && currentEnd >= promoEndSeconds
    console.log(
      `[sub] ${sub.id} customer=${sub.customer} current_period_end=${currentEnd} status=${sub.status} ${alreadyAtOrAfter ? '(already >= promo end)' : ''}`
    )

    if (alreadyAtOrAfter) continue

    if (!apply) continue

    try {
      await stripe.subscriptions.update(sub.id, {
        billing_cycle_anchor: promoEndSeconds,
        proration_behavior: 'none',
      })
      updated++
      console.log(`[ok] Updated ${sub.id} billing_cycle_anchor -> ${promoEndSeconds}`)
    } catch (err) {
      console.warn(`[fail] ${sub.id}: ${err && err.message ? err.message : String(err)}`)
    }
  }

  console.log(`[done] scanned=${scanned} updated=${updated}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
