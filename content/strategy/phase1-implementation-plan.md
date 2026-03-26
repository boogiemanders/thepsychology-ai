# Phase 1: Foundation — Database + Provider Profiles + Client Intake

## Context

thepsychology.ai is currently an EPPP exam prep platform. Phase 1 adds the foundational layer for a clinical matching platform: user roles, provider profiles, client intake, and PHI audit logging. Nothing from the matching/booking/insurance phases can be built without this.

The existing codebase has marketing landing pages at `/provider` and `/client` but zero functional backend for clinical matching. Stripe subscription infra exists for students but not providers.

---

## Implementation Order

### Step 1 — Database Migration

**File:** `supabase/migrations/20260326_phase1_clinical_matching.sql`

Single migration with 4 sections:

**1A. ALTER `public.users`** — add role system:
```sql
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('student', 'client', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS user_role public.user_role NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS secondary_roles TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_users_user_role ON public.users(user_role);
```

**1B. `provider_profiles` table:**
- Credentials: `license_type`, `license_number`, `license_state`, `npi_number`, `multi_state_licensed`, `licensed_states[]`, `credential_verified_at/by`
- Specializations: `modalities[]`, `conditions_treated[]`, `populations_served[]`
- Therapeutic style: 4 SMALLINT(1-10) scales — `style_directive`, `style_present_focused`, `style_insight_behavioral`, `style_warmth_professional`
- Cultural: `languages_spoken[]`, `lgbtq_affirming`, `faith_integrated`, `faith_traditions[]`, `racial_cultural_focus[]`
- Practical: `insurance_networks[]`, `accepts_self_pay`, `self_pay_rate_cents`, `sliding_scale_available/min`, `telehealth_only`, `telehealth_states[]`
- Text + embeddings: `bio_text`, `approach_text`, `bio_embedding vector(1536)`, `approach_embedding vector(1536)`
- Status: `status TEXT CHECK (IN draft/pending_review/active/suspended/inactive)` default `'draft'`
- `UNIQUE(user_id)`, FK to `auth.users(id) ON DELETE CASCADE`
- RLS: own-profile CRUD + active profiles publicly readable + service_role full access
- IVFFlat vector indexes (lists=100), `updated_at` trigger via existing `update_updated_at_column()`

**1C. `client_intake_profiles` table:**
- Concerns: `conditions_seeking_help[]`, `concern_severity SMALLINT(1-10)`, `presenting_concerns_text`
- History: `has_previous_therapy`, `previous_therapy_count`, `what_worked_text`, `what_didnt_work_text`
- Preferences: `preferred_modalities[]`, `preferred_therapist_gender`, `preferred_therapist_age`, 4 style scales mirroring provider, `lgbtq_affirming_required`, `faith_integrated_preferred`, `cultural_background`
- Insurance: `has_insurance`, `insurance_payer_name/id/member_id/group_number/plan_name`, `interested_in_self_pay`, `max_self_pay_rate_cents`
- Practical: `state_of_residence`, `telehealth_preference`, `availability_notes`
- Embeddings: `concern_embedding vector(1536)`, `preferences_embedding vector(1536)`
- Consent gates: `hipaa_consent_given_at TIMESTAMPTZ`, `matching_consent_given_at TIMESTAMPTZ`
- `UNIQUE(user_id)`, same FK/RLS/trigger pattern. Clients own their data, service_role reads all.

**1D. `phi_access_log` table** — immutable audit:
- `accessor_id`, `accessor_role`, `client_id`, `access_type` (enum of intake_view/insurance_view/profile_match_view/admin_view/export), `resource_table`, `resource_id`, `ip_address INET`, `user_agent`, `request_id`
- RLS: INSERT by service_role only, SELECT by service_role + own client_id. No UPDATE/DELETE policies.

---

### Step 2 — Types + Constants + Schemas

**Create `src/types/matching.ts`:**
- TypeScript interfaces for `ProviderProfile`, `ClientIntakeProfile`, `PhiAccessLogEntry`
- Type aliases: `UserRole`, `ProviderStatus`, `PhiAccessType`

**Create `src/lib/matching-constants.ts`:**
- Vocabulary arrays shared by UI and schemas: `MODALITIES`, `CONDITIONS`, `POPULATIONS`, `INSURANCE_PAYERS`, `FAITH_TRADITIONS`, `LAUNCH_STATES`

**Create `src/lib/matching-schemas.ts`:**
- Per-step zod schemas for provider onboarding (credentials, specializations, style, cultural, practical, bio)
- Per-step zod schemas for client intake (consent, concerns, history, preferences, insurance, practical)
- Combined `providerOnboardSchema` and `clientIntakeSchema` for final validation
- **First use of zod validation in the project** — establishes the pattern

---

### Step 3 — Server Helpers

**Create `src/lib/supabase-matching.ts`:**
- `getProviderProfile(userId)` — fetch from `provider_profiles`
- `upsertProviderProfile(userId, data)` — insert or update
- `submitProviderProfile(userId)` — change status draft → pending_review (validates all required fields)
- `getClientIntake(userId)` — fetch from `client_intake_profiles`
- `upsertClientIntake(userId, data)` — insert or update
- `logPhiAccess(params)` — insert into `phi_access_log` (service role only)
- All use `getSupabaseClient()` from existing `src/lib/supabase-server.ts`

---

### Step 4 — Auth Context Update

**Modify `src/context/auth-context.tsx`:**
- Add to `UserProfile` interface: `user_role: 'student' | 'client' | 'provider' | 'admin'`, `secondary_roles: string[]`
- Add derived booleans to context: `isProvider`, `isClient`, `isAdmin`
- No query changes needed — existing `select('*')` auto-picks up new columns

---

### Step 5 — Shared UI Components

**Install shadcn components** (run `bunx shadcn@latest add form radio-group`):
- `src/components/ui/form.tsx` — FormProvider wrapper for react-hook-form
- `src/components/ui/radio-group.tsx` — Radix radio-group wrapper

**Create reusable wizard:**
- `src/components/wizard/WizardProvider.tsx` — context with `currentStep`, `totalSteps`, `stepTitles`, `data` accumulator, `setStepData`, `next`, `prev`, `goToStep`
- `src/components/wizard/WizardStep.tsx` — renders current step with Progress bar
- `src/components/wizard/WizardNavigation.tsx` — Back/Continue/Submit buttons with `onNext` validation gate
- `src/components/wizard/index.ts` — barrel export

Pattern: each wizard step has its own `useForm` + zod schema. On "Continue", `handleSubmit` validates → `setStepData` → `next()`. Keeps steps independent.

---

### Step 6 — API Routes

**`src/app/api/provider/profile/route.ts`** — GET (fetch own) + POST (upsert partial):
- Auth: Bearer token → `getSupabaseClient({ requireServiceRole: true })` → `auth.getUser()`
- Authorization: `user_role = 'provider'` OR `secondary_roles` includes `'provider'`
- POST validates body against partial providerOnboardSchema

**`src/app/api/provider/profile/submit/route.ts`** — POST (draft → pending_review):
- Same auth. Validates full providerOnboardSchema (all required fields).
- Sends Slack notification via existing `sendSlackNotification()`

**`src/app/api/client/intake/route.ts`** — GET + POST (upsert partial):
- Auth: `user_role = 'client'`
- No embeddings written here — async job later

**`src/app/api/client/intake/consent/route.ts`** — POST (record consent timestamps):
- Sets `hipaa_consent_given_at` / `matching_consent_given_at` = NOW()
- Logs to `phi_access_log`

---

### Step 7 — Provider Onboarding Wizard

**`src/app/provider/onboard/page.tsx`** — Server Component (metadata only)
**`src/app/provider/onboard/onboard-client.tsx`** — "use client" compositor

**7 steps under `src/app/provider/onboard/steps/`:**
1. `step-credentials.tsx` — license type, number, state (CA/NY only), NPI, multi-state
2. `step-specializations.tsx` — modalities, conditions, populations (multi-select checkboxes from constants)
3. `step-style.tsx` — 4 slider scales with clinical vignette anchors explaining each dimension
4. `step-cultural.tsx` — languages, LGBTQ+ affirming, faith, racial/cultural focus
5. `step-practical.tsx` — insurance networks, self-pay rate, sliding scale, telehealth states
6. `step-bio.tsx` — bio text + approach text (Textarea with char counter)
7. `step-review.tsx` — summary of all entered data, "Submit for Review" button

Each step auto-saves to API on advance (POST to `/api/provider/profile`). Final submit calls `/api/provider/profile/submit`.

---

### Step 8 — Provider Dashboard + Profile

**`src/app/provider/dashboard/page.tsx`** + `dashboard-client.tsx`:
- Shows profile status (draft/pending_review/active)
- "Complete your profile" CTA if draft
- Quick stats placeholder (clients matched, upcoming sessions — zeroed for now)

**`src/app/provider/profile/[slug]/page.tsx`:**
- Public-facing provider profile page (only for `status = 'active'`)
- Displays: name, bio, modalities, conditions, style summary, languages, insurance networks

---

### Step 9 — Client Intake Wizard

**`src/app/find-therapist/intake/page.tsx`** + `intake-client.tsx`

**7 steps under `src/app/find-therapist/intake/steps/`:**
1. `step-consent.tsx` — HIPAA consent + matching consent (must both be checked, calls `/api/client/intake/consent`)
2. `step-concerns.tsx` — conditions multi-select, severity slider, free-text
3. `step-history.tsx` — previous therapy experience, what worked/didn't
4. `step-preferences.tsx` — modality preferences, therapist gender/age, 4 style sliders
5. `step-insurance.tsx` — insurance details or self-pay preference
6. `step-practical.tsx` — state of residence (CA/NY), telehealth preference, availability
7. `step-complete.tsx` — confirmation page, "You're all set — we'll find your matches" (placeholder for Phase 2)

Each step auto-saves to `/api/client/intake`. Consent step must pass before proceeding.

---

### Step 10 — Middleware

**Modify `middleware.ts`:**
- Add auth guard: check for Supabase session cookie (`sb-*-auth-token`). If absent, redirect to `/login?next=<path>`.
- Protected prefixes: `/provider/onboard`, `/provider/dashboard`, `/find-therapist/intake`, `/find-therapist/book`
- Extend `config.matcher` with new prefixes
- **Do NOT touch** existing homepage A/B logic or SENSE proxy

Role enforcement happens in page components / API routes, not middleware (no DB calls in middleware).

---

## Files Summary

**New files (36):**
```
supabase/migrations/20260326_phase1_clinical_matching.sql
src/types/matching.ts
src/lib/matching-constants.ts
src/lib/matching-schemas.ts
src/lib/supabase-matching.ts
src/components/ui/form.tsx              (via bunx shadcn@latest add form)
src/components/ui/radio-group.tsx       (via bunx shadcn@latest add radio-group)
src/components/wizard/WizardProvider.tsx
src/components/wizard/WizardStep.tsx
src/components/wizard/WizardNavigation.tsx
src/components/wizard/index.ts
src/app/api/provider/profile/route.ts
src/app/api/provider/profile/submit/route.ts
src/app/api/client/intake/route.ts
src/app/api/client/intake/consent/route.ts
src/app/provider/onboard/page.tsx
src/app/provider/onboard/onboard-client.tsx
src/app/provider/onboard/steps/step-credentials.tsx
src/app/provider/onboard/steps/step-specializations.tsx
src/app/provider/onboard/steps/step-style.tsx
src/app/provider/onboard/steps/step-cultural.tsx
src/app/provider/onboard/steps/step-practical.tsx
src/app/provider/onboard/steps/step-bio.tsx
src/app/provider/onboard/steps/step-review.tsx
src/app/provider/dashboard/page.tsx
src/app/provider/dashboard/dashboard-client.tsx
src/app/provider/profile/[slug]/page.tsx
src/app/find-therapist/intake/page.tsx
src/app/find-therapist/intake/intake-client.tsx
src/app/find-therapist/intake/steps/step-consent.tsx
src/app/find-therapist/intake/steps/step-concerns.tsx
src/app/find-therapist/intake/steps/step-history.tsx
src/app/find-therapist/intake/steps/step-preferences.tsx
src/app/find-therapist/intake/steps/step-insurance.tsx
src/app/find-therapist/intake/steps/step-practical.tsx
src/app/find-therapist/intake/steps/step-complete.tsx
```

**Modified files (2):**
```
src/context/auth-context.tsx            (add user_role, secondary_roles, isProvider/isClient/isAdmin)
middleware.ts                           (add auth guards + extend matcher)
```

## Critical Existing Files to Reference

- `src/context/auth-context.tsx` — UserProfile interface, select('*') pattern
- `middleware.ts` — existing A/B + SENSE logic to preserve
- `supabase/migrations/20260312_create_eppp_exam_results.sql` — canonical table creation + RLS pattern
- `supabase/migrations/20251230_add_consent_and_research_system.sql` — immutable audit log pattern
- `supabase/migrations/20260304_harden_new_user_profile_defaults.sql` — trigger pattern (DROP IF EXISTS + CREATE)
- `src/lib/supabase-server.ts` — `getSupabaseClient()` for API routes
- `src/lib/supabase.ts` — browser client singleton
- `src/components/onboarding/OnboardingProvider.tsx` — step-state context pattern to mirror
- `src/components/consent-modal.tsx` — consent UI pattern (Switch + Accordion)
- `src/app/dashboard/settings/research-profile/page.tsx` — multi-section form layout pattern
- `src/lib/matching-constants.ts` — single source of truth for all vocabulary arrays

## Verification

1. **DB**: Run migration → verify tables/columns/indexes in Supabase dashboard
2. **RLS**: INSERT into `phi_access_log` as anon user → expect 403. UPDATE → expect error (no policy).
3. **Auth context**: Login → check `userProfile.user_role === 'student'` (default). Manually set to `'provider'` → confirm `isProvider === true`
4. **API**: POST `/api/provider/profile` without auth → 401. With student role → 403. With provider role + valid body → 200.
5. **Provider wizard**: Visit `/provider/onboard` logged out → redirect to login. Step through all 7 steps. Submit with missing fields → inline zod errors. Complete → verify `provider_profiles` row with `status = 'draft'`. Submit for review → `status = 'pending_review'`.
6. **Client intake**: Visit `/find-therapist/intake` → consent step blocks without both checkboxes. Complete all steps → verify `client_intake_profiles` row. Verify `hipaa_consent_given_at` timestamp set.
7. **PHI audit**: After any intake/consent action → query `phi_access_log` for matching row.
8. **Middleware**: Visit `/provider/onboard` logged out → redirects to `/login?next=/provider/onboard`. Existing `/` A/B and `/SENSE` routes unaffected.

---

## Future Enhancements (Queued for Phase 2+)

### Client-to-Provider Profile Highlights
When viewing a provider profile, clients should be able to highlight specific sections they find appealing (e.g. "Your approach to trauma work resonated with me" or "I appreciated seeing you speak Spanish"). This gives providers insight into what attracts clients — which parts of their profile are working and what people appreciate. Implementation: lightweight reactions/highlights table linking `client_id`, `provider_id`, `profile_section`, and optional free text. Surface aggregated highlights in the provider dashboard as a "What clients notice" insights panel.
