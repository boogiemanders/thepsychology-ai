# iOS App — Where to Pick Up

## What's Done (committed ed3e4ea)

### Swift App (ios/EPPPStudy/)
- Full SwiftUI app shell: MainTabView, Dashboard, Exams, Study, Library, Settings
- **Models**: Exam, Lesson, ExamResult, StudyProgress, ReviewItem, SyncOperation, PriorityConfig, ContentManifest, UserEntitlement
- **Services**: APIClient, AuthService, ContentManager, LocalStore, SyncEngine, PriorityEngine, ReviewScheduler (SRS), StudyPathManager, StudyLoopCoordinator, NotificationService
- **Views**: ExamSessionView (full quiz engine), ExamResultsView, QuestionView, LessonDetailView, LessonListView, AudioPlayerView, QuickStudyView, DashboardView (readiness score, domain heatmap, streak, next action), all Settings screens
- **Widgets**: QuickQuestion, ContinueStudy, Countdown
- **Utilities**: Constants, MarkdownRenderer, NetworkMonitor

### Backend (Next.js API routes)
- `src/app/api/mobile/` — content-manifest, content-bundles/[bundleId], entitlement-check, sync/push, sync/pull, sync/bootstrap
- `src/lib/server/mobile-auth.ts` — JWT auth middleware
- `supabase/migrations/20260326_create_mobile_app_tables.sql` — mobile_devices, exam_results, lesson_progress, sync_queue tables

### Build Scripts
- `scripts/export-priority-config.mjs` → `public/priority-config.json` (71 KN statements, 79 lesson slug mappings)
- `scripts/build-mobile-content-manifest.mjs` → `public/mobile-content-manifest.json`

### Strategy Docs
- `content/strategy/app/apple-app-offline-sync-plan.md`
- `content/strategy/app/apple-app-store-submission-checklist.md`
- `content/strategy/app/apple-app-monetization.md`
- `content/strategy/app/PLAN-phase3-adaptive-study.md`

---

## What Needs to Happen Next

### 1. Xcode Project Setup (BLOCKING)
- [ ] Create Xcode project targeting iOS 17+ with the existing Swift files
- [ ] Add App Group entitlement (for widget data sharing)
- [ ] Add `priority-config.json` to the app bundle
- [ ] Set bundle ID: `ai.thepsychology.eppp`
- [ ] Configure signing with your Apple Developer account

### 2. Compile & Fix Build Errors
- [ ] The Swift code was written without Xcode compilation — expect type mismatches, missing imports, Constants.Domain references that need wiring
- [ ] PriorityEngine uses `Constants.Domain.allCases` — verify the Domain enum exists in Constants.swift and matches the 8 EPPP domains
- [ ] StudyLoopCoordinator needs to be injected as environment object in EPPPStudyApp.swift
- [ ] WidgetDataProvider may need App Group container URL adjustment
- [ ] ContentManager.downloadLesson signature may need adjustment

### 3. Wire StudyLoopCoordinator into App
- [ ] Add `@State private var coordinator: StudyLoopCoordinator` in EPPPStudyApp
- [ ] Pass as `.environment(coordinator)` to MainTabView
- [ ] Update DashboardView to use `coordinator.getNextAction()` instead of static data
- [ ] Update ExamSessionView to call `coordinator.onExamCompleted()` alongside existing StudyPathManager call (or replace)

### 4. Run Supabase Migration
- [ ] `supabase db push` to create mobile_app tables
- [ ] Verify RLS policies work for mobile auth tokens

### 5. API Testing
- [ ] Test `/api/mobile/content-manifest` returns the manifest
- [ ] Test `/api/mobile/content-bundles/[bundleId]` returns lesson content
- [ ] Test `/api/mobile/sync/push` and `/api/mobile/sync/pull` with sample data
- [ ] Test `/api/mobile/entitlement-check` with a real user token

### 6. TestFlight Pipeline
- [ ] Set up Fastlane or Xcode Cloud for CI
- [ ] First TestFlight build targeting your own device

---

## Architecture Notes

The adaptive study loop works like this:
```
Exam Completed
  → PriorityEngine.buildRecommendations() ranks weak domains
  → ReviewScheduler.processExamAnswers() feeds wrong answers into SRS
  → StudyPathManager updates mastery, downloads lessons, updates widgets
  → StudyLoopCoordinator tracks phase: idle → examCompleted → studyingRecommendedLessons → readyForNextExam

Lesson Completed
  → StudyLoopCoordinator.onLessonCompleted() checks 70% threshold
  → When threshold met → phase transitions to readyForNextExam

Dashboard
  → Shows phase-aware NextAction from coordinator.getNextAction()
  → SRS reviews take priority over lesson recommendations
```

The PriorityConfig JSON enables precise KN→topic→lesson mapping on-device without needing the manifest's fuzzy domain name matching.
