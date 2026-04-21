# Phase 3: Adaptive Study Path + SRS — Implementation Plan

## Overview
Port the web priority engine and SRS system into the iOS app so that after completing an exam, the app automatically identifies weak domains, recommends specific lessons, and queues spaced-repetition questions into the QuickQuestion widget.

## Architecture Summary

**On-device only** — no new API endpoints needed. The priority calculator and SRS scheduler run locally using exam results already stored in `LocalStore`. The manifest (`ContentManifest`) provides the lesson-to-domain mapping needed for recommendations.

---

## Step 1: Add `PriorityEngine.swift` — Domain Priority Calculator

**New file:** `ios/EPPPStudy/Services/PriorityEngine.swift`

This is a pure Swift port of `src/lib/priority-calculator.ts`. No Supabase dependency — works entirely on local `ExamResult` data.

```swift
import Foundation

struct DomainConfig {
    let number: Int
    let name: String
    let weight: Double // EPPP exam weight (0.0-1.0)
}

struct DomainPerformance: Identifiable {
    var id: Int { domainNumber }
    let domainNumber: Int
    let domainName: String
    let domainWeight: Double
    let totalQuestions: Int
    let totalWrong: Int
    let percentageWrong: Double
    let priorityScore: Double // percentageWrong * domainWeight
}

struct PriorityRecommendation: Identifiable {
    var id: Int { domainNumber }
    let domainNumber: Int
    let domainName: String
    let priorityScore: Double
    let percentageWrong: Double
    let recommendedLessonSlugs: [String] // From manifest
}

final class PriorityEngine {

    // EPPP domain weights — matches src/lib/kn-data.ts DOMAIN_WEIGHTS
    static let domainConfigs: [DomainConfig] = [
        DomainConfig(number: 1, name: "Biological Bases of Behavior", weight: 0.10),
        DomainConfig(number: 2, name: "Cognitive-Affective Bases of Behavior", weight: 0.13),
        DomainConfig(number: 3, name: "Social Psychology & Cultural Aspects", weight: 0.11),
        DomainConfig(number: 4, name: "Growth & Lifespan Development", weight: 0.12),
        DomainConfig(number: 5, name: "Assessment, Diagnosis & Psychopathology", weight: 0.16),
        DomainConfig(number: 6, name: "Treatment & Intervention", weight: 0.15),
        DomainConfig(number: 7, name: "Research Methods & Statistics", weight: 0.07),
        DomainConfig(number: 8, name: "Ethical, Legal & Professional Issues", weight: 0.16),
    ]

    /// Calculate domain performance from one or more ExamResults
    static func calculateDomainPerformance(from results: [ExamResult]) -> [DomainPerformance] {
        // Aggregate domainScores across all results
        var domainCorrect: [String: Int] = [:]
        var domainTotal: [String: Int] = [:]

        for result in results {
            for score in result.domainScores {
                domainCorrect[score.domain, default: 0] += score.correct
                domainTotal[score.domain, default: 0] += score.total
            }
        }

        return domainConfigs.map { config in
            // Match domain by name or number prefix
            let key = domainCorrect.keys.first { k in
                k.contains(config.name) || k.hasPrefix("Domain \(config.number)")
                    || k == config.name
            }
            let correct = key.flatMap { domainCorrect[$0] } ?? 0
            let total = key.flatMap { domainTotal[$0] } ?? 0
            let wrong = total - correct
            let pctWrong = total > 0 ? Double(wrong) / Double(total) * 100 : 0
            let priorityScore = (pctWrong / 100) * config.weight * 100

            return DomainPerformance(
                domainNumber: config.number,
                domainName: config.name,
                domainWeight: config.weight,
                totalQuestions: total,
                totalWrong: wrong,
                percentageWrong: (pctWrong * 100).rounded() / 100,
                priorityScore: (priorityScore * 100).rounded() / 100
            )
        }
    }

    /// Get top N priority domains sorted by priority score (highest first)
    static func getTopPriorities(from performance: [DomainPerformance], count: Int = 3) -> [DomainPerformance] {
        performance
            .sorted { $0.priorityScore > $1.priorityScore }
            .prefix(count)
            .map { $0 }
    }

    /// Map priority domains to recommended lesson slugs from manifest
    static func recommendLessons(
        priorities: [DomainPerformance],
        manifest: ContentManifest
    ) -> [PriorityRecommendation] {
        priorities.map { priority in
            // Find matching domain in manifest by domain number
            let matchingLessons = manifest.domains
                .filter { domain in
                    // Match by domain number in the slug or name
                    domain.slug.hasPrefix("\(priority.domainNumber)-")
                        || domain.name.contains(priority.domainName)
                        || domain.id == "\(priority.domainNumber)"
                }
                .flatMap(\.lessons)
                .map(\.slug)

            return PriorityRecommendation(
                domainNumber: priority.domainNumber,
                domainName: priority.domainName,
                priorityScore: priority.priorityScore,
                percentageWrong: priority.percentageWrong,
                recommendedLessonSlugs: matchingLessons
            )
        }
    }
}
```

**Acceptance criteria:**
- [ ] Unit testable: given a mock `ExamResult` with known domain scores, returns correct priority ordering
- [ ] Domain weights match `DOMAIN_WEIGHTS` in `src/lib/kn-data.ts`
- [ ] Returns top 3 by default, configurable

---

## Step 2: Add `SRSScheduler.swift` — Spaced Repetition Engine

**New file:** `ios/EPPPStudy/Services/SRSScheduler.swift`

Port of `src/lib/review-queue.ts`'s `computeNextSchedule`. Runs entirely on-device.

```swift
import Foundation

struct ReviewItem: Codable, Identifiable {
    var id: String { questionKey }
    let questionKey: String        // SHA hash of question+options+correct
    let question: String
    let options: [String]?
    let correctAnswer: String?
    let domain: String
    let lastAnswer: String?
    let lastWasCorrect: Bool
    let lastAttempted: Date

    // SM-2 fields
    var repetitions: Int
    var intervalDays: Int
    var easeFactor: Double
    var nextReviewAt: Date
    var suspended: Bool
}

final class SRSScheduler {

    /// Compute next review schedule using SM-2 algorithm
    /// Matches computeNextSchedule in src/lib/review-queue.ts
    static func computeNextSchedule(
        existing: ReviewItem?,
        wasCorrect: Bool,
        attemptedAt: Date = Date()
    ) -> (repetitions: Int, intervalDays: Int, easeFactor: Double, nextReviewAt: Date) {

        let existingReps = existing?.repetitions ?? 0
        let existingInterval = existing?.intervalDays ?? 0
        let existingEf = existing?.easeFactor ?? 2.5

        if !wasCorrect {
            let easeFactor = clamp(existingEf - 0.2, min: 1.3, max: 2.7)
            let intervalDays = 1
            let nextReviewAt = attemptedAt.addingTimeInterval(Double(intervalDays) * 86400)
            return (0, intervalDays, easeFactor, nextReviewAt)
        }

        let nextRepetitions = existingReps + 1
        let easeFactor = clamp(existingEf + 0.1, min: 1.3, max: 2.7)

        var intervalDays: Int
        if nextRepetitions == 1 { intervalDays = 1 }
        else if nextRepetitions == 2 { intervalDays = 6 }
        else { intervalDays = Int((Double(max(existingInterval, 1)) * easeFactor).rounded()) }

        intervalDays = max(intervalDays, 1)
        let nextReviewAt = attemptedAt.addingTimeInterval(Double(intervalDays) * 86400)
        return (nextRepetitions, intervalDays, easeFactor, nextReviewAt)
    }

    /// Get questions due for review (nextReviewAt <= now, not suspended)
    static func getDueItems(from items: [ReviewItem], limit: Int = 10) -> [ReviewItem] {
        let now = Date()
        return items
            .filter { !$0.suspended && $0.nextReviewAt <= now }
            .sorted { $0.nextReviewAt < $1.nextReviewAt }
            .prefix(limit)
            .map { $0 }
    }

    /// Generate a question key (SHA-256 hash) matching computeQuestionKey in src/lib/question-key.ts
    static func computeQuestionKey(question: String, options: [String]?, correctAnswer: String?) -> String {
        var input = question.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if let opts = options {
            input += opts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.joined()
        }
        if let correct = correctAnswer {
            input += correct.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        }
        // Use CryptoKit SHA256
        return SHA256Hash(input)
    }

    private static func clamp(_ value: Double, min: Double, max: Double) -> Double {
        Swift.min(max, Swift.max(min, value))
    }

    private static func SHA256Hash(_ input: String) -> String {
        import CryptoKit
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}
```

**Note:** The `SHA256Hash` will need to use `import CryptoKit` at file level. The pseudocode above shows intent.

**Acceptance criteria:**
- [ ] SM-2 scheduling matches `computeNextSchedule` in `review-queue.ts`
- [ ] Question key hash matches `computeQuestionKey` in `question-key.ts`
- [ ] `getDueItems` returns items sorted by most overdue first

---

## Step 3: Add `ReviewStore` to `LocalStore.swift`

**Edit file:** `ios/EPPPStudy/Services/LocalStore.swift`

Add a `reviewDir` alongside existing dirs, with methods to persist `ReviewItem` objects.

```swift
// Add to LocalStore:

private let reviewDir: URL  // in init: containerURL.appendingPathComponent("review", isDirectory: true)

// MARK: - Review Queue (SRS)

func saveReviewItem(_ item: ReviewItem) {
    let url = reviewDir.appendingPathComponent("\(item.questionKey).json")
    if let data = try? encoder.encode(item) {
        try? data.write(to: url)
    }
}

func getReviewItem(questionKey: String) -> ReviewItem? {
    let url = reviewDir.appendingPathComponent("\(questionKey).json")
    guard let data = try? Data(contentsOf: url) else { return nil }
    return try? decoder.decode(ReviewItem.self, from: data)
}

func getAllReviewItems() -> [ReviewItem] {
    guard let files = try? fileManager.contentsOfDirectory(at: reviewDir, includingPropertiesForKeys: nil) else {
        return []
    }
    return files
        .filter { $0.pathExtension == "json" }
        .compactMap { try? Data(contentsOf: $0) }
        .compactMap { try? decoder.decode(ReviewItem.self, from: $0) }
}

func getDueReviewItems(limit: Int = 10) -> [ReviewItem] {
    SRSScheduler.getDueItems(from: getAllReviewItems(), limit: limit)
}
```

Also add `reviewDir` to `createDirectories()`.

**Acceptance criteria:**
- [ ] Review items persist across app launches
- [ ] Stored in app group container (accessible by widgets)
- [ ] `getDueReviewItems` returns sorted by most overdue

---

## Step 4: Wire Exam Completion → Priority Engine → Recommendations

**Edit file:** `ios/EPPPStudy/Views/Exams/ExamSessionView.swift`

In `finishExam()`, after saving the `ExamResult`:

1. Run `PriorityEngine.calculateDomainPerformance` on all stored results
2. Get top 3 priorities
3. Map to recommended lesson slugs via manifest
4. Store recommendations in `LocalStore` as `StudyRecommendation`
5. Update `ExamResult.recommendedLessons` with the slugs

**New model** (add to `StudyProgress.swift` or new file):

```swift
struct StudyRecommendation: Codable, Sendable {
    let generatedAt: Date
    let examResultId: String
    let priorities: [RecommendationPriority]

    struct RecommendationPriority: Codable, Sendable, Identifiable {
        var id: Int { domainNumber }
        let domainNumber: Int
        let domainName: String
        let priorityScore: Double
        let percentageWrong: Double
        let recommendedLessonSlugs: [String]
    }
}
```

**Changes to `finishExam()`:**

```swift
private func finishExam() {
    guard var session else { return }
    session.completedAt = Date()
    self.session = session
    timer?.invalidate()

    let result = buildResult(from: session)
    localStore.saveExamResult(result)
    syncEngine.enqueueExamResult(result)

    // NEW: Generate adaptive study recommendations
    let allResults = localStore.getAllExamResults()
    let performance = PriorityEngine.calculateDomainPerformance(from: allResults)
    let topPriorities = PriorityEngine.getTopPriorities(from: performance)

    if let manifest = contentManager.manifest {
        let recommendations = PriorityEngine.recommendLessons(
            priorities: topPriorities,
            manifest: manifest
        )
        let studyRec = StudyRecommendation(
            generatedAt: Date(),
            examResultId: result.id,
            priorities: recommendations.map { rec in
                .init(
                    domainNumber: rec.domainNumber,
                    domainName: rec.domainName,
                    priorityScore: rec.priorityScore,
                    percentageWrong: rec.percentageWrong,
                    recommendedLessonSlugs: rec.recommendedLessonSlugs
                )
            }
        )
        localStore.saveStudyRecommendation(studyRec)
    }

    // NEW: Enqueue wrong answers into SRS
    enqueueWrongAnswersForSRS(session: session)

    showResults = true
}
```

**Also add `enqueueWrongAnswersForSRS`:**

```swift
private func enqueueWrongAnswersForSRS(session: ExamSession) {
    for answer in session.answers where !answer.isCorrect {
        guard let question = exam.questions.first(where: { $0.id == answer.questionId }) else { continue }

        let questionKey = SRSScheduler.computeQuestionKey(
            question: question.stem,
            options: question.choices.map(\.text),
            correctAnswer: question.choices.first(where: { $0.id == question.correctChoiceId })?.text
        )

        let existing = localStore.getReviewItem(questionKey: questionKey)
        let schedule = SRSScheduler.computeNextSchedule(existing: existing, wasCorrect: false)

        let item = ReviewItem(
            questionKey: questionKey,
            question: question.stem,
            options: question.choices.map(\.text),
            correctAnswer: question.choices.first(where: { $0.id == question.correctChoiceId })?.text,
            domain: question.domain,
            lastAnswer: answer.selectedChoiceId.flatMap { choiceId in
                question.choices.first(where: { $0.id == choiceId })?.text
            },
            lastWasCorrect: false,
            lastAttempted: answer.answeredAt,
            repetitions: schedule.repetitions,
            intervalDays: schedule.intervalDays,
            easeFactor: schedule.easeFactor,
            nextReviewAt: schedule.nextReviewAt,
            suspended: false
        )
        localStore.saveReviewItem(item)
    }
}
```

**Needs:** `@Environment(ContentManager.self)` added to `ExamSessionView`.

**Acceptance criteria:**
- [ ] After finishing an exam, `StudyRecommendation` is saved with top 3 weak domains
- [ ] `recommendedLessonSlugs` contains actual lesson slugs from manifest
- [ ] All wrong answers are enqueued as `ReviewItem` with 1-day interval
- [ ] Correct answers on existing review items update their schedule (promote)

---

## Step 5: Update `ExamResultsView` — Show Recommendations + Auto-Download CTA

**Edit file:** `ios/EPPPStudy/Views/Exams/ExamResultsView.swift`

After the "Focus Areas" section, add a "Recommended Study Plan" section that:
1. Shows top 3 priority domains with their priority scores
2. Lists recommended lessons for each domain
3. Has a "Download All" button that batch-downloads recommended lessons
4. Shows download status for each lesson (downloaded vs. available)

```swift
// Add after weakAreas section:

// Recommended Study Plan
if let recommendation = localStore.getLatestRecommendation() {
    VStack(alignment: .leading, spacing: 16) {
        HStack(spacing: 8) {
            Image(systemName: "sparkles")
                .foregroundStyle(.blue)
            Text("Your Study Plan")
                .font(.headline)
                .foregroundStyle(.white)
        }

        ForEach(recommendation.priorities) { priority in
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(priority.domainName)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.white)
                    Spacer()
                    Text("Priority: \(Int(priority.priorityScore))")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.orange)
                }

                ForEach(priority.recommendedLessonSlugs.prefix(3), id: \.self) { slug in
                    HStack(spacing: 8) {
                        Image(systemName: contentManager.isLessonDownloaded(slug: slug)
                            ? "checkmark.circle.fill" : "arrow.down.circle")
                            .foregroundStyle(contentManager.isLessonDownloaded(slug: slug)
                                ? .green : .secondary)
                            .font(.caption)
                        Text(slug.replacingOccurrences(of: "-", with: " ").capitalized)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray5).opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }

        Button {
            downloadRecommended(recommendation)
        } label: {
            Label("Download Recommended Lessons", systemImage: "arrow.down.circle.fill")
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    .padding()
    .background(Color(.systemGray6))
    .clipShape(RoundedRectangle(cornerRadius: 12))
}
```

**Acceptance criteria:**
- [ ] Recommendations render immediately after exam completion
- [ ] Downloaded lessons show green checkmark
- [ ] "Download All" batch-downloads only non-downloaded lessons
- [ ] Tapping a lesson slug navigates to that lesson

---

## Step 6: Update `DashboardView` — Smarter Next Action

**Edit file:** `ios/EPPPStudy/Views/Dashboard/DashboardView.swift`

Replace the naive `computeNextAction()` with priority-engine-aware logic:

```swift
private func computeNextAction() -> NextAction? {
    // 1. Check SRS: any review items due?
    let dueReviews = localStore.getDueReviewItems(limit: 5)
    if !dueReviews.isEmpty {
        return NextAction(
            type: .quickStudy,
            title: "\(dueReviews.count) questions due for review",
            subtitle: "Spaced repetition keeps knowledge fresh",
            destination: .quickStudy
        )
    }

    // 2. Check recommendations: any recommended lessons not yet downloaded/completed?
    if let rec = localStore.getLatestRecommendation() {
        let topPriority = rec.priorities.first
        if let priority = topPriority,
           let firstUnread = priority.recommendedLessonSlugs.first(where: { slug in
               localStore.getLessonProgress(id: slug)?.completed != true
           }) {
            return NextAction(
                type: .reviewWeakArea,
                title: "Study \(priority.domainName)",
                subtitle: "\(Int(priority.percentageWrong))% wrong — your top priority",
                destination: .lesson(slug: firstUnread)
            )
        }
    }

    // 3. Fallback to weakest domain from mastery
    if let progress,
       let weakest = progress.domainMastery.min(by: { $0.value.percentage < $1.value.percentage }),
       weakest.value.percentage < 50 {
        return NextAction(
            type: .reviewWeakArea,
            title: "Review \(weakest.value.domain)",
            subtitle: "Your weakest area at \(Int(weakest.value.percentage))%",
            destination: .domain(weakest.key)
        )
    }

    // 4. Default
    return NextAction(
        type: .quickStudy,
        title: "Quick Study",
        subtitle: "5 practice questions across all domains",
        destination: .quickStudy
    )
}
```

**Acceptance criteria:**
- [ ] SRS due items take highest priority
- [ ] Priority recommendations show next if no SRS items due
- [ ] Falls back to domain mastery → quick study

---

## Step 7: Wire SRS into QuickQuestion Widget

**Edit file:** `ios/EPPPStudy/Widget/WidgetDataProvider.swift`

Add a method to write a due SRS question as the widget question:

```swift
// MARK: - SRS Question for Widget

static func writeSRSQuestionForWidget() {
    let localStore = LocalStore()
    let dueItems = localStore.getDueReviewItems(limit: 1)

    guard let item = dueItems.first else { return }

    // Convert ReviewItem to WidgetQuestion
    let choices: [WidgetChoice]
    if let options = item.options, options.count >= 4 {
        choices = options.enumerated().map { index, text in
            WidgetChoice(
                id: ["A", "B", "C", "D"][min(index, 3)],
                label: ["A", "B", "C", "D"][min(index, 3)],
                text: text
            )
        }
    } else {
        return // Can't display without choices
    }

    let question = WidgetQuestion(
        id: item.questionKey,
        stem: item.question,
        choices: Array(choices.prefix(4)),
        correctChoiceId: item.correctAnswer.flatMap { correct in
            choices.first(where: { $0.text == correct })?.id
        } ?? "A",
        explanation: "", // SRS items don't store explanations
        domain: item.domain
    )

    writeQuickQuestion(QuickQuestionData(question: question, updatedAt: Date()))
}
```

**Also edit** `ios/EPPPStudy/EPPPStudyApp.swift` — call `writeSRSQuestionForWidget()` on app background or after exam completion.

**Acceptance criteria:**
- [ ] Widget shows SRS due question when available
- [ ] Falls back to random question when no SRS items are due
- [ ] Widget refreshes after exam completion

---

## Step 8: Update `StudyProgress` Mastery After Exam

**Edit file:** `ios/EPPPStudy/Views/Exams/ExamSessionView.swift`

In `finishExam()`, after generating recommendations, update `StudyProgress.domainMastery`:

```swift
// Update domain mastery in StudyProgress
var studyProgress = localStore.getStudyProgress() ?? StudyProgress(
    userId: session.userId,
    domainMastery: [:],
    streakDays: 0,
    lastStudyDate: nil,
    totalStudyTimeSeconds: 0,
    lessonsCompleted: 0,
    examsCompleted: 0,
    examDate: nil,
    readinessScore: 0
)

for domainScore in result.domainScores {
    var mastery = studyProgress.domainMastery[domainScore.domain] ?? StudyProgress.DomainMastery(
        domain: domainScore.domain,
        percentage: 0,
        questionsAttempted: 0,
        questionsCorrect: 0,
        lessonsCompleted: 0,
        totalLessons: 0,
        lastStudiedAt: nil
    )
    mastery.questionsAttempted += domainScore.total
    mastery.questionsCorrect += domainScore.correct
    mastery.percentage = Double(mastery.questionsCorrect) / Double(max(mastery.questionsAttempted, 1)) * 100
    mastery.lastStudiedAt = Date()
    studyProgress.domainMastery[domainScore.domain] = mastery
}

studyProgress.examsCompleted += 1
studyProgress.lastStudyDate = Date()
studyProgress.totalStudyTimeSeconds += result.totalTimeSeconds

// Recalculate readiness from all domain mastery
let avgMastery = studyProgress.domainMastery.values.map(\.percentage).reduce(0, +)
    / max(Double(studyProgress.domainMastery.count), 1)
studyProgress.readinessScore = avgMastery

localStore.saveStudyProgress(studyProgress)
```

**Acceptance criteria:**
- [ ] Domain mastery updates after each exam
- [ ] Readiness score recalculates as average of domain mastery
- [ ] Dashboard heatmap reflects updated mastery

---

## Step 9: Auto-Download Recommended Lessons

**New method in** `ContentManager.swift`:

```swift
/// Auto-download recommended lessons that aren't already stored
func downloadRecommendedLessons(slugs: [String]) async {
    let toDownload = slugs.filter { !isLessonDownloaded(slug: $0) }
    for slug in toDownload.prefix(5) { // Cap at 5 to avoid excessive downloads
        let title = manifest?.domains
            .flatMap(\.lessons)
            .first(where: { $0.slug == slug })?.title ?? slug

        try? await downloadLesson(slug: slug, title: title)
    }
}
```

Call this from `ExamSessionView.finishExam()` after saving recommendations — but only on WiFi:

```swift
// Auto-download top recommended lessons on WiFi
if networkMonitor.isConnected && networkMonitor.isExpensive == false {
    let topSlugs = recommendations.flatMap(\.recommendedLessonSlugs).prefix(5)
    Task {
        await contentManager.downloadRecommendedLessons(slugs: Array(topSlugs))
    }
}
```

**Acceptance criteria:**
- [ ] Only downloads on WiFi (not cellular)
- [ ] Caps at 5 lessons max
- [ ] Skips already-downloaded lessons
- [ ] Non-blocking (runs in background Task)

---

## Step 10: Full Loop Integration Test

Manual test flow:
1. Open app → download an exam
2. Take exam → answer some wrong intentionally in specific domains
3. Finish exam → verify:
   - `ExamResultsView` shows "Your Study Plan" with correct priorities
   - Wrong answers appear in review queue
   - Dashboard "Next Action" shows priority recommendation
   - Widget updates with SRS question
4. Wait 1 day (or adjust clock) → verify:
   - Widget shows the SRS question as due
   - Dashboard shows "X questions due for review"
5. Answer SRS question correctly → verify interval increases to 6 days
6. Download recommended lesson → complete it → verify mastery % updates

**Acceptance criteria:**
- [ ] Full loop works: exam → recommendations → download → study → next exam
- [ ] SRS intervals follow SM-2 schedule (1d → 6d → interval*EF)
- [ ] Widget reflects SRS state
- [ ] Dashboard priority order updates after completing recommended lessons

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `ios/EPPPStudy/Services/PriorityEngine.swift` | **NEW** | Domain priority calculator (port of priority-calculator.ts) |
| `ios/EPPPStudy/Services/SRSScheduler.swift` | **NEW** | SM-2 spaced repetition engine (port of review-queue.ts) |
| `ios/EPPPStudy/Models/StudyProgress.swift` | EDIT | Add `StudyRecommendation` model |
| `ios/EPPPStudy/Services/LocalStore.swift` | EDIT | Add review queue storage + recommendation storage |
| `ios/EPPPStudy/Views/Exams/ExamSessionView.swift` | EDIT | Wire priority engine + SRS on exam finish |
| `ios/EPPPStudy/Views/Exams/ExamResultsView.swift` | EDIT | Show study plan + download CTA |
| `ios/EPPPStudy/Views/Dashboard/DashboardView.swift` | EDIT | Smarter next action using priorities + SRS |
| `ios/EPPPStudy/Widget/WidgetDataProvider.swift` | EDIT | SRS question for widget |
| `ios/EPPPStudy/Services/ContentManager.swift` | EDIT | Auto-download recommended lessons |
| `ios/EPPPStudy/EPPPStudyApp.swift` | EDIT | Trigger widget refresh on background |

## Dependencies
- `CryptoKit` framework (already available in iOS 13+)
- No new packages needed
- No new API endpoints needed
