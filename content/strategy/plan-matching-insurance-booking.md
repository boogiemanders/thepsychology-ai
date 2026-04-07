# Plan: Clinical Fit Matching + Real-Time Insurance Verification + Booking

## Context

thepsychology.ai is currently an EPPP exam prep platform for psychology students. The competitive research (see `content/research/competitive-pain-points.md`) shows a massive gap in the client-clinician matching market:

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
- **Pilot monetization**: Test a meeting-based model first. Client pays $1 and provider pays $1 when a first meeting actually happens on-platform. If the provider wants to continue off-platform after that intro, the provider pays a $50 release fee. If the next session is booked on-platform, credit $49 back to the provider.
- **Long-term pricing**: Keep open until pilot data exists. Could become flat subscription, hybrid subscription + meeting fees, or stay mostly meeting-based if that proves cleaner.
- **Video**: Include Daily.co telehealth integration in MVP

---

## Architecture Decision: Same App, Route Groups

Keep as a single Next.js app. The EPPP-to-provider pipeline is the moat — splitting into separate apps breaks that flywheel.

- `/find-therapist/*` — client-facing matching and booking
- `/provider/*` — therapist dashboard, profile, calendar, clients
- `/api/matching/*`, `/api/insurance/*`, `/api/booking/*` — new API groups
- Existing routes (`/dashboard`, `/admin`, `/quizzer`, etc.) remain untouched
- **Launch scope**: CA + NY licensed providers, telehealth only (no office addresses in MVP)

---

## Phase 1: Foundation — Database + Provider Profiles (Weeks 1-4)

### 1A. User Role System

Add to existing `public.users` table:
- `user_role` column (`student | client | provider | admin`, default `student`)
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

### 1C. Client Intake Profiles Table

New `client_intake_profiles` table with:
- **Presenting concerns**: conditions (same taxonomy as provider specializations), severity, free-text description
- **Previous therapy experience**: what worked, what didn't
- **Therapist preferences**: modality, gender, age range, style preferences (same 1-10 scales)
- **Cultural preferences**: languages, cultural competencies, faith preference
- **Insurance info**: payer ID, member ID, group number, plan name
- **Practical**: location, telehealth preference, availability windows
- **Embeddings**: `concern_embedding`, `preferences_embedding`
- **Consent gates**: `hipaa_consent_given_at`, `matching_consent_given_at`

**Files:**
- `supabase/migrations/YYYYMMDD_create_client_intake.sql`
- `src/app/find-therapist/page.tsx` — landing page
- `src/app/find-therapist/intake/page.tsx` — multi-step intake questionnaire (5-10 min)

### 1D. PHI Access Audit Log

New `phi_access_log` table — every time PHI is accessed (matching, profile view, booking, insurance check), it's logged with accessor, client, access type, IP address. Extends existing `consent_audit_log` pattern.

---

## Phase 2: Matching Algorithm (Weeks 3-6)

### Three-Layer Scoring Pipeline

**Layer 1 — Hard Filters** (eliminate non-viable):
- Provider licensed in client's state
- Accepting new clients
- At least one session format overlap
- (Insurance match is a soft filter — OON providers shown lower, not eliminated)

**Layer 2 — Weighted Multi-Dimensional Scoring** (0-100):

| Dimension | Weight | Method |
|---|---|---|
| Specialization match | 0.25 | Jaccard similarity: client concerns vs provider specializations |
| Modality match | 0.15 | Jaccard similarity: preferred vs offered modalities |
| Semantic concern match | 0.20 | Cosine similarity: concern_embedding vs bio/approach embeddings |
| Style compatibility | 0.15 | Inverted Euclidean distance on 4 style dimensions |
| Cultural fit | 0.10 | Weighted match on language, competencies, faith preference |
| Practical convenience | 0.10 | Distance/telehealth + availability overlap |
| Demographic preference | 0.05 | Gender/age preference match |

**Layer 3 — AI Re-ranking** (DEFERRED — post-MVP, after 200+ outcomes):
- Send client free-text + provider bios/approaches + Layer 2 scores to Claude
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
1. Client enters insurance in intake
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
- When client books, a unique room token is generated with expiry matching appointment time
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

### Pilot Match Fee Model

- **Only charge on a real intro**: Client pays $1 and provider pays $1 only when the first appointment is completed through the platform.
- **Off-platform continuation fee**: If the provider wants to take the relationship off-platform after that first intro, the provider pays a $50 release fee.
- **Give most of it back for staying on-platform**: If the second appointment is booked on-platform, credit $49 back to the provider. Net effect: leaving costs $50, staying mostly costs $1.
- **Why this is interesting**: It avoids charging clinicians for a dead listing, keeps price tied to real meetings, and creates a clear anti-bypass rule without taking a percentage of care.
- **Why this should stay internal for now**: The idea is strategically interesting but still unusual. Do not put it on the public pricing page until the workflow is real and the wording has been tested with clinicians.

### Likely Long-Term Pricing Paths

- **Option A**: Flat provider subscription once the product proves ongoing value
- **Option B**: Hybrid model with low recurring fee + meeting-based fees
- **Option C**: Keep the meeting-based model if clinicians clearly prefer paying only when introductions happen

Reuses existing Stripe infrastructure, but this model also needs a fee ledger and credit logic rather than a simple subscription switch.

**New tables:**
- `platform_fee_events` — every $1 intro fee, $50 release fee, and $49 provider credit
- `provider_fee_balances` — running provider credit balance and payout adjustments
- `relationship_release_events` — marks when a provider chooses to continue a relationship off-platform after an on-platform intro

**Files:**
- `src/app/api/billing/intro-fee/route.ts`
- `src/app/api/billing/release-fee/route.ts`
- `src/app/api/billing/provider-credit/route.ts`
- `src/lib/billing/platform-fees.ts`

### EPPP Pipeline Feature
When a student passes the EPPP (tracked in `eppp_exam_results`), show a prompt:
> "Congratulations on passing! Set up your provider profile and get matched with clients."

Pre-fills provider profile from student's `graduate_program_id` and `user_research_profile` data.

### Postdoc Supervision Pipeline

**The trigger:** When a licensed provider on the platform (starting with Inzinna) reaches capacity — more patients than they can see — the platform surfaces a pathway to scale through supervised postdoctoral clinicians rather than simply closing a waitlist.

**Why this works:**
- Postdoctoral clinicians need supervised hours to obtain full licensure. They are actively looking for supervision placements.
- The EPPP pipeline already feeds the platform with newly passing psychologists who need exactly this.
- The supervisor gets capacity without fully delegating clinical responsibility.
- The platform gets more providers, more outcome data, and a deeper loyalty loop.
- When postdocs get licensed, they become supervisors themselves — the flywheel self-perpetuates.

**The lifecycle on platform:**
```
Study for EPPP → Pass EPPP → Postdoc (needs supervised hours)
    ↓
Apply for supervision placement via platform
    ↓
Matched with licensed supervisor (e.g., Inzinna) who has overflow capacity
    ↓
Supervised clinician sees patients under supervisor's license
    ↓
Accumulates hours → Gets licensed
    ↓
Sets up own provider profile → Gets matched with own clients
    ↓
Eventually: supervisor themselves → recruits next cohort of postdocs
```

**Platform features needed:**
- `supervision_placements` table — postdoc applications, supervisor matches, hours tracking
- `supervised_sessions` table — sessions conducted under supervision, linked to supervisor and supervisee provider profiles
- Supervision dashboard for supervisors: caseload overview, hours log, notes on supervisee progress
- Supervision dashboard for postdocs: hours toward licensure, supervisor feedback, session log
- Hour tracking per state licensing board requirements (varies by state — CA, NY first)
- Supervisor capacity indicator on provider profiles — "accepting postdoc supervision placements"

**How it works legally:**
- Supervised postdocs see patients **under the supervising psychologist's license** — the supervisor carries clinical and legal responsibility for those sessions
- This is standard postdoctoral supervised practice, not a gray area — it is the defined pathway to licensure in every state
- The supervisor decides who they accept as supervisees. The platform facilitates the match but does not override the supervisor's judgment.

**Who can join as a supervisor:**
- The founder (upon licensure) is the first supervisor on the platform
- Additional supervisors must be approved — this is a curated network, not an open marketplace
- Supervisor vetting: active license verification, malpractice coverage confirmed, no board complaints, interview/fit assessment
- Quality matters more than quantity here — the platform's reputation depends on the supervisors it admits

**Strategic importance:**
- No competitor offers the full loop: study → supervised practice → license → supervise → repeat
- This is the deepest possible moat — the platform is embedded in the entire career arc, not just one moment
- Outcome data from supervised sessions feeds Phase 6 (deliberate practice) and Phase 8 (AI-assisted therapy) with high-quality labeled training data
- Supervision is billable — supervisors charge postdocs for supervision hours (typically $100-300/hour). Platform can facilitate this payment and take a small fee.
- The founder starts this personally: takes on postdocs when patient load exceeds personal capacity, supervises their sessions, and builds the quality bar the platform will enforce for all future supervisors.

**Licensing board compliance:**
- Supervised postdocs see patients under supervisor's license — fully standard, legally defined pathway
- Supervision requirements vary by state and license type (psychologist vs. LCSW vs. MFT)
- MVP: California and New York only (matching platform launch states)
- Each state's hour requirements and supervisor qualifications must be verified and displayed clearly
- Platform does not certify supervisors — it connects and vets them. Supervisor credentials, active license, and malpractice coverage verified same as provider profiles.

### Embeddable Review Badge (Clinician Marketing Tool)

Give clinicians the power to showcase their reviews outside thepsychology.ai. This is a clinician-first feature that also serves as organic advertising for the platform.

**How it works:**
1. After a client leaves a review, the clinician sees it in their provider dashboard
2. Clinician can grab an **embed code** (HTML snippet or script tag) from their dashboard
3. The badge renders on their personal website showing: star rating, review count, and a "Verified on thepsychology.ai" link
4. Badge auto-updates — new reviews appear without the clinician touching anything
5. Clicking the badge links back to the provider's profile on thepsychology.ai (organic traffic + trust signal)

**Badge styles:**
- **Compact**: Star rating + review count in a small horizontal bar (for sidebars/footers)
- **Card**: Shows latest 5-star review quote + overall rating (for homepage/about page)
- **Floating**: Small corner widget with rating that expands on hover

**Review system:**
- Clients can leave a review after a completed session (prompted via email 24h after appointment)
- Reviews include: 1-5 star rating, free-text feedback, optional tags (good listener, helped me feel safe, practical strategies, etc.)
- Clinician can respond to reviews (visible publicly)
- Clinician controls which reviews appear on the embeddable badge (opt-in per review)
- Reviews are tied to verified appointments — no fake reviews possible

**Why this matters strategically:**
- Gives clinicians something no competitor offers — portable, verifiable social proof
- Every badge on a clinician's website is a backlink + ad for thepsychology.ai
- Builds clinician loyalty — the more reviews they accumulate, the harder it is to leave the platform
- Differentiates from Psychology Today (no reviews), Zocdoc (reviews locked to platform), and Headway (no reviews at all)

**New tables:**
- `client_reviews` — review content, rating, tags, appointment_id (verified), status (pending/approved/flagged)
- `provider_review_responses` — clinician replies to reviews
- `embeddable_badge_configs` — per-provider badge style, theme, which reviews to show, embed token

**Files:**
- `supabase/migrations/YYYYMMDD_create_reviews_and_badges.sql`
- `src/app/api/reviews/submit/route.ts` — client submits review (must have completed appointment)
- `src/app/api/reviews/respond/route.ts` — provider replies to review
- `src/app/api/reviews/badge/[token]/route.ts` — public JSON endpoint serving badge data (no auth required, CORS-open)
- `src/app/api/reviews/badge/[token]/widget.js/route.ts` — serves the embeddable JS widget script
- `src/app/provider/reviews/page.tsx` — provider review management dashboard
- `src/app/provider/reviews/embed/page.tsx` — embed code generator with live preview
- `src/components/review/review-badge-preview.tsx` — badge style previews
- `src/app/api/cron/review-request/route.ts` — sends review request emails 24h post-session via Resend

### Admin Extensions
- `src/app/admin/providers/page.tsx` — review pending profiles, verify licenses
- `src/app/admin/matching/page.tsx` — matching analytics, weight tuning
- `src/app/admin/appointments/page.tsx` — volume, no-show rates, revenue
- `src/app/admin/reviews/page.tsx` — flagged review moderation

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
2. **Client intake**: Complete intake as NY client, verify embeddings generated, consent logged
3. **Matching**: Run match — verify CA provider excluded for NY client (state filter), verify scoring on a matching-state pair
4. **Insurance**: Mock Stedi API call, verify cached result returned on 2nd call within 24h, verify copay shows in results
5. **Booking**: Book a slot, verify conflict detection, verify Daily.co room URL generated, verify reminder cron fires
6. **Video**: Join session via Daily.co embed, verify token expiry matches appointment window
7. **Cancel/reschedule**: Test full lifecycle — cancel, reschedule, no-show marking
8. **EPPP pipeline**: Mark test student as passed, verify provider CTA appears, verify profile pre-fill
9. **RLS**: Verify clients see only their data, providers see only their profile + appointments
10. **Freemium gate**: Verify free-tier provider hits 5-client cap, upgrade flow works via Stripe
11. **Reviews + Badge**: Submit review after completed appointment, verify badge JSON endpoint returns correct data, embed widget script on a test HTML page and confirm auto-updating display

---

## Phase 6: Deliberate Practice & Provider Quality

Research shows years of experience do NOT predict therapist effectiveness — most therapists plateau or slightly decline over time (Goldberg et al., 2016; Germer et al., 2022; Erekson et al., 2017). What DOES predict outcomes: session recording review, routine outcome monitoring, and deliberate practice with behavioral feedback. This phase builds tools no competitor offers.

### 6A. Routine Outcome Monitoring (ROM)

New `session_outcomes` table:
- `session_id`, `provider_id`, `client_id`, `completion_status`, `continuation_intent`, `client_satisfaction_rating`, `symptom_change_measure`, `created_at`

After each session, client receives a brief outcome measure (e.g., ORS/SRS or PHQ-4) — 30 seconds to complete. Provider dashboard surfaces: clients on-track, clients showing deterioration, overall trend.

**Why**: Effect size 0.36–0.53 for at-risk clients when clinical support tools flag them early (Barkham et al., 2023). Therapists cannot accurately identify deteriorating clients without objective data (APA Guidelines 2025; Muir et al., 2019).

**Files:**
- `supabase/migrations/YYYYMMDD_create_session_outcomes.sql`
- `src/app/api/outcomes/submit/route.ts`
- `src/app/provider/analytics/outcomes/page.tsx`

### 6B. Session Recording Review

Opt-in encrypted recording via Daily.co recording API, stored in Vercel Blob, provider-only access.

New `session_recordings` table:
- `recording_id`, `appointment_id`, `provider_id`, `storage_url`, `encrypted_key`, `reviewed_at`, `review_notes`, `created_at`

Provider can mark recordings as "reviewed" with private notes. 90% of clients find recording review acceptable and useful (Shepherd et al., 2009).

**Why**: Single strongest predictor of superior outcomes (Chow et al., 2015). 2025 APA Guidelines emphasize self-report is constrained by memory and self-protective biases — direct observation is essential.

**Files:**
- `supabase/migrations/YYYYMMDD_create_session_recordings.sql`
- `src/app/api/recordings/route.ts`
- `src/app/provider/recordings/page.tsx`

### 6C. Deliberate Practice Dashboard

Provider analytics at `src/app/provider/analytics/page.tsx`:
- Outcome trends over time (am I improving?)
- Caseload pattern analysis (what types of clients do I see most?)
- Comparison to platform averages (anonymized)
- "Not-on-track" client alerts
- Practice prompts: weekly nudges to review a session, reflect on a specific case, target a skill
- CE recommendations based on caseload patterns
- Skill-targeting exercises based on DP workshop model (Westra et al., 2021)

**Files:**
- `src/app/provider/analytics/page.tsx`
- `src/app/provider/analytics/components/outcome-trends.tsx`
- `src/app/provider/analytics/components/caseload-patterns.tsx`
- `src/app/api/cron/practice-prompts/route.ts`

### 6D. Privacy & Trust Guarantees

- All data private to the provider. Never used for ranking, penalizing, or rate changes.
- Explicitly stated in provider TOS and on-screen when features are introduced.
- Provider can delete recordings at any time.
- Outcome data never shared with clients, insurance, or third parties.

### Research References

1. Goldberg et al. 2016 — experience ≠ outcomes, most therapists plateau
2. Germer et al. 2022 — German replication confirming no experience-outcome link
3. Erekson et al. 2017 — training stage doesn't predict outcomes
4. Chow et al. 2015 — deliberate practice (recording review) predicts effectiveness
5. Barkham et al. 2023 — ROM effect sizes, clinical support tools for at-risk clients
6. Muir et al. 2019 — therapists can't identify deteriorating clients without data
7. APA Guidelines 2025 — direct observation essential, self-report insufficient
8. Shepherd et al. 2009 — 90% client acceptance of session recordings
9. Westra et al. 2021 — DP workshop trainees showed lasting skill improvement
10. Goldberg et al. 2016b — agency implementing DP + ROM reversed stagnation
11. Diamond et al. 2025 — systematic review noting evidence still developing (honest limitation)

---

## Phase 7: Digital Executive Functioning Assessment (Weeks 13-20+)

**Full competitive research + validation roadmap:** `content/research/competitive-ef-assessment-teardown.md`
**Positioning angles:** `content/research/positioning-angles-ef-assessment.md`

### Why This Is Phase 7

The matching + insurance + booking platform (Phases 1-6) must exist first because:
1. Provider profiles, client intake, and insurance verification are prerequisites for assessment delivery
2. The booking system handles scheduling assessment sessions
3. Outcome monitoring (Phase 6) creates the feedback loop for assessment validation
4. The EPPP pipeline gives us the provider supply that differentiates from BrainCheck/Creyos

### 7A. Assessment Engine (MVP — Wellness/Screening Tier)

Launch as a **wellness/screening tool** (no FDA review needed), then pursue De Novo classification with outcome data.

**Priority tests to build first** (strongest digital validity evidence):
- Digit span (forward/backward) — verbal working memory
- Verbal fluency (phonemic + semantic) — executive function
- Trail Making Test variant (novel stimuli, same construct) — processing speed + set-shifting
- Stroop-like task (novel design) — inhibition

**Key differentiators vs. CPT-3/TOVA/Pearson:**
- Web-based, no proprietary hardware
- Ecologically valid tasks (not just 21 minutes of clicking)
- Transparent scoring (clinician can verify)
- Continuous "Living Norms" — norms update as sample grows
- Remote-capable from day one
- Integrated with insurance verification + booking (instant copay)

**New tables:**
- `assessment_batteries` — battery configurations
- `assessment_sessions` — individual test sessions with timing data
- `assessment_responses` — per-item response data (RT, accuracy, etc.)
- `assessment_scores` — computed scores with norms reference
- `assessment_norms` — normative data (stratified by age, education, sex, ethnicity)
- `assessment_reports` — AI-generated reports linked to sessions

**Files:**
- `src/lib/assessment/engine.ts` — test administration engine
- `src/lib/assessment/scoring.ts` — transparent scoring algorithms
- `src/lib/assessment/norms.ts` — normative comparison
- `src/lib/assessment/report-generator.ts` — AI-assisted report generation
- `src/app/assessment/[batteryId]/page.tsx` — test-taker UI
- `src/app/provider/assessments/page.tsx` — provider assessment dashboard
- `src/app/provider/assessments/[sessionId]/report/page.tsx` — report review/edit
- `src/app/api/assessment/start/route.ts`
- `src/app/api/assessment/submit-response/route.ts`
- `src/app/api/assessment/generate-report/route.ts`
- `supabase/migrations/YYYYMMDD_create_assessment_tables.sql`

### 7B. AI Report Generation

Clinicians spend 5-10 hours writing an 11-page report. We generate a draft in minutes.

- Takes assessment scores + client intake data + referral question
- Generates structured report following APA neuropsych report format
- Clinician reviews, edits, and signs off (AI assists, never replaces clinical judgment)
- Uses existing Anthropic SDK integration
- Report includes: referral question, background, behavioral observations, test results, interpretation, diagnostic impressions, recommendations

### 7C. Normative Data Strategy

**Phase 7a (launch):** Published norms from validation literature as baseline
**Phase 7b (growth):** Platform-collected norms, stratified by demographics
**Phase 7c (scale):** "Living Norms" — continuously updated, always current

### 7D. Validation Plan

- Partner with 2-3 academic medical centers for concurrent validity studies
- Within-subject crossover design: our digital battery vs. gold-standard paper batteries
- Target: 50-100 participants per age decade
- Publish in JINS / Clinical Neuropsychologist / JMIR
- Full validation roadmap + FDA strategy in `content/research/competitive-ef-assessment-teardown.md`

### 7E. Market Entry

- **FDA path:** Launch as wellness/screening tool → collect data → De Novo classification
- **Reimbursement:** Use existing CPT codes (96132, 96136) with telehealth modifiers
- **Launch markets:** CA + NY (same as matching platform)
- **Target:** $1.8B cognitive assessment market, 6% CAGR → $2.5B by 2028

---

## Phase 8: AI-Assisted Therapy (Months 12-24+)

**Prerequisite:** Phase 6 outcome monitoring must be generating data before any of this is meaningful.

### The Data Moat

By Phase 8, the platform has what no competitor does:
- Outcome data correlating interventions → symptom improvement per client profile
- Session recordings (consented) showing what effective therapists actually do
- Matching algorithm data on which therapist-client pairings produce best outcomes
- ROM data flagging which clients are on-track vs. deteriorating
- EPPP-trained providers who understand the science behind the tools

Woebot/Wysa built AI therapy on CBT workbooks. We'd build on actual outcome data from real therapeutic relationships.

### 8A. Level 1 — Between-Session AI Support (Months 12-15)

**Regulatory:** Wellness tool (no FDA). Same category as meditation apps.

Extends the existing topic-teacher pattern into therapeutic psychoeducation:
- Between-session exercises tailored to client's treatment plan
- Homework reminders + guided practice (thought records, behavioral activation logs, exposure hierarchies)
- Psychoeducation about the client's specific presenting concerns
- Session prep: "Here's what you might want to discuss next session based on your homework"
- Mood/symptom tracking between sessions (feeds into Phase 6 ROM)

**New tables:**
- `therapy_exercises` — exercise library (CBT thought records, DBT skills, BA schedules, etc.)
- `client_exercise_assignments` — what's assigned per client, linked to provider treatment plan
- `client_exercise_completions` — completed exercises with responses
- `client_mood_logs` — between-session mood/symptom tracking

**Files:**
- `src/lib/therapy-ai/exercise-engine.ts` — selects/adapts exercises based on treatment plan
- `src/lib/therapy-ai/session-prep.ts` — generates session prep summaries for client + provider
- `src/app/client/exercises/page.tsx` — client exercise dashboard
- `src/app/client/exercises/[exerciseId]/page.tsx` — guided exercise completion
- `src/app/client/mood/page.tsx` — mood tracking
- `src/app/provider/clients/[clientId]/between-sessions/page.tsx` — provider view of client homework
- `src/app/api/therapy-ai/assign-exercise/route.ts`
- `src/app/api/therapy-ai/session-prep/route.ts`
- `supabase/migrations/YYYYMMDD_create_therapy_exercise_tables.sql`

### 8B. Level 2 — AI Triage & Structured Support (Months 15-18)

**Regulatory:** Clinical Decision Support — may qualify for 21st Century Cures Act exemption if clinician remains decision-maker.

- Crisis screening with validated measures (PHQ-9 item 9, Columbia Protocol) → routes to human immediately
- Symptom monitoring that flags deterioration to the provider in real-time
- Structured intake enhancement: AI gathers detailed history before first session, saving 30+ min of clinician time
- "What to work on next" recommendations based on outcome trajectory + evidence base
- Provider gets AI-generated session notes draft (from ROM data + exercise completions)

**Key constraint:** AI never makes clinical decisions. It surfaces data and recommendations. The licensed provider decides.

**Files:**
- `src/lib/therapy-ai/crisis-screen.ts` — validated crisis screening logic (Columbia Protocol)
- `src/lib/therapy-ai/deterioration-detector.ts` — flags at-risk clients from ROM trends
- `src/lib/therapy-ai/session-notes-draft.ts` — generates session note drafts from data
- `src/app/api/therapy-ai/triage/route.ts`
- `src/app/provider/alerts/page.tsx` — real-time deterioration alerts

### 8C. Level 3 — AI-Delivered Structured Interventions (Months 18-24)

**Regulatory:** Likely needs 510(k) or De Novo. Legal review required before launch.

This is the big one. AI delivers structured portions of evidence-based therapy, supervised by a human clinician:

- **CBT thought challenging** — AI guides client through thought records, Socratic questioning, cognitive restructuring. Provider reviews and adjusts.
- **Behavioral activation** — AI helps client plan and track activities, provides encouragement, adjusts difficulty. Provider monitors progress.
- **Exposure hierarchy work** — AI guides graduated exposure exercises between sessions. Provider sets the hierarchy and reviews.
- **DBT skills training** — AI teaches and practices mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness modules.

**Why this works:**
- These interventions are manualized and structured — ideal for AI delivery
- The therapist becomes supervisor/reviewer, not repetitive exercise deliverer
- Insurance bills under existing CPT codes (therapist is still provider of record)
- Sidesteps "is AI practicing medicine" — licensed human is in the loop
- Outcome data tells the AI which interventions to suggest for which client profiles
- Therapist capacity multiplied: one clinician can effectively serve 3-5x more clients

**Why NOT Level 4 (autonomous AI therapy):**
- No state licenses AI as a therapist — needs legislative change
- Malpractice liability unresolved — who's responsible when AI misses suicidal ideation?
- APA ethics requires a "professional relationship"
- Crisis management — AI can't call 911 or do welfare checks
- Therapeutic alliance research shows the relationship IS the intervention for many clients
- Level 4 is a 5+ year regulatory/legislative play, not a build decision

### 8D. The Flywheel

```
EPPP Prep → Licensed Provider → Outcome-Monitored Practice
    ↓                                      ↓
Provider Supply                    Training Data
    ↓                                      ↓
Matching + Booking ← AI-Assisted Therapy → Better Outcomes
    ↓                                      ↓
More Clients            More Data → Better AI → More Capacity
```

Every piece feeds the next. No competitor can replicate the full loop.

**Founder note:** The founder is currently in supervised practice (employed at a clinical practice), working toward licensure. Upon licensure, the founder becomes the **first provider on the platform** — personally matched with patients through thepsychology.ai. The postdoc supervision pipeline is not hypothetical; the founder is living it. The SP Notes and clinical tools being built now are informed by direct clinical workflow experience, which is the core credibility differentiator vs. tech companies guessing at clinician needs.
