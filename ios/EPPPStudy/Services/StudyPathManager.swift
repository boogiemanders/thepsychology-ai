import Foundation
import WidgetKit

/// Orchestrates the adaptive study path after exam completion.
/// Ties together PriorityEngine, ReviewScheduler, ContentManager, and widget updates.
final class StudyPathManager: Sendable {
    private let localStore: LocalStore
    private let contentManager: ContentManager

    init(localStore: LocalStore, contentManager: ContentManager) {
        self.localStore = localStore
        self.contentManager = contentManager
    }

    // MARK: - Post-Exam Processing

    /// Full processing pipeline after an exam is completed.
    /// 1. Run priority engine to rank weak domains
    /// 2. Feed wrong answers into SRS scheduler
    /// 3. Update study progress with new domain mastery
    /// 4. Auto-queue recommended lesson downloads
    /// 5. Update widget data with next review question
    func processExamCompletion(
        session: ExamSession,
        exam: Exam,
        result: ExamResult
    ) async {
        // 1. Calculate priorities
        let recommendations = PriorityEngine.buildRecommendations(
            session: session,
            exam: exam,
            manifest: contentManager.manifest
        )

        // 2. Process answers through SRS
        ReviewScheduler.processExamAnswers(
            session: session,
            exam: exam,
            localStore: localStore
        )

        // 3. Update domain mastery in study progress
        updateStudyProgress(result: result, recommendations: recommendations)

        // 4. Auto-download recommended lessons (top priority domain only)
        if let topRecommendation = recommendations.first {
            await autoDownloadLessons(recommendation: topRecommendation)
        }

        // 5. Update widget with next SRS question
        updateWidgetWithReviewQuestion()

        // 6. Reload widgets
        WidgetCenter.shared.reloadAllTimelines()
    }

    // MARK: - Study Progress

    private func updateStudyProgress(
        result: ExamResult,
        recommendations: [PriorityEngine.PriorityRecommendation]
    ) {
        var progress = localStore.getStudyProgress() ?? StudyProgress(
            userId: result.userId,
            domainMastery: [:],
            streakDays: 0,
            lastStudyDate: nil,
            totalStudyTimeSeconds: 0,
            lessonsCompleted: 0,
            examsCompleted: 0,
            examDate: nil,
            readinessScore: 0
        )

        // Update domain mastery from exam domain scores
        for domainScore in result.domainScores {
            var mastery = progress.domainMastery[domainScore.domain] ?? StudyProgress.DomainMastery(
                domain: domainScore.domain,
                percentage: 0,
                questionsAttempted: 0,
                questionsCorrect: 0,
                lessonsCompleted: 0,
                totalLessons: 0,
                lastStudiedAt: nil
            )

            // Accumulate attempts and correct counts
            mastery = StudyProgress.DomainMastery(
                domain: domainScore.domain,
                percentage: calculateRunningMastery(
                    existingPercentage: mastery.percentage,
                    existingAttempts: mastery.questionsAttempted,
                    newCorrect: domainScore.correct,
                    newTotal: domainScore.total
                ),
                questionsAttempted: mastery.questionsAttempted + domainScore.total,
                questionsCorrect: mastery.questionsCorrect + domainScore.correct,
                lessonsCompleted: mastery.lessonsCompleted,
                totalLessons: mastery.totalLessons,
                lastStudiedAt: Date()
            )
            progress.domainMastery[domainScore.domain] = mastery
        }

        // Update aggregate stats
        progress.examsCompleted += 1
        progress.totalStudyTimeSeconds += result.totalTimeSeconds
        progress.lastStudyDate = Date()

        // Recalculate readiness score (weighted average of domain mastery)
        progress.readinessScore = calculateReadinessScore(mastery: progress.domainMastery)

        localStore.saveStudyProgress(progress)

        // Update streak
        var streak = localStore.getStreak()
        streak.recordStudy()
        localStore.saveStreak(streak)
    }

    /// Running weighted average: blends historical mastery with new exam performance.
    /// More recent exams carry more weight (70/30 split).
    private func calculateRunningMastery(
        existingPercentage: Double,
        existingAttempts: Int,
        newCorrect: Int,
        newTotal: Int
    ) -> Double {
        guard newTotal > 0 else { return existingPercentage }
        let newPercentage = (Double(newCorrect) / Double(newTotal)) * 100

        if existingAttempts == 0 {
            return newPercentage
        }

        // Weighted: 30% historical, 70% new performance
        return existingPercentage * 0.3 + newPercentage * 0.7
    }

    /// Readiness score: weighted average of domain mastery using EPPP domain weights
    private func calculateReadinessScore(mastery: [String: StudyProgress.DomainMastery]) -> Double {
        guard !mastery.isEmpty else { return 0 }

        var weightedSum = 0.0
        var totalWeight = 0.0

        for (index, domain) in Constants.Domain.allCases.enumerated() {
            let domainNumber = index + 1
            let weight = PriorityEngine.domainWeights[domainNumber] ?? 0.10

            if let m = mastery[domain.rawValue] {
                weightedSum += m.percentage * weight
                totalWeight += weight
            }
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0
    }

    // MARK: - Auto-Download

    /// Download lessons for the highest-priority weak domain (up to 3 lessons).
    private func autoDownloadLessons(recommendation: PriorityEngine.PriorityRecommendation) async {
        let slugsToDownload = recommendation.recommendedLessonSlugs
            .filter { !contentManager.isLessonDownloaded(slug: $0) }
            .prefix(3)

        for slug in slugsToDownload {
            let title = recommendation.domain
            try? await contentManager.downloadLesson(slug: slug, title: title)
        }
    }

    // MARK: - Widget Updates

    /// Write the next SRS-due question to widget data for the QuickQuestion widget.
    func updateWidgetWithReviewQuestion() {
        guard let reviewItem = ReviewScheduler.getNextDueQuestion(localStore: localStore) else {
            return
        }

        // Convert ReviewItem to widget format
        let choices: [WidgetDataProvider.WidgetChoice]
        if let options = reviewItem.options {
            choices = options.enumerated().map { index, text in
                let label = String(UnicodeScalar(65 + index)!) // A, B, C, D
                return WidgetDataProvider.WidgetChoice(id: label, label: label, text: text)
            }
        } else {
            choices = []
        }

        let correctChoiceId: String
        if let correctAnswer = reviewItem.correctAnswer,
           let options = reviewItem.options,
           let index = options.firstIndex(of: correctAnswer) {
            correctChoiceId = String(UnicodeScalar(65 + index)!)
        } else {
            correctChoiceId = "A"
        }

        let widgetQuestion = WidgetDataProvider.WidgetQuestion(
            id: reviewItem.questionKey,
            stem: reviewItem.question,
            choices: choices,
            correctChoiceId: correctChoiceId,
            explanation: "",
            domain: reviewItem.domain ?? "Review"
        )

        WidgetDataProvider.writeQuickQuestion(
            WidgetDataProvider.QuickQuestionData(
                question: widgetQuestion,
                updatedAt: Date()
            )
        )
    }

    /// Update the ContinueStudy widget with latest progress and next action
    func updateContinueStudyWidget() {
        let progress = localStore.getStudyProgress()
        let streak = localStore.getStreak()
        let dueCount = ReviewScheduler.getDueCount(localStore: localStore)

        let title: String
        let subtitle: String
        var lessonSlug: String? = nil
        var domain: String? = nil

        if dueCount > 0 {
            title = "\(dueCount) questions due for review"
            subtitle = "Spaced repetition keeps knowledge fresh"
        } else if let weakest = progress.flatMap({ PriorityEngine.getWeakestDomain(from: $0) }),
                  weakest.percentage < 50 {
            title = "Review \(weakest.domain)"
            subtitle = "Your weakest area at \(Int(weakest.percentage))%"
            domain = weakest.domain
        } else {
            title = "Keep studying"
            subtitle = "You're making great progress"
        }

        WidgetDataProvider.writeContinueStudy(
            WidgetDataProvider.ContinueStudyData(
                title: title,
                subtitle: subtitle,
                lessonSlug: lessonSlug,
                domain: domain,
                readinessScore: progress?.readinessScore ?? 0,
                streakDays: streak.currentStreak,
                updatedAt: Date()
            )
        )
    }
}
