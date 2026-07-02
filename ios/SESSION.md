# iOS App Session

## Status: Native study loop + site-true adaptive theme shipped (2026-07-01, branch worktree-ios-native-polish)

## What's Working (2026-07-01)
- Both targets (EPPPStudy, EPPPStudyWidget) build clean via `xcodegen generate` + `xcodebuild`
- Theme.swift: adaptive light+dark tokens ported from web globals.css; app follows
  the phone appearance setting. Coral #D87758 = CTA accent (matches web), blue = link only.
- Study tab: NATIVE lesson reader (LessonReaderView, fetches /api/get-topic-content,
  serif body, themed tables) -> coral pill CTA -> NativeQuizView (fetches /api/quizzer,
  saves to /api/save-quiz-results + Supabase quiz_results). Topic-teacher webview DELETED.
- Quick Study endpoint exists now: GET /api/mobile/questions/quick (was 404).
- Supabase URL + anon key are real (were placeholders; sign-in works on fresh installs).
- WebViewOriginGuard on all webviews (Prioritize/Recover/WebApp): session tokens can't
  leak to third-party pages; external links open Safari.
- Verified visually in simulator, light + dark: sign-in, dashboard, study accordion,
  lesson reader, native quiz. Screenshots in the 7/1 PR.

## Known issues (from 7/1 full code review; the big ones)
1. SyncEngine push/pull protocol MISMATCHED with /api/mobile/sync/* (camelCase vs
   snake_case, wrong op type names, iso8601 millis). Every sync silently fails; cursor
   advances anyway. Cross-device sync = 0%. Fix or cut before TestFlight.
2. Delete Account is fake (just signs out) — App Store 5.1.1(v) rejection risk.
3. ExamSessionView never persists in-flight sessions; long exam lost on eviction.
   Timer leaks on swipe-back; timed mode not enforced.
4. Domain-name mismatch ("Domain 5" vs "Assessment & Diagnosis") zeroes
   PriorityEngine/readiness scores + widgets.
5. AuthService.refreshAccessToken signs out on ANY refresh failure incl. 5xx; two
   parallel 401s race the rotating refresh token.
6. ReviewScheduler question keys (djb2) never match web sha256 keys; server
   review_queue_updates dropped on pull.
7. Widget deep links (epppstudy://question/...) have no onOpenURL handler; Info.plist
   declares background modes with no BGTaskScheduler code.
8. Offline content flow (ContentManager /manifest, /lessons, /exams, /bundles paths)
   still points at nonexistent routes; Downloads/Library views not in tab bar. Cut or fix.
9. Monetization: web-only Pro gating needs a 3.1.3(b) companion-app story or StoreKit.

## Build Context
- Run: `cd ios && xcodegen generate` after editing `project.yml`
- Active target must be `EPPPStudy` (not `EPPPStudyWidget`) — no schemes after xcodegen
- Widget target compiles Theme.swift via project.yml sources (keep it listed there)
- Next.js dev on :3000 for content/sync endpoints (DEBUG builds hit localhost:3000)
- Memory file: `project_eppp_ios_xcode_gotchas.md` has Xcode traps
