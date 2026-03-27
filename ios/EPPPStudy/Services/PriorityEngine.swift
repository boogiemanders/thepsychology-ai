import Foundation

/// Ports priority-calculator.ts — calculates priority scores based on (% wrong in domain) × (domain weight).
/// Used after exam completion to rank domains and recommend topics for study.
enum PriorityEngine {

    // MARK: - Domain Weights (from EPPP Part 1 specification)

    /// Official EPPP domain weights as percentages of the exam
    static let domainWeights: [Int: Double] = [
        1: 0.10, // Biological Bases
        2: 0.13, // Cognitive-Affective Bases
        3: 0.11, // Social & Cultural
        4: 0.12, // Growth & Lifespan
        5: 0.16, // Assessment & Diagnosis
        6: 0.15, // Treatment & Intervention
        7: 0.07, // Research Methods
        8: 0.16, // Ethical, Legal & Professional
    ]

    /// Default question counts per domain for practice exams
    private static let defaultQuestionCounts: [Int: Int] = [
        1: 23, 2: 29, 3: 25, 4: 27, 5: 36, 6: 34, 7: 18, 8: 33,
    ]

    // MARK: - Types

    struct DomainPerformance: Identifiable, Sendable {
        var id: Int { domainNumber }
        let domainNumber: Int
        let domainName: String
        let domainWeight: Double
        let totalQuestions: Int
        let totalWrong: Int
        let percentageWrong: Double
        let priorityScore: Double // (% wrong as decimal) × weight × 100
        let wrongQuestionIds: [String]
    }

    struct PriorityRecommendation: Sendable {
        let domain: String
        let domainNumber: Int
        let priorityScore: Double
        let percentageWrong: Double
        let recommendedLessonSlugs: [String]
    }

    // MARK: - Calculation

    /// Calculate domain performance from an exam session + exam data.
    /// Maps each question to its domain and computes priority scores.
    static func calculateDomainPerformance(
        session: ExamSession,
        exam: Exam
    ) -> [DomainPerformance] {
        // Count questions and wrong answers per domain
        var domainTotal: [String: Int] = [:]
        var domainWrong: [String: Int] = [:]
        var domainWrongIds: [String: [String]] = [:]

        for question in exam.questions {
            domainTotal[question.domain, default: 0] += 1

            if let answer = session.answers.first(where: { $0.questionId == question.id }) {
                if !answer.isCorrect {
                    domainWrong[question.domain, default: 0] += 1
                    domainWrongIds[question.domain, default: []].append(question.id)
                }
            } else {
                // Unanswered = wrong
                domainWrong[question.domain, default: 0] += 1
                domainWrongIds[question.domain, default: []].append(question.id)
            }
        }

        // Build performance for each domain found in the exam
        return Constants.Domain.allCases.enumerated().map { index, domain in
            let domainNumber = index + 1
            let name = domain.rawValue
            let total = domainTotal[name] ?? 0
            let wrong = domainWrong[name] ?? 0
            let weight = domainWeights[domainNumber] ?? 0.10

            let percentageWrong = total > 0 ? (Double(wrong) / Double(total)) * 100.0 : 0
            let priorityScore = (percentageWrong / 100.0) * weight * 100.0

            return DomainPerformance(
                domainNumber: domainNumber,
                domainName: name,
                domainWeight: weight * 100,
                totalQuestions: total,
                totalWrong: wrong,
                percentageWrong: (percentageWrong * 100).rounded() / 100,
                priorityScore: (priorityScore * 100).rounded() / 100,
                wrongQuestionIds: domainWrongIds[name] ?? []
            )
        }
    }

    /// Get top N priority domains sorted by priority score (highest first)
    static func getTopPriorityDomains(
        _ performance: [DomainPerformance],
        count: Int = 3
    ) -> [DomainPerformance] {
        performance
            .sorted { $0.priorityScore > $1.priorityScore }
            .prefix(count)
            .map { $0 }
    }

    /// Build recommendations: top 3 weak domains with lesson slugs to study.
    /// Prefers KN-based mapping from PriorityConfig when available, falls back to manifest matching.
    static func buildRecommendations(
        session: ExamSession,
        exam: Exam,
        manifest: ContentManifest?,
        config: PriorityConfig? = PriorityConfig.load()
    ) -> [PriorityRecommendation] {
        let performance = calculateDomainPerformance(session: session, exam: exam)
        let topPriorities = getTopPriorityDomains(performance)

        return topPriorities.map { perf in
            let lessonSlugs: [String]

            if let config {
                // Precise KN->topic->slug mapping
                lessonSlugs = config.recommendedLessonSlugs(forDomains: [perf.domainNumber])
            } else if let manifest {
                // Fallback: fuzzy match domain names in manifest
                lessonSlugs = manifest.domains
                    .filter { $0.name.contains(perf.domainName) || domainMatches($0.name, perf.domainName) }
                    .flatMap { $0.lessons.map(\.slug) }
            } else {
                lessonSlugs = []
            }

            return PriorityRecommendation(
                domain: perf.domainName,
                domainNumber: perf.domainNumber,
                priorityScore: perf.priorityScore,
                percentageWrong: perf.percentageWrong,
                recommendedLessonSlugs: lessonSlugs
            )
        }
    }

    /// Compute a single "next best action" domain based on study progress
    static func getWeakestDomain(from progress: StudyProgress) -> (domain: String, percentage: Double)? {
        guard !progress.domainMastery.isEmpty else { return nil }

        // Weight the mastery by domain weight to find highest-impact weak area
        var bestDomain: String?
        var bestScore = -1.0

        for (key, mastery) in progress.domainMastery {
            let domainNumber = Constants.Domain.allCases.firstIndex { $0.rawValue == key }
                .map { $0 + 1 } ?? 1
            let weight = domainWeights[domainNumber] ?? 0.10

            // Priority = (100 - mastery%) × weight — higher = more urgent
            let urgency = (100.0 - mastery.percentage) * weight
            if urgency > bestScore {
                bestScore = urgency
                bestDomain = key
            }
        }

        guard let domain = bestDomain,
              let mastery = progress.domainMastery[domain] else { return nil }
        return (domain, mastery.percentage)
    }

    // MARK: - Helpers

    /// Fuzzy match domain names (manifest may use slightly different naming)
    private static func domainMatches(_ manifestName: String, _ domainName: String) -> Bool {
        let keywords = domainName.lowercased().split(separator: " ").filter { $0.count > 3 }
        let target = manifestName.lowercased()
        return keywords.allSatisfy { target.contains($0) }
    }
}
