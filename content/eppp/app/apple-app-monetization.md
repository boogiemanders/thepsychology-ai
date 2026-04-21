# Monetization Decision: Hybrid Model

## Decision

**Hybrid**: Free companion for existing web subscribers + StoreKit subscriptions for new users who discover the app first.

This maximizes reach without abandoning web-first subscribers.

---

## How It Works

### Existing Web Subscribers

- Sign in with their existing account
- App detects active web subscription via Supabase
- Full access granted, no additional purchase needed
- No StoreKit transaction required

### New Users Who Find the App First

- Can browse free tier content (see below)
- Prompted to subscribe via StoreKit In-App Purchase
- Apple takes 15% (Small Business Program, under $1M/year) or 30%
- Subscription entitlement stored in Supabase, accessible on web too

### Users Who Subscribe on Web After Trying App

- Purchase on website (Stripe, no Apple cut)
- App detects web subscription on next sync
- Full access granted

---

## Entitlement Sync Architecture

This is the hardest part of hybrid. Both systems must agree on subscription state.

### Source of Truth

Supabase `subscriptions` table is canonical. Both Stripe webhooks (web) and App Store Server Notifications (iOS) write to it.

### Entitlement Check Flow (App Launch)

```
1. App launches
2. Check local cache for subscription state
3. If online: call /api/mobile/entitlement-check
4. Server checks Supabase subscriptions table
5. Returns { hasAccess: true, source: "stripe" | "storekit", expiresAt: "..." }
6. App caches result locally for offline use
```

### Entitlement Check Flow (Offline)

- Use locally cached entitlement with expiry
- Grace period: 7 days past expiry before locking content
- On reconnect: re-verify immediately

### StoreKit -> Supabase Sync

- App validates receipt with Apple's App Store Server API (server-side)
- On successful validation, upsert into `subscriptions` with `source: 'storekit'`
- Enable App Store Server Notifications V2 for renewals, cancellations, refunds
- Webhook endpoint: `src/app/api/webhooks/apple/route.ts`

### Stripe -> App Awareness

- Already handled: Stripe webhooks update `subscriptions` table
- App reads this on entitlement check
- No changes needed to existing Stripe flow

---

## Subscription Tiers

### Option A: Mirror Web Pricing

Keep the same tiers and pricing as the website. Simpler to explain, but Apple takes a cut on in-app purchases.

### Option B: Simplified App Pricing

Offer a single "Full Access" tier in the app. Avoids confusing tier UI on a small screen.

**Recommendation**: Start with Option B (single tier) for the app. Web can keep multiple tiers. Simplicity wins on mobile, especially for a first release.

---

## Free Tier (No Subscription)

Available to all users without payment:

- 1 diagnostic exam (to hook them)
- 3 sample lessons
- Domain mastery heatmap (shows them what they don't know)
- Exam date countdown
- Study streak tracking
- Quick Question widget (limited to 3 questions/day)

The free tier should be useful enough to create habit but limited enough to drive conversion.

---

## Restore Purchases

Required by Apple. Must work on:

- Fresh install on same device
- New device with same Apple ID
- Device restore from backup

Implementation:
- Call `StoreKit.Transaction.currentEntitlements` on app launch
- Cross-reference with Supabase subscription state
- If StoreKit shows active but Supabase doesn't, re-validate and upsert

---

## Grace Period Handling

### Billing retry (Apple manages)

- Apple retries failed payments for up to 60 days
- During this time, entitlement status is "billing_retry_period"
- Keep access active during retry period

### Voluntary cancellation

- Access continues until end of current billing period
- After expiry: downgrade to free tier
- Cached offline content remains accessible for 7-day grace period
- After grace: lock premium content but don't delete downloads

### Refunds

- Apple notifies via Server Notifications V2
- Revoke access immediately
- Mark subscription as refunded in Supabase

---

## App Store Classification

This app is a **multiplatform subscription app**, not a "reader app."

Reader apps (Netflix, Kindle) can link out to web for purchase. But they cannot sell in-app at all.

Since we want to offer StoreKit purchases for new users, we are NOT a reader app. We must:

- Use StoreKit for all in-app purchase flows
- Not link to the website for the purpose of avoiding Apple's commission
- Handle restore purchases correctly

Existing web subscribers signing in is fine -- Apple allows "multiplatform" apps where users can bring existing subscriptions.

---

## Price Strategy

### Apple's Small Business Program

If total App Store revenue is under $1M/year (almost certainly the case initially):
- Apple takes **15%** instead of 30%
- Apply at: https://developer.apple.com/app-store/small-business-program/

### Pricing Suggestion

- Match or slightly increase web price for in-app to cover Apple's cut
- Example: if web is $29/month, app could be $34.99/month
- Or absorb the difference and treat it as a user acquisition cost
- **Decision needed before Phase 5**

---

## New Backend Work Required

### New API endpoints

- `src/app/api/mobile/entitlement-check/route.ts`
- `src/app/api/webhooks/apple/route.ts` (App Store Server Notifications V2)

### New database columns

- `subscriptions.source` -- 'stripe' | 'storekit' | 'manual'
- `subscriptions.apple_transaction_id` -- for StoreKit receipts
- `subscriptions.apple_original_transaction_id` -- for subscription groups

### StoreKit Configuration

- Create subscription group in App Store Connect
- Configure subscription product IDs
- Set up sandbox testing accounts
- Enable App Store Server Notifications V2

---

## Risks

1. **Entitlement sync bugs** -- User pays on web, app doesn't recognize it (or vice versa). Mitigate with manual "restore" button and support contact.

2. **Apple review pushback** -- Apple may question why web subscribers get free access. This is allowed for multiplatform apps, but have clear reviewer notes ready.

3. **Price confusion** -- Different prices on web vs app. Keep messaging clear: "Subscribe on our website for the best price" is technically not allowed in-app per Apple's rules. Don't say it.

4. **Refund asymmetry** -- Apple refund doesn't trigger Stripe refund and vice versa. Each system manages its own refunds independently.
