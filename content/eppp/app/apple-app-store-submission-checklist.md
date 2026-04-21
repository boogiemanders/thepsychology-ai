# Checklist: Apple App Store Submission Readiness

_Checked against Apple’s official docs on March 26, 2026. Verify again in the week you submit, because App Store Connect asset requirements and policy details do change._

## Purpose

This is the companion checklist for the Apple app plan.

The goal is simple:

- avoid preventable App Store rejection loops
- gather all required assets before opening App Store Connect
- resolve product-policy decisions early instead of during submission week

---

## The Highest-Risk Decisions For This App

These are the Apple decisions that matter most for `thepsychology.ai`.

### 1. Companion app vs full in-app subscription app

Decide this before building the final onboarding and paywall flows.

- If the iPhone app sells digital study access inside the app, plan for **StoreKit In-App Purchase**
- If the iPhone app is a **sign-in-only companion** for existing subscribers who purchased elsewhere, that is a different App Review path and a different conversion strategy

For this product, this is the single biggest submission decision because it affects:

- paywall design
- review notes
- entitlement logic
- website-to-app upgrade flow

### 2. Login strategy

If the app uses only first-party email/password or magic-link auth, Sign in with Apple is not automatically required.

If the app adds a third-party or social sign-in provider as the primary way to access the account, Apple’s Sign in with Apple rule may apply unless an exception is met.

### 3. Account deletion in-app

If the app allows account creation, plan to expose account deletion in the app.

The repo already has backend APIs that can support this:

- [`src/app/api/account/delete/route.ts`](/Users/anderschan/thepsychology-ai/src/app/api/account/delete/route.ts)
- [`src/app/api/account/delete-data/route.ts`](/Users/anderschan/thepsychology-ai/src/app/api/account/delete-data/route.ts)

What is still missing is the user-facing iOS settings flow and the supporting legal copy.

### 4. Privacy disclosures

The App Store privacy questionnaire must match the app’s real behavior, including third-party SDK behavior.

For this app, audit:

- Supabase auth and analytics usage
- crash reporting
- payment SDKs
- any push or attribution SDKs
- any future ad or tracking SDKs

---

## Prerequisites

Have these in place before submission week:

- Apple Developer Program membership
- organization enrollment and D-U-N-S number if submitting as a company
- App Store Connect access for whoever will manage submission
- final bundle ID
- final app name and subtitle
- release plan: manual or automatic release

Do not leave the bundle identifier as a throwaway value. It cannot be changed later.

---

## Metadata You Need Ready

Prepare these before you start the App Store Connect entry:

- app name
- subtitle
- bundle ID
- SKU
- primary category
- secondary category if useful
- description
- keywords
- promotional text
- support URL
- privacy policy URL
- marketing URL if you want one
- review contact email
- review contact phone
- reviewer notes

For this repo, there do **not** appear to be public `privacy`, `terms`, or `support` pages yet. Plan to create them before submission.

Recommended routes to add:

- `/privacy`
- `/terms`
- `/support`

---

## Visual Assets

## App icon

Prepare the final production app icon, not a placeholder.

Do this early because it affects:

- App Store listing
- TestFlight
- device install
- brand recognition in search

## Screenshots

This is the part most likely to go stale, so use Apple’s current matrix, not an old blog post.

### Current Apple guidance as of March 26, 2026

- You must provide at least **1** and at most **10** screenshots per required display class
- If the app UI is the same across iPhone sizes, Apple currently allows a single required iPhone screenshot set using **6.5-inch or 6.9-inch** display assets
- If the app runs on iPad, Apple currently requires one **13-inch iPad** screenshot set

That means the older “prepare 6.7-inch, 6.5-inch, and 5.5-inch iPhone sets for everyone” workflow is no longer the safest assumption.

### Practical rule

In the week you submit:

1. open Apple’s live screenshot specification page
2. export exactly the currently required sizes
3. avoid hard-coding a stale size matrix into your design workflow

### Screenshot content checklist

- screenshots must match the shipping app
- no placeholder screens
- no broken UI states
- no references to unsupported platforms or unfinished features
- if you show a widget, make sure the widget actually works in the submitted build

## App previews

App preview videos are optional.

If used:

- keep them short
- use the real app UI
- make sure nothing shown is out of date by submission time

---

## Legal and Privacy Requirements

## Privacy policy

You need a live privacy policy URL.

It should clearly cover:

- what user data is collected
- what third parties receive it
- how data is used
- how users request deletion
- how to contact support

## App privacy questionnaire

Before submission, audit the real data flows and answer App Store Connect accordingly.

Do not guess. Apple cares whether the answers match the app’s actual behavior.

## Terms

If the app uses subscriptions, create public terms that clearly describe:

- pricing
- billing cadence
- renewal behavior
- cancellation path

## Tracking

If the app tracks users across other companies’ apps or websites, you need to handle Apple’s tracking rules correctly.

If the app does **not** do that, keep the product and SDK stack simple and avoid creating extra review risk.

## SDK privacy manifests

Before submission, audit all iOS SDKs for:

- privacy manifests
- required reason APIs

This should happen before the first TestFlight beta, not at the end.

---

## Payments and Account Rules

## In-App Purchase

If users can buy digital study access inside the iPhone app, use Apple’s In-App Purchase system.

For this product, that means:

- subscriptions bought in the app should use StoreKit
- restore purchases must work
- the review build must have a working purchase path if purchase is exposed in the app

## Sign in with Apple

If you add Google or similar third-party sign-in, check whether Sign in with Apple becomes mandatory for your login setup.

If you stay with first-party email/password or magic-link auth only, this is simpler.

## Account deletion

Apple expects deletion to be accessible from inside the app, not only through support email.

The backend already has a head start:

- delete account endpoint
- delete data endpoint

What still needs to exist:

- account settings screen in the iPhone app
- clear user copy explaining delete account vs delete data
- support and privacy docs that match the in-app behavior

---

## Review Materials

Have these ready for every submission:

- working review account
- clear reviewer notes
- contact email that someone is actually monitoring
- contact phone that someone can answer during review hours

For this app, reviewer notes should explain:

- how sign-in works
- whether purchase is in-app or web-managed
- how to access downloaded lessons and exams
- how the widget works
- where to find account deletion
- any feature that only appears after completing an exam

If a feature is not obvious, explain it in reviewer notes.

---

## Product-Specific App Store Checklist

Use this for the actual build that goes to review.

### Core functionality

- app launches cleanly on a real device
- sign-in works
- sign-out works
- offline lesson reading works in airplane mode
- offline audio playback works in airplane mode
- offline practice exam flow works in airplane mode
- reconnect and sync works after airplane mode is disabled
- widget loads real data
- widget actions do not break when offline

### Compliance

- support URL is live
- privacy policy URL is live
- terms page is live if subscriptions are used
- App Store privacy answers match actual SDK and backend behavior
- if using third-party login, Sign in with Apple requirement has been evaluated
- if allowing account creation, account deletion is accessible in-app
- payment path follows Apple’s rules for digital purchases

### Listing quality

- app name is final
- subtitle is final
- description matches actual features
- screenshots match the exact build under review
- no placeholder copy
- no broken screenshots
- no outdated UI shown in the listing

### Review readiness

- demo account works
- reviewer notes explain hidden flows
- release setting is correct
- right build is attached to the version
- export compliance questions are answered

---

## Recommended Submission Sequence

Do this in order:

1. Finalize the monetization decision.
2. Add public `privacy`, `terms`, and `support` pages.
3. Build the in-app account settings and deletion flow.
4. Freeze the review build.
5. Complete the App Privacy audit.
6. Generate screenshots from the final build using Apple’s current screenshot matrix.
7. Create reviewer credentials and notes.
8. Submit with manual release enabled.

Manual release is safer for a first submission because it lets you control timing after approval.

---

## StoreKit Testing Checklist (Hybrid Model)

Since the app uses hybrid monetization (companion + StoreKit), test all of these before submission:

### Sandbox Purchase Testing

- [ ] New user can purchase subscription via StoreKit in sandbox
- [ ] Purchase grants immediate access to premium content
- [ ] Subscription state persists across app restart
- [ ] Subscription state syncs to Supabase `subscriptions` table
- [ ] Sandbox renewal cycles work (accelerated renewals in sandbox)
- [ ] Cancellation in sandbox revokes access at period end
- [ ] Restore purchases works on fresh install with same sandbox Apple ID
- [ ] Restore purchases works on different device with same sandbox Apple ID

### Hybrid Entitlement Testing

- [ ] Web subscriber (Stripe) signs into app -> gets full access without StoreKit purchase
- [ ] StoreKit subscriber signs into website -> gets full access without Stripe purchase
- [ ] Free tier user sees correct content gating (1 diagnostic, 3 sample lessons, limited widget)
- [ ] Expired web subscription correctly downgrades in app
- [ ] Expired StoreKit subscription correctly downgrades in app and on web
- [ ] Grace period (7 days) works for offline cached entitlements
- [ ] Refund via Apple correctly revokes access
- [ ] User with both web and app subscriptions doesn't get double-charged messaging

### App Store Server Notifications V2

- [ ] Webhook endpoint receives and processes subscription events
- [ ] Renewal events update Supabase correctly
- [ ] Cancellation events update Supabase correctly
- [ ] Refund events revoke access correctly
- [ ] Billing retry events maintain access during retry period

### Edge Cases

- [ ] User purchases in app, then cancels, then purchases on web -> access continues
- [ ] User is offline when subscription expires -> grace period applies
- [ ] User signs out and signs in with different account -> entitlements update correctly
- [ ] Reviewer account has access to all features without purchase (use reviewer notes to explain)

---

## What Apple Actually Tends To Reject Here

For this app, the most likely rejection buckets are:

- purchase flow does not match Apple’s rules
- privacy disclosures do not match actual data collection
- reviewer cannot log in or reach the right feature state
- account deletion is missing or too hidden
- listing screenshots do not match the build
- offline or widget features shown in metadata do not actually work in the submitted build

This is why submission is less about “is the app good?” and more about “did we prepare the package correctly?”

---

## Review Timing

Apple says **90% of submissions are reviewed in less than 24 hours**.

That does not mean the first submission gets approved in 24 hours. It means incomplete submissions fail fast too.

The best way to stay out of a revision loop is:

- final build only
- complete metadata
- real reviewer account
- live URLs
- accurate privacy answers

---

## Sources

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect release notes: https://developer.apple.com/app-store-connect/release-notes/
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- Add an app privacy policy: https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-privacy-policy
- Required localizable and editable properties: https://developer.apple.com/help/app-store-connect/reference/required-localizable-and-editable-properties/
- Add app information: https://developer.apple.com/help/app-store-connect/manage-app-information/add-app-information
- Choose a category: https://developer.apple.com/help/app-store-connect/manage-app-information/choose-a-category/
- App Review information: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/provide-app-review-information
- Manage Sign in with Apple availability: https://developer.apple.com/help/app-store-connect/configure-sign-in-with-apple-for-the-app/apple-sign-in-availability/
- Sign in with Apple for apps and websites: https://developer.apple.com/help/account/configure-app-capabilities/configure-sign-in-with-apple-for-the-web
- Offer auto-renewable subscriptions: https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/
- Determine and upload app previews: https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications
- Completing export compliance documentation: https://developer.apple.com/help/app-store-connect/manage-app-information/complying-with-encryption-export-regulations/

