# Plan: Apple App + Offline Study + Sync

## Recommendation

Build a native iPhone app in SwiftUI and keep the current Next.js + Supabase app as the shared backend, admin surface, and web client.

Do **not** turn the current site into a thin webview if the product goals are:
- reliable offline lessons and exams
- downloadable playlists and audio
- home screen / lock screen widgets
- background sync when connectivity returns

Those are native iOS strengths, not web wrapper strengths.

---

## Why This Repo Is Already Close

The current codebase already has most of the study content and part of the progress model needed for an offline-first app:

- `topic-content-v4/` contains **82** lesson markdown files
- `questionsGPT/` contains **82** topic question JSON files
- `exams/diagnostic` and `exams/practice` contain reusable exam source files
- `public/topic-teacher-audio/` already contains pre-generated audio assets and manifests
- [`src/lib/priority-calculator.ts`](/Users/anderschan/thepsychology-ai/src/lib/priority-calculator.ts) already computes what the postdoc should study next
- [`src/app/api/save-exam-results/route.ts`](/Users/anderschan/thepsychology-ai/src/app/api/save-exam-results/route.ts) already persists exam outcomes and updates downstream study data

The main gaps are:

- current progress is still heavily browser-local in [`src/lib/local-study-storage.ts`](/Users/anderschan/thepsychology-ai/src/lib/local-study-storage.ts), [`src/lib/exam-history.ts`](/Users/anderschan/thepsychology-ai/src/lib/exam-history.ts), [`src/lib/priority-storage.ts`](/Users/anderschan/thepsychology-ai/src/lib/priority-storage.ts), and [`src/lib/quiz-results-storage.ts`](/Users/anderschan/thepsychology-ai/src/lib/quiz-results-storage.ts)
- [`src/lib/unified-question-results.ts`](/Users/anderschan/thepsychology-ai/src/lib/unified-question-results.ts) explicitly notes that cross-device sync is still a TODO
- there is no mobile content manifest, no bundle versioning, no download manager, and no unified mobile sync API
- there is no Apple app target or widget extension in the repo today

---

## Product North Star

A postdoc should be able to download a study path before a flight, subway ride, or low-signal day, keep studying without service, and later open the website and see the same progress reflected there.

The app should feel like:

- a serious exam prep tool
- a low-friction “use tiny gaps in the day” tool
- an adaptive coach that keeps handing the user the next most valuable thing to do

---

## MVP Definition

### Core capabilities

1. Sign in with the same account used on the website
2. Download lessons for offline reading
3. Download lesson audio for offline listening
4. Download diagnostic and practice exams for offline use
5. Support both `study` mode and `test` mode offline
6. Save progress locally first, then sync automatically when the phone reconnects
7. Show a widget with a question and a quick way to continue studying

### Downloadable units

- **Lesson pack**: lesson markdown, metadata, optional topic quiz, optional audio manifest/chunks
- **Playlist pack**: ordered lesson/audio list, such as “weak areas,” “commute review,” or “ethics rapid review”
- **Exam pack**: question set, explanations, answer key, scoring rules, and recommendation config
- **Smart study pack**: one exam pack plus the logic and assets needed to auto-follow with recommended lessons and then queue the next exam

---

## The Core Loop To Build

This is the experience you described, made concrete:

1. User downloads a full practice exam pack.
2. The pack includes:
   - the full exam
   - explanations
   - the recommendation config needed to identify weak areas on-device
   - one reserved “next exam” placeholder so the app can keep momentum
3. User completes the practice exam offline in `study` or `test` mode.
4. App computes the most recommended lessons on-device using the same logic the web app uses today.
5. If the phone is online, the app immediately downloads those lessons and their audio.
6. If the phone is offline, the app queues those lesson downloads and starts them automatically when connectivity returns.
7. As the user finishes the recommended lessons, the app tracks completion locally.
8. Once the user hits a completion threshold, the app prefetches the next practice exam.
9. When the phone is back online, all exam results, lesson progress, question attempts, and study sessions sync to the same backend the website reads from.

To make this reliable even when someone stays offline for a long time, the app should offer a bigger pack type:

- **Weekend crash pack**: current exam + next exam + likely follow-up lesson/audio bundle

That avoids the bad experience where a postdoc finishes everything on a plane and then hits a dead end.

---

## Recommended Architecture

## 1. Client Architecture

- **Framework**: SwiftUI
- **Targets**:
  - iPhone app first
  - iPad supported from the same codebase
  - Widget extension in the same Xcode project
- **Minimum OS**:
  - If interactive widgets are a hard requirement, set the floor at **iOS 17+**

### Local persistence

Use a local SQLite-backed store in an **App Group** shared container.

Why:

- the main app and widget extension need shared access
- offline sync needs a durable queue
- content downloads need stable local metadata
- widget state should not depend on live network calls

Store:

- downloaded bundle metadata
- lesson progress
- exam sessions in progress
- completed exam results awaiting sync
- question attempt batches awaiting sync
- widget snapshot data

Store large files on disk:

- markdown lessons
- JSON manifests
- audio chunks
- explanation payloads

### Download manager

Use `URLSession` background downloads plus checksums and versioned manifests.

Responsibilities:

- queue downloads by priority
- resume interrupted downloads
- enforce storage limits
- evict stale packs automatically
- keep one “next exam” warm whenever possible

### Sync engine

Use a local-first sync queue with append-only operations:

- each operation gets a UUID generated on device
- sync retries with backoff
- server treats operations as idempotent using the client UUID
- user can study fully offline without losing work

---

## 2. Backend Architecture

Keep the current web app as the backend and content source of truth.

### Reuse existing source content

- lessons from `topic-content-v4`
- topic questions from `questionsGPT`
- exams from `exams`
- lesson audio manifests from `public/topic-teacher-audio`
- recommendation logic from [`src/lib/priority-calculator.ts`](/Users/anderschan/thepsychology-ai/src/lib/priority-calculator.ts)

### New server responsibilities

- publish versioned content manifests
- publish downloadable bundles
- accept mobile sync pushes
- return hydration/bootstrap data for a signed-in mobile user
- return deltas since last successful sync

### Important refactor

Pull the main save logic out of route files and into shared server modules so web and mobile both call the same code path.

The first thing to extract is the exam persistence logic from [`src/app/api/save-exam-results/route.ts`](/Users/anderschan/thepsychology-ai/src/app/api/save-exam-results/route.ts).

That route already:

- stores exam results
- writes to `exam_history`
- updates study priorities
- updates `topic_mastery`
- updates the review queue

That should become a reusable service, not a web-only route implementation.

---

## 3. Content Packaging Strategy

Do not make the iPhone app individually scrape dozens of raw routes. Ship versioned manifests and bundles.

### New build artifacts

Generate:

- `mobile-content-manifest.json`
- `priority-config.json`
- `playlist-definitions.json`
- bundle manifests keyed by bundle ID

Each bundle item should include:

- `id`
- `type`
- `version`
- `checksum`
- `size_bytes`
- `dependencies`
- asset URLs

### Bundle types

**Lesson bundle**

- lesson metadata
- lesson markdown
- topic quiz data if applicable
- optional audio manifest
- optional audio chunks

**Exam bundle**

- exam metadata
- question JSON
- explanations
- answer key
- domain and KN mapping
- scoring rules
- recommendation config snapshot

**Playlist bundle**

- ordered list of lesson/audio references
- playlist title, duration estimate, topic coverage

**Smart study bundle**

- one exam
- one reserved next exam reference
- enough recommendation config to choose next lessons offline
- optionally a starter cache of likely follow-up lessons

---

## Sync Model

The sync contract should be event-based, not “mirror browser localStorage.”

### Operations to support

- `exam_result_submitted`
- `exam_question_attempt_batch`
- `lesson_progress_upsert`
- `playlist_progress_upsert`
- `quiz_result_upsert`
- `study_session_recorded`
- `bookmark_upsert`
- `widget_answer_recorded`
- `recommendation_snapshot_upsert`

### Conflict rules

- exam submissions are append-only and immutable once submitted
- lesson progress uses latest timestamp and highest completion state
- study sessions are append-only
- bookmarks and preferences are last-write-wins
- recommendation snapshots can always be recomputed server-side if needed

### Result

When a user studies offline on the phone and later logs into the website, the website reads the same canonical rows and shows the updated history automatically.

That is the key product promise.

---

## Widget Strategy

The widget should be useful, but it should not pretend to be a full exam interface.

### Recommended widget types

**1. Quick Question Widget**

- shows one question at a time
- supports `study` mode first
- lets the user reveal the answer and explanation
- records whether the user got it right or wrong

**2. Continue Studying Widget**

- shows the next recommended lesson or next unfinished exam
- one tap deep-links straight into the app

**3. Weak Area Widget**

- shows the current highest-priority domain
- links into the relevant lesson playlist

**4. Countdown Widget**

- days until exam date
- today’s target: questions, minutes, or lessons

### Study mode vs test mode

- **Study mode** can work directly in the widget for very lightweight reps
- **Test mode** should deep-link into the app for full timing, flagging, answer review, and session continuity

This matters because widgets are great for quick repetition, not for high-stakes long-form exam UX.

### Widget data flow

- app writes a small snapshot to the App Group container
- widget reads that snapshot
- widget never depends on live network as its primary data source

### Nice follow-on feature

Add a Live Activity for active timed exams later:

- remaining time
- questions left
- quick jump back into the exam

Not MVP.

---

## Repo Work To Start Here

These are the first repo-level changes to make the current app mobile-ready:

### New backend files

- `scripts/build-mobile-content-manifest.mjs`
- `scripts/export-priority-config.mjs`
- `src/app/api/mobile/content-manifest/route.ts`
- `src/app/api/mobile/content-bundles/[bundleId]/route.ts`
- `src/app/api/mobile/sync/bootstrap/route.ts`
- `src/app/api/mobile/sync/push/route.ts`
- `src/app/api/mobile/sync/pull/route.ts`
- `src/lib/server/save-exam-results-service.ts`
- `src/lib/server/mobile-sync-service.ts`

### New database work

- `supabase/migrations/YYYYMMDD_create_mobile_sync_tables.sql`

Recommended new tables:

- `lesson_progress`
- `mobile_devices`
- `mobile_sync_receipts`
- `mobile_content_entitlements` if download access depends on plan tier

### New Apple app work

- `ios/thepsychology-ai-ios/` Xcode project
- app target
- widget extension target
- shared App Group storage layer

---

## Suggested Phase Plan

## Phase 0: Product and Data Contract

**1 week**

- lock down bundle types
- define sync event schema
- define local storage budget
- decide whether audio is always included or separately downloadable
- decide whether the app is:
  - a sign-in-only companion for existing subscribers
  - or a full StoreKit subscription app

This decision matters early because App Store payment rules will affect onboarding and monetization.

## Phase 1: Backend Packaging + Sync Foundation

**2 weeks**

- export lesson, exam, audio, and recommendation manifests
- add versioned bundle endpoints
- add bootstrap and sync endpoints
- create `lesson_progress`
- extract exam persistence into shared server service

Deliverable:

- mobile app can sign in, fetch manifest, and sync a simple test event

## Phase 2: iPhone App Shell + Offline Library

**3 weeks**

- SwiftUI app shell
- Supabase auth
- local database
- background download manager
- offline lesson reader
- offline audio playback
- offline exam runner

Deliverable:

- user can download a lesson or exam, go into airplane mode, and keep studying

## Phase 3: Adaptive Study Path

**2 weeks**

- port the priority engine to Swift using exported config JSON
- compute weak areas on-device after an exam
- auto-queue recommended lesson downloads
- track lesson completion
- prefetch next practice exam when threshold is met

Deliverable:

- “take exam -> get lessons -> finish lessons -> queue next exam” works end to end

## Phase 4: Widgets + Notifications

**2 weeks**

- quick question widget
- continue studying widget
- exam countdown widget
- reminders for downloaded-but-unfinished packs
- Siri Shortcuts / App Intents for “Ask me one EPPP question”

Deliverable:

- the app is useful even when the user only has 30 seconds

## Phase 5: TestFlight Hardening

**2 weeks**

- test full offline and reconnect flows
- test partial downloads and resumability
- test same-account sync across phone and web
- test widget freshness and App Group data sharing
- run beta with real postdocs and interns

Deliverable:

- stable TestFlight candidate

---

## Ideas That Could Make This App Much More Useful

These are the features most likely to make the app feel materially better than “the website, but smaller.”

Not all of these belong in the first release. The cleanest roadmap is:

### MVP

These are the highest-leverage features because they deepen the core study loop instead of adding surface area.

**Smart Offline Packs**

Let the user choose:

- `light` = questions + explanations only
- `full` = lessons + audio + questions
- `travel` = current exam + next exam + likely weak-area lesson set

**Exam Date Planner**

Once the user enters their exam date, shift the app from a generic library into a concrete plan. The planner should adjust:

- daily question targets
- weekly weak-area focus
- intensity ramps as the exam approaches
- recommended offline packs for travel-heavy weeks

**Confidence-Based Practice**

After each question, ask:

- “I knew that”
- “I guessed”
- “I had no idea”

That gives better remediation than right/wrong alone and helps detect false confidence.

**Mistake Journal**

Auto-save the questions a user misses and let them tag the miss:

- knowledge gap
- misread the stem
- changed from right to wrong
- ran out of time
- narrowed it to two but guessed wrong

This turns missed questions into pattern data, not just a pile of red marks.

**Recovery Mode**

The repo already has `Recover` concepts. Use them. When a user bombs a practice exam, do not just show weak areas. Also offer:

- a 3-minute reset
- a short confidence rebuild set
- a tiny “win back momentum” lesson playlist

**Commute Mode**

A one-tap playlist mode that automatically plays the user’s highest-priority lesson audio.

Good default playlists:

- weakest domain this week
- ethics rapid review
- 20-minute commute
- bedtime light review

**10-Minute Rescue Sessions**

Busy postdocs often do not start because the session feels too big. Add one-tap flows like:

- 5 questions in study mode
- 10-minute weak-area sprint
- 1 lesson section + 3 questions

**Ready Score + Gentle Momentum**

Show a single weekly readiness score built from:

- recent exam performance
- weak-area concentration
- time spent
- unanswered review queue
- confidence mismatch

Avoid childish gamification. Better motivators for this audience are:

- exam date countdown
- readiness score trend
- weak areas shrinking
- number of high-yield questions completed

### V2

These features make the app feel much smarter and more proactive once the core loop is already stable.

**Download Before You Lose Signal**

Trigger smart prompts such as:

- “Leaving Wi-Fi? Download your next 30-minute study pack.”
- “You have one unfinished lesson and one queued exam. Download now?”

This is high leverage because the user’s motivation is often present before the commute, not during it.

**Smart Reminders**

Notifications should be behavior-aware, not generic. Examples:

- “You usually study after clinic. Your 10-minute weak-area sprint is ready.”
- “You have one downloaded lesson left before your next practice exam.”
- “You have 3 overdue review items in Ethics.”

The app should learn from study timing and avoid spam.

**Auto-Prefetch Mode**

Go beyond manual download prompts and let users opt into automatic prefetching.

When on Wi-Fi and adequate battery:

- download the next recommended lesson
- keep one next exam cached
- refresh the current weak-area playlist

This makes offline studying feel automatic instead of something the user has to manage.

**Rationale Training**

After each question, train the reasoning, not just the answer key. Show:

- why the right answer is right
- why the strongest distractor is tempting
- why each wrong option is wrong

That makes the app feel much more like an expert tutor.

**Board-Style Mode**

Add a harder mode for users who are getting close to the real exam:

- less scaffolding
- longer stems
- more discriminating distractors
- fewer hints before answer reveal

This is a strong bridge between learning mode and exam-day performance.

**Burnout-Aware Mode**

When the user is falling behind or underperforming, do not only increase pressure. Instead, offer:

- lighter study sessions
- confidence rebuild sets
- short audio-only review options
- lower-friction restart paths

This matters for postdocs who are already working under heavy cognitive load.

**Siri Shortcuts**

Examples:

- “Ask me one EPPP question”
- “Start my weakest domain”
- “Play my ethics review”
- “Resume my practice exam”

### Nice-To-Have Later

These are valuable, but they should follow the core offline study loop and the smarter coaching layer.

**StandBy / Lock Screen Utility**

When the phone is on a desk or charger:

- show countdown to exam
- show next best lesson
- show one question ready to answer

That turns passive device time into study prompts.

**Live Activity For Timed Exams**

For active timed exams, show:

- time remaining
- questions left
- flagged count
- quick resume button

This is especially useful when users get interrupted mid-exam.

**Post-Exam Continuity**

If the user passes, the relationship should not just end. Possible follow-on paths:

- licensure transition checklist
- CE and ethics refreshers
- supervision and career resources
- eventual bridge into provider-side tools if the broader company strategy continues in that direction

This raises lifetime value and makes the product feel like a real professional companion, not a one-season cram app.

---

## Biggest Risks

### 1. App Store payments and review

If the app sells digital study access inside the app, plan for StoreKit and App Store review constraints.

If the app is a sign-in-only companion for existing subscribers, that is simpler, but it changes growth and conversion strategy.

### 2. Audio download size

Offline audio is valuable, but it can become the biggest storage cost quickly.

Need:

- per-pack size disclosure
- separate “download with audio” toggle
- auto-eviction rules

### 3. Background work is best-effort

iOS background refresh is helpful but not fully guaranteed.

So:

- all downloads must resume cleanly
- all sync operations must survive interruption
- foreground recovery paths must be excellent

### 4. Logic drift between web and app

If the recommendation engine diverges between TypeScript and Swift, users will get different “next best lesson” answers.

Prevent that by making the engine data-driven with exported config JSON, not two hand-maintained rule sets.

---

## Success Metrics

Track these from the beginning:

- percent of mobile users who download at least one pack in their first 7 days
- sync success rate after offline sessions
- percent of exam completions that lead to at least one recommended lesson completion
- widget weekly active users
- average questions answered per mobile user per week
- average study minutes completed offline
- percentage of users who always have a next exam or next lesson already downloaded

---

## My Recommendation On Scope

The best first version is:

- iPhone app
- offline lessons
- offline exam packs
- lesson audio downloads
- adaptive follow-up lessons after exams
- one strong quick-question widget
- clean sync back to the existing website

Do **not** start with:

- Apple Watch
- Mac app
- social features
- coach chat
- full custom AI generation on-device

Ship the offline study loop first. That is the differentiator.

---

## Companion Checklist

Use the separate submission-readiness checklist here:

- [`content/strategy/apple-app-store-submission-checklist.md`](/Users/anderschan/thepsychology-ai/content/strategy/apple-app-store-submission-checklist.md)

That document covers:

- App Store Connect metadata
- submission assets
- privacy and legal requirements
- review credentials
- Apple-specific rejection risks for this product

---

## Apple Platform References

These are the platform docs that matter most for this plan:

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Groups: https://developer.apple.com/documentation/xcode/configuring-app-groups
- App Intents: https://developer.apple.com/documentation/AppIntents/app-intents
- WidgetKit strategy: https://developer.apple.com/documentation/widgetkit/developing-a-widgetkit-strategy/
- Configurable widgets: https://developer.apple.com/documentation/WidgetKit/Making-a-Configurable-Widget
- Background app refresh: https://developer.apple.com/documentation/backgroundtasks/bgapprefreshtaskrequest
