# iOS App Session

## Status: Phase 2 quiz sync shipped. Study tab shows real progress.

## What's Working (2026-04-15)
- Build succeeds on iPhone simulator
- Sign-in works (Supabase auth)
- Study tab shows real quiz progress from Supabase `quiz_results` table
- Web dual-writes quiz results to localStorage + Supabase
- iOS `QuizProgressService` fetches progress via Supabase REST, refreshes on appear + webview dismiss
- One-time backfill pushes localStorage quiz data to Supabase on sign-in
- Realtime subscription on web (topic-selector) refreshes when quiz_results change from another device
- Fixed doubled letter prefix bug in quiz options ("A. D. Anomic" -> "A. Anomic")

## Next Session — Two Tasks

### Task 1: Build native iOS quiz view
Replace WKWebView quiz with native SwiftUI. Currently tapping a topic in StudyView opens TopicTeacherView (WKWebView loading /topic-teacher). User wants it native.

**Build:**
- `ios/EPPPStudy/Views/Study/NativeQuizView.swift` — question display, radio answers, progress bar, score screen
- Fetch questions via APIClient (add endpoint or hit existing `/api/quiz?topic={topicName}`)
- On completion, write to Supabase `quiz_results` via REST (same pattern as QuizProgressService)
- Match Theme.swift (dark, sage/coral, clean type)
- Use /frontend-design + /minimalist-ui skills for design

**After building:** `cd ios && xcodegen generate` then `xcodebuild -target EPPPStudy` (no schemes after xcodegen)

### Task 2: Audit question banks for doubled letter prefixes
Rendering fix is in place (`stripOptionLetterPrefix` in quizzer-content.tsx:111). Root cause is question data.

**Audit:**
- Scan `exams/` JSON files for options matching `^[A-D]\.\s`
- Grep for `questionsGPT`, `examsGPT`, `generateQuestion`, `generateExam` to find generation code
- If generation code embeds letter prefixes: fix the prompt/template
- If existing JSON has them: batch-strip from data files

### Lower priority follow-ups
- Wire `useQuizProgress` hook into dashboard + prioritize pages (still localStorage-only)
- Supabase Realtime on iOS (skipped — refresh-on-appear is enough for now)

## Build Context
- Run: `cd ios && xcodegen generate` after editing `project.yml`
- Active target must be `EPPPStudy` (not `EPPPStudyWidget`) — no schemes after xcodegen
- Next.js dev on :3000 for content/sync endpoints
- Memory file: `project_eppp_ios_xcode_gotchas.md` has Xcode traps
