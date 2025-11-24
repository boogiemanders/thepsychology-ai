export type StripeTier = 'pro' | 'pro_coaching'

// Central place to configure Stripe Payment Links for each tier.
// These URLs are created in the Stripe Dashboard (Payment Links).
export const STRIPE_PAYMENT_LINKS: Record<StripeTier, string> = {
  pro: 'https://buy.stripe.com/4gM5kC6YjgvT7Bp39g8Vi00',
  pro_coaching: 'https://buy.stripe.com/dRm7sK82nfrP8Ft7pw8Vi01',
}

