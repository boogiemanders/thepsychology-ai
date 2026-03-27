import Foundation

struct Exam: Codable, Identifiable, Sendable {
    let id: String
    let slug: String
    let title: String
    let domain: String
    let questions: [Question]
    let timeLimitMinutes: Int?
    let updatedAt: Date

    var questionCount: Int { questions.count }
}

struct Question: Codable, Identifiable, Sendable {
    let id: String
    let stem: String
    let choices: [Choice]
    let correctChoiceId: String
    let explanation: String
    let domain: String
    let subdomain: String?
    let difficulty: Difficulty

    struct Choice: Codable, Identifiable, Sendable {
        let id: String
        let label: String // "A", "B", "C", "D"
        let text: String
    }

    enum Difficulty: String, Codable, Sendable {
        case easy
        case medium
        case hard
    }
}

struct ExamSession: Codable, Identifiable, Sendable {
    let id: String
    let examId: String
    let userId: String
    let mode: ExamMode
    let startedAt: Date
    var completedAt: Date?
    var answers: [Answer]
    var flaggedQuestionIds: Set<String>
    var currentQuestionIndex: Int

    enum ExamMode: String, Codable, Sendable {
        case study  // Show answer after each question
        case test   // Show all answers at end
    }

    struct Answer: Codable, Sendable, Identifiable {
        var id: String { questionId }
        let questionId: String
        let selectedChoiceId: String?
        let isCorrect: Bool
        let timeSpentSeconds: Int
        let answeredAt: Date
    }

    var score: Double? {
        guard let _ = completedAt else { return nil }
        let answered = answers.filter { $0.selectedChoiceId != nil }
        guard !answered.isEmpty else { return 0 }
        let correct = answered.filter(\.isCorrect).count
        return Double(correct) / Double(answered.count)
    }

    var correctCount: Int {
        answers.filter(\.isCorrect).count
    }

    var totalAnswered: Int {
        answers.filter { $0.selectedChoiceId != nil }.count
    }
}

struct ExamResult: Codable, Identifiable, Sendable {
    let id: String
    let examId: String
    let sessionId: String
    let userId: String
    let mode: ExamSession.ExamMode
    let score: Double
    let correctCount: Int
    let totalQuestions: Int
    let totalTimeSeconds: Int
    let domainScores: [DomainScore]
    let completedAt: Date
    let weakAreas: [String]
    let recommendedLessons: [String]

    struct DomainScore: Codable, Sendable, Identifiable {
        var id: String { domain }
        let domain: String
        let correct: Int
        let total: Int
        var percentage: Double { total > 0 ? Double(correct) / Double(total) : 0 }
    }
}
