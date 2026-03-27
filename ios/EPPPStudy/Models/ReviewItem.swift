import Foundation

/// On-device SRS (Spaced Repetition System) state for a single question.
/// Mirrors the web review_queue table schema for sync compatibility.
struct ReviewItem: Codable, Identifiable, Sendable {
    var id: String { questionKey }

    let questionKey: String
    let examType: ExamType
    let domain: String?
    let topic: String?
    let question: String
    let options: [String]?
    let correctAnswer: String?
    var lastAnswer: String?
    var lastWasCorrect: Bool
    var lastAttempted: Date

    // SM-2 scheduling fields
    var repetitions: Int
    var intervalDays: Int
    var easeFactor: Double
    var nextReviewAt: Date
    var suspended: Bool

    enum ExamType: String, Codable, Sendable {
        case quiz
        case diagnostic
        case practice
    }

    /// Whether this item is due for review (next review date is in the past or today)
    var isDue: Bool {
        nextReviewAt <= Date()
    }

    /// Days until next review (negative = overdue)
    var daysUntilReview: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: nextReviewAt).day ?? 0
    }

    /// Create a new review item from a wrong answer
    init(
        questionKey: String,
        examType: ExamType,
        domain: String?,
        topic: String?,
        question: String,
        options: [String]?,
        correctAnswer: String?,
        lastAnswer: String?,
        lastWasCorrect: Bool,
        lastAttempted: Date
    ) {
        self.questionKey = questionKey
        self.examType = examType
        self.domain = domain
        self.topic = topic
        self.question = question
        self.options = options
        self.correctAnswer = correctAnswer
        self.lastAnswer = lastAnswer
        self.lastWasCorrect = lastWasCorrect
        self.lastAttempted = lastAttempted
        self.repetitions = 0
        self.intervalDays = 1
        self.easeFactor = 2.5
        self.nextReviewAt = lastAttempted.addingTimeInterval(86400) // 1 day
        self.suspended = false
    }
}
