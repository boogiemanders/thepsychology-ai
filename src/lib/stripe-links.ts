export type StripeTier = 'pro' | 'pro_coaching'

// Central place to configure Stripe Payment Links for each tier.
// These URLs are created in the Stripe Dashboard (Payment Links).
export const STRIPE_PAYMENT_LINKS: Record<StripeTier, string> = {
  pro: 'https://buy.stripe.com/28EbJ32AD3Fg7f48Ap7Vm00',
  pro_coaching: 'https://buy.stripe.com/dRmbJ32AD1x89nc2c17Vm01',
}

