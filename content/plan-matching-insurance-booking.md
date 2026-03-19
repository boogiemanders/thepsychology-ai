# Plan: Clinical Fit Matching + Real-Time Insurance Verification + Booking

## Context

thepsychology.ai is currently an EPPP exam prep platform for psychology students. The competitive research (see `content/competitive-pain-points.md`) shows a massive gap in the patient-clinician matching market:

- **Directories** (Psychology Today, Mental Health Match) don't book or verify insurance
- **Insurance platforms** (Headway, Alma, Grow, Rula) bait-and-switch on rates/referrals
- **Employer platforms** (Lyra, Spring Health, Tava) exclude most Americans
- **Consumer teletherapy** (BetterHelp, Talkspace) violates privacy, underpays clinicians
- **Generic booking** (Zocdoc) charges per-booking and has zero mental health specialization
- **The one good matcher** (Two Chairs) takes 2-6 weeks and is out-of-network only

The strategic advantage: EPPP students who study on the platform graduate, pass the EPPP, get licensed, and become providers who list on the platform. This is a built-in supply pipeline no competitor has.

**Market**: $8.97B U.S. digital mental health market, 18% CAGR, $1.06B VC investment in 2024.

---

## Key Decisions

- **Launch market**: California + New York, **telehealth/remote only** first (no in-person)
- **MVP matching**: Layers 1+2 only (structured scoring). AI re-ranking (Layer 3) added later with outcome data.
- **Revenue model**: Freemium + subscription. Free tier (5 client cap) → Pro ($99/mo, unlimited)
- **Video**: Include Daily.co telehealth integration in MVP

---

## Architecture Decision: Same App, Route Groups

Keep as a single Next.js app. The EPPP-to-provider pipeline is the moat — splitting into separate apps breaks that flywheel.

- `/find-therapist/*` — patient-facing matching and booking
- `/provider/*` — therapist dashboard, profile, calendar, clients
- `/api/matching/*`, `/api/insurance/*`, `/api/booking/*` — new API groups
- Existing routes (`/dashboard`, `/admin`, `/quizzer`, etc.) remain untouched
- **Launch scope**: CA + NY licensed providers, telehealth only (no office addresses in MVP)

---

## Phase 1: Foundation — Database + Provider Profiles (Weeks 1-4)

### 1A. User Role System

Add to existing `public.users` table:
- `user_role` column (`student | patient | provider | admin`, default `student`)
- `secondary_roles` array (a graduated student becomes a provider too)

Update middleware to route-protect `/provider/*` and `/find-therapist/book/*`.

**Files:**
- `supabase/migrations/YYYYMMDD_add_user_roles.sql`
- `middleware.ts` (extend route matchers)
- `src/context/auth-context.tsx` (extend `UserProfile` interface with role)

### 1B. Provider Profiles Table

New `provider_profiles` table with:
- **Credentials**: license type/number/state, NPI, multi-state licensure, verification status
- **Specializations** (structured arrays): therapy modalities (CBT, DBT, EMDR, etc.), conditions treated, populations served
- **Therapeutic style** (1-10 scales): directive↔collaborative, structured↔exploratory, warmth↔challenge, formal↔casual
- **Cultural competencies**: languages, LGBTQ+ affirming, faith-integrated, racial/cultural, etc.
- **Practical**: insurance networks, self-pay rate, sliding scale, telehealth states (CA, NY for MVP — no office address needed)
- **Semantic matching fields**: `bio_embedding` and `approach_embedding` (pgvector, reusing existing pattern from `recover_chunks`)
- **Status lifecycle**: draft → pending_review → active → suspended/inactive

RLS policies: providers manage their own profile; active profiles publicly readable for matching.

**Files:**
- `supabase/migrations/YYYYMMDD_create_provider_tables.sql`
- `src/app/provider/onboarding/page.tsx` — multi-step wizard
  - Steps: credentials, specializations, style assessment (via clinical vignettes), cultural competencies, insurance setup, bio + photo, availability
- `src/app/provider/dashboard/page.tsx`
- `src/app/provider/profile/page.tsx`
- `src/app/api/provider/create-profile/route.ts`
- `src/app/api/provider/update-profile/route.ts`

### 1C. Patient Intake Profiles Table

New `patient_intake_profiles` table with:
- **Presenting concerns**: conditions (same taxonomy as provider specializations), severity, free-text description
- **Previous therapy experience**: what worked, what didn't
- **Therapist preferences**: modality, gender, age range, style preferences (same 1-10 scales)
- **Cultural preferences**: languages, cultural competencies, faith preference
- **Insurance info**: payer ID, member ID, group number, plan name
- **Practical**: location, telehealth preference, availability windows
- **Embeddings**: `concern_embedding`, `preferences_embedding`
- **Consent gates**: `hipaa_consent_given_at`, `matching_consent_given_at`

**Files:**
- `supabase/migrations/YYYYMMDD_create_patient_intake.sql`
- `src/app/find-therapist/page.tsx` — landing page
- `src/app/find-therapist/intake/page.tsx` — multi-step intake questionnaire (5-10 min)

### 1D. PHI Access Audit Log

New `phi_access_log` table — every time PHI is accessed (matching, profile view, booking, insurance check), it's logged with accessor, patient, access type, IP address. Extends existing `consent_audit_log` pattern.

---

## Phase 2: Matching Algorithm (Weeks 3-6)

### Three-Layer Scoring Pipeline

**Layer 1 — Hard Filters** (eliminate non-viable):
- Provider licensed in patient's state
- Accepting new clients
- At least one session format overlap
- (Insurance match is a soft filter — OON providers shown lower, not eliminated)

**Layer 2 — Weighted Multi-Dimensional Scoring** (0-100):

| Dimension | Weight | Method |
|---|---|---|
| Specialization match | 0.25 | Jaccard similarity: patient concerns vs provider specializations |
| Modality match | 0.15 | Jaccard similarity: preferred vs offered modalities |
| Semantic concern match | 0.20 | Cosine similarity: concern_embedding vs bio/approach embeddings |
| Style compatibility | 0.15 | Inverted Euclidean distance on 4 style dimensions |
| Cultural fit | 0.10 | Weighted match on language, competencies, faith preference |
| Practical convenience | 0.10 | Distance/telehealth + availability overlap |
| Demographic preference | 0.05 | Gender/age preference match |

**Layer 3 — AI Re-ranking** (DEFERRED — post-MVP, after 200+ outcomes):
- Send patient free-text + provider bios/approaches + Layer 2 scores to Claude
- LLM returns re-ranked scores + personalized "why this therapist might be a good fit" explanation
- Uses existing Anthropic SDK (`@anthropic-ai/sdk` already in package.json)
- **Not included in MVP** — ship Layers 1+2, collect outcome data, then add Layer 3

### Outcome Learning

New `match_outcomes` table tracks: clicked, booked, initial session completed, sessions completed, satisfaction rating, continued after 3 sessions. After 200+ outcomes, weekly cron job adjusts dimension weights via logistic regression.

**Files:**
- `src/lib/matching/hard-filters.ts`
- `src/lib/matching/score-engine.ts`
- `src/lib/matching/ai-reranker.ts`
- `src/lib/matching/embeddings.ts`
- `src/lib/matching/outcome-tracker.ts`
- `src/lib/matching/types.ts`
- `src/app/api/matching/find-matches/route.ts`
- `src/app/api/matching/explain-match/route.ts`
- `src/app/api/matching/feedback/route.ts`
- `src/app/find-therapist/results/page.tsx` — ranked results with explanations
- `src/app/find-therapist/provider/[slug]/page.tsx` — individual provider page
- `supabase/migrations/YYYYMMDD_create_match_outcomes.sql`

---

## Phase 3: Insurance Verification (Weeks 5-8)

### Third-Party: Stedi API

Stedi handles real-time 270/271 X12 eligibility transactions via a REST/JSON API. Better DX than Availity or Change Healthcare.

### New Tables
- `insurance_payers` — payer directory (cached from Stedi)
- `provider_insurance_networks` — which providers are in which networks
- `insurance_verifications` — cached verification results (24-hour TTL)

### Flow
1. Patient enters insurance in intake
2. Top 10 matches trigger async verification calls to Stedi
3. Results cached 24 hours
4. UI shows: "In-network: $30 copay" or "Out-of-network" or "Verifying..."
5. Edge cases: secondary insurance, OON benefits, deductible status

**Files:**
- `src/lib/insurance/stedi-client.ts`
- `src/lib/insurance/eligibility-parser.ts`
- `src/app/api/insurance/verify/route.ts`
- `src/app/api/insurance/payers/route.ts`
- `src/app/api/insurance/benefits-summary/route.ts`
- `supabase/migrations/YYYYMMDD_create_insurance_tables.sql`

**Env vars:** `STEDI_API_KEY`, `STEDI_ENVIRONMENT`

---

## Phase 4: Booking System (Weeks 7-10)

### New Tables
- `provider_availability` — recurring weekly schedule templates
- `provider_blocked_times` — overrides (vacation, personal, with optional iCal RRULE)
- `appointment_types` — configurable per-provider (initial consult, follow-up, couples, etc.)
- `appointments` — the actual bookings with full status lifecycle (pending → confirmed → completed/cancelled/no_show/rescheduled)
- `waitlist_entries` — for providers at capacity

### Calendar Sync
Google Calendar API (or Nylas) via OAuth:
- Provider connects external calendar
- Two-way sync: external blocks → `provider_blocked_times`; new appointments → external calendar events
- New table: `provider_calendar_connections` (OAuth tokens, encrypted)

### Telehealth Video Integration (Daily.co)
- Provider gets a persistent Daily.co room URL on profile creation
- When patient books, a unique room token is generated with expiry matching appointment time
- Video room URL stored on `appointments.video_room_url`
- Minimal in-app video UI: join button on appointment card, opens Daily.co prebuilt component
- New table: `provider_video_rooms` (room_name, room_url, provider_profile_id)

**Files:**
- `src/lib/video/daily-client.ts` — Daily.co API wrapper (create room, generate token)
- `src/components/video/video-session.tsx` — Daily.co prebuilt React component wrapper
- `src/app/session/[appointmentId]/page.tsx` — video session page

**Env vars:** `DAILY_API_KEY`

### Reminders
Vercel cron job (same pattern as existing `src/app/api/cron/`) sends 24h and 1h reminders via Resend.

**Files:**
- `supabase/migrations/YYYYMMDD_create_booking_tables.sql`
- `src/app/api/booking/available-slots/route.ts`
- `src/app/api/booking/create/route.ts`
- `src/app/api/booking/cancel/route.ts`
- `src/app/api/booking/reschedule/route.ts`
- `src/app/api/booking/my-appointments/route.ts`
- `src/app/api/provider/availability/route.ts`
- `src/app/api/provider/blocked-times/route.ts`
- `src/app/api/cron/appointment-reminders/route.ts`
- `src/app/find-therapist/book/[slug]/page.tsx` — slot picker + confirmation
- `src/app/provider/calendar/page.tsx` — provider calendar view
- `src/app/provider/clients/page.tsx`
- `src/app/provider/appointments/page.tsx`

---

## Phase 5: Revenue Model + EPPP Pipeline (Weeks 9-12)

### Provider Subscription Model
- **Free**: Profile listing, up to 5 platform clients
- **Pro ($99/month)**: Unlimited clients, priority matching, calendar sync, insurance verification, analytics

Reuses existing Stripe infrastructure. New Price IDs in `PRICE_TO_TIER` map.

### EPPP Pipeline Feature
When a student passes the EPPP (tracked in `eppp_exam_results`), show a prompt:
> "Congratulations on passing! Set up your provider profile and get matched with patients."

Pre-fills provider profile from student's `graduate_program_id` and `user_research_profile` data.

### Admin Extensions
- `src/app/admin/providers/page.tsx` — review pending profiles, verify licenses
- `src/app/admin/matching/page.tsx` — matching analytics, weight tuning
- `src/app/admin/appointments/page.tsx` — volume, no-show rates, revenue

---

## Reusable Existing Patterns

| What | Where | How It's Reused |
|---|---|---|
| pgvector embeddings | `supabase/migrations/20250203_add_recover_rag.sql` | Same embedding + cosine similarity pattern for matching |
| Consent + audit log | `supabase/migrations/20251230_add_consent_and_research_system.sql` | PHI access log follows same pattern |
| Stripe subscriptions | `src/app/api/stripe/webhook/route.ts` | Extend for provider tier pricing |
| Auth context | `src/context/auth-context.tsx` | Add role-awareness to `UserProfile` |
| Resend email | `src/lib/notify-email.ts` | Appointment reminders |
| Slack notifications | `src/lib/notify-slack.ts` | New booking alerts |
| Cron jobs | `src/app/api/cron/` | Reminders + outcome weight optimization |
| RLS policies | All existing migration files | Same pattern for all new tables |

---

## New Environment Variables

```
STEDI_API_KEY=
STEDI_ENVIRONMENT=production
DAILY_API_KEY=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
STRIPE_PRICE_ID_PROVIDER_PRO=
```

---

## Verification Plan

1. **Provider onboarding**: Create test provider (CA-licensed), complete all onboarding steps, verify profile in DB
2. **Patient intake**: Complete intake as NY patient, verify embeddings generated, consent logged
3. **Matching**: Run match — verify CA provider excluded for NY patient (state filter), verify scoring on a matching-state pair
4. **Insurance**: Mock Stedi API call, verify cached result returned on 2nd call within 24h, verify copay shows in results
5. **Booking**: Book a slot, verify conflict detection, verify Daily.co room URL generated, verify reminder cron fires
6. **Video**: Join session via Daily.co embed, verify token expiry matches appointment window
7. **Cancel/reschedule**: Test full lifecycle — cancel, reschedule, no-show marking
8. **EPPP pipeline**: Mark test student as passed, verify provider CTA appears, verify profile pre-fill
9. **RLS**: Verify patients see only their data, providers see only their profile + appointments
10. **Freemium gate**: Verify free-tier provider hits 5-client cap, upgrade flow works via Stripe
