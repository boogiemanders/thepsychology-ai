import Foundation

struct Lesson: Codable, Identifiable, Sendable {
    let id: String
    let slug: String
    let title: String
    let domain: String
    let content: String // Markdown content
    let summary: String?
    let keyTerms: [KeyTerm]?
    let audioURL: String?
    let audioDurationSeconds: Int?
    let estimatedReadingMinutes: Int
    let order: Int
    let updatedAt: Date

    struct KeyTerm: Codable, Sendable, Identifiable {
        var id: String { term }
        let term: String
        let definition: String
    }
}

struct LessonProgress: Codable, Identifiable, Sendable {
    var id: String { lessonId }
    let lessonId: String
    let userId: String
    var completed: Bool
    var completedAt: Date?
    var lastReadPosition: Double // 0.0 to 1.0 scroll position
    var audioPosition: TimeInterval?
    var timeSpentSeconds: Int
    var updatedAt: Date

    init(lessonId: String, userId: String) {
        self.lessonId = lessonId
        self.userId = userId
        self.completed = false
        self.completedAt = nil
        self.lastReadPosition = 0
        self.audioPosition = nil
        self.timeSpentSeconds = 0
        self.updatedAt = Date()
    }
}
