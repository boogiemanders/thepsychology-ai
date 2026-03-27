import Foundation

struct StudyProgress: Codable, Sendable {
    let userId: String
    var domainMastery: [String: DomainMastery]
    var streakDays: Int
    var lastStudyDate: Date?
    var totalStudyTimeSeconds: Int
    var lessonsCompleted: Int
    var examsCompleted: Int
    var examDate: Date?
    var readinessScore: Double // 0-100

    struct DomainMastery: Codable, Sendable {
        let domain: String
        var percentage: Double // 0-100
        var questionsAttempted: Int
        var questionsCorrect: Int
        var lessonsCompleted: Int
        var totalLessons: Int
        var lastStudiedAt: Date?
    }

    var daysUntilExam: Int? {
        guard let examDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: examDate).day
    }

    var isStreakActive: Bool {
        guard let lastStudyDate else { return false }
        return Calendar.current.isDateInToday(lastStudyDate)
            || Calendar.current.isDateInYesterday(lastStudyDate)
    }
}

struct StudyStreak: Codable, Sendable {
    var currentStreak: Int
    var longestStreak: Int
    var lastStudyDate: Date?
    var studyDates: [Date] // Last 30 days of study activity

    mutating func recordStudy() {
        let today = Date()
        let calendar = Calendar.current

        if let last = lastStudyDate {
            if calendar.isDateInToday(last) {
                // Already studied today
                return
            } else if calendar.isDateInYesterday(last) {
                currentStreak += 1
            } else {
                currentStreak = 1
            }
        } else {
            currentStreak = 1
        }

        longestStreak = max(longestStreak, currentStreak)
        lastStudyDate = today

        studyDates.append(today)
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: today) ?? today
        studyDates = studyDates.filter { $0 >= thirtyDaysAgo }
    }
}

struct NextAction: Sendable {
    let type: ActionType
    let title: String
    let subtitle: String
    let destination: Destination

    enum ActionType: Sendable {
        case continueLesson
        case reviewWeakArea
        case takeExam
        case quickStudy
    }

    enum Destination: Sendable {
        case lesson(slug: String)
        case exam(slug: String)
        case quickStudy
        case domain(String)
    }
}
