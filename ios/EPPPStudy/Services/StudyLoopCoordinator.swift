import Foundation
import Observation

/// Tracks the adaptive study loop phase: exam → weak areas → recommended lessons → next exam.
/// Wraps StudyPathManager for the heavy lifting, adds phase state for UI binding.
@Observable
final class StudyLoopCoordinator {
    let localStore: LocalStore
    let contentManager: ContentManager
    let syncEngine: SyncEngine

    var currentPhase: StudyPhase = .idle
    var recommendedLessons: [String] = []
    var completedRecommendedLessons: [String] = []
    var nextExamSlug: String? = nil
    var isDownloadingRecommendations: Bool = false

    private lazy var studyPath = StudyPathManager(localStore: localStore, contentManager: contentManager)

    enum StudyPhase: Sendable {
        case idle
        case examCompleted(examId: String)
        case studyingRecommendedLessons
        case readyForNextExam
    }

    init(localStore: LocalStore, contentManager: ContentManager, syncEngine: SyncEngine) {
        self.localStore = localStore
        self.contentManager = contentManager
        self.syncEngine = syncEngine
        restorePhase()
    }

    // MARK: - Post-Exam

    func onExamCompleted(session: ExamSession, exam: Exam, result: ExamResult) async {
        currentPhase = .examCompleted(examId: result.examId)

        // Delegate heavy processing to StudyPathManager
        await studyPath.processExamCompletion(session: session, exam: exam, result: result)

        // Set recommended lessons from priority engine
        let recommendations = PriorityEngine.buildRecommendations(
            session: session, exam: exam, manifest: contentManager.manifest
        )
        recommendedLessons = recommendations.flatMap(\.recommendedLessonSlugs)
        completedRecommendedLessons = []

        // Filter to only lessons not already completed
        let progress = localStore.getStudyProgress()
        if let progress {
            recommendedLessons = recommendedLessons.filter { slug in
                let lp = localStore.getLessonProgress(id: slug)
                return lp == nil // not yet started
            }
        }

        if !recommendedLessons.isEmpty {
            currentPhase = .studyingRecommendedLessons
        } else {
            currentPhase = .readyForNextExam
        }

        // Enqueue sync for exam result
        let syncOp = SyncOperation(
            type: .examResult,
            payload: try? JSONEncoder().encode(result),
            resourceId: result.id
        )
        localStore.saveSyncOperation(syncOp)
        await syncEngine.syncIfNeeded()
    }

    // MARK: - Post-Lesson

    func onLessonCompleted(slug: String) {
        guard !completedRecommendedLessons.contains(slug) else { return }
        completedRecommendedLessons.append(slug)

        // Update streak
        var streak = localStore.getStreak()
        streak.recordStudy()
        localStore.saveStreak(streak)

        // Check completion threshold (70%)
        let threshold = max(1, Int(Double(recommendedLessons.count) * 0.7))
        if completedRecommendedLessons.count >= threshold {
            currentPhase = .readyForNextExam
            // Prefetch next exam if available
            Task { await prefetchNextExam() }
        }

        studyPath.updateContinueStudyWidget()
    }

    // MARK: - Next Action

    func getNextAction() -> NextAction {
        // Check SRS reviews first
        let dueCount = localStore.getDueReviewItems(limit: 1).count
        if dueCount > 0 {
            return NextAction(
                type: .quickStudy,
                title: "Review Due Questions",
                subtitle: "\(localStore.getDueReviewItems(limit: 100).count) questions ready for review",
                destination: .quickStudy
            )
        }

        switch currentPhase {
        case .idle:
            return NextAction(
                type: .takeExam,
                title: "Take a Practice Exam",
                subtitle: "Start with a diagnostic to find your weak areas",
                destination: .quickStudy
            )

        case .examCompleted:
            if let firstLesson = recommendedLessons.first {
                return NextAction(
                    type: .reviewWeakArea,
                    title: "Study Your Weak Areas",
                    subtitle: "\(recommendedLessons.count) lessons recommended",
                    destination: .lesson(slug: firstLesson)
                )
            }
            return NextAction(
                type: .takeExam,
                title: "Take Another Exam",
                subtitle: "Keep practicing to improve",
                destination: .quickStudy
            )

        case .studyingRecommendedLessons:
            let remaining = recommendedLessons.filter { !completedRecommendedLessons.contains($0) }
            if let next = remaining.first {
                return NextAction(
                    type: .continueLesson,
                    title: "Continue Studying",
                    subtitle: "\(completedRecommendedLessons.count)/\(recommendedLessons.count) lessons done",
                    destination: .lesson(slug: next)
                )
            }
            currentPhase = .readyForNextExam
            return getNextAction()

        case .readyForNextExam:
            if let examSlug = nextExamSlug {
                return NextAction(
                    type: .takeExam,
                    title: "Ready for Next Exam",
                    subtitle: "You've completed enough study material",
                    destination: .exam(slug: examSlug)
                )
            }
            return NextAction(
                type: .takeExam,
                title: "Take a Practice Exam",
                subtitle: "Test your knowledge after studying",
                destination: .quickStudy
            )
        }
    }

    // MARK: - Readiness

    func computeReadinessScore() -> Double {
        guard let progress = localStore.getStudyProgress() else { return 0 }
        return progress.readinessScore
    }

    var recommendedLessonProgress: (completed: Int, total: Int) {
        (completedRecommendedLessons.count, recommendedLessons.count)
    }

    // MARK: - Private

    private func prefetchNextExam() async {
        let exams = localStore.getAllExams()
        let completedIds = Set(localStore.getAllExamResults().map(\.examId))
        if let next = exams.first(where: { !completedIds.contains($0.id) }) {
            nextExamSlug = next.slug
        }
    }

    private func restorePhase() {
        // On launch, check if we have incomplete recommended lessons
        let results = localStore.getAllExamResults()
        guard let latest = results.first else {
            currentPhase = .idle
            return
        }

        if !latest.recommendedLessons.isEmpty {
            recommendedLessons = latest.recommendedLessons
            // Check which are completed
            completedRecommendedLessons = recommendedLessons.filter { slug in
                localStore.getLessonProgress(id: slug) != nil
            }

            let threshold = max(1, Int(Double(recommendedLessons.count) * 0.7))
            if completedRecommendedLessons.count >= threshold {
                currentPhase = .readyForNextExam
            } else {
                currentPhase = .studyingRecommendedLessons
            }
        } else {
            currentPhase = .idle
        }
    }
}
