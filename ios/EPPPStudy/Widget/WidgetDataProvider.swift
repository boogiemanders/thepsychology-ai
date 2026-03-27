import Foundation

/// Shared data provider for widgets via App Group container.
/// The main app writes data; widgets read it.
struct WidgetDataProvider {
    private static let containerURL: URL? = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: Constants.appGroupID
    )

    private static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    // MARK: - Quick Question

    struct QuickQuestionData: Codable {
        let question: WidgetQuestion
        let updatedAt: Date
    }

    struct WidgetQuestion: Codable {
        let id: String
        let stem: String
        let choices: [WidgetChoice]
        let correctChoiceId: String
        let explanation: String
        let domain: String
    }

    struct WidgetChoice: Codable, Identifiable {
        let id: String
        let label: String
        let text: String
    }

    static func writeQuickQuestion(_ data: QuickQuestionData) {
        write(data, filename: "quick-question.json")
    }

    static func readQuickQuestion() -> QuickQuestionData? {
        read(QuickQuestionData.self, filename: "quick-question.json")
    }

    // MARK: - Continue Study

    struct ContinueStudyData: Codable {
        let title: String
        let subtitle: String
        let lessonSlug: String?
        let domain: String?
        let readinessScore: Double
        let streakDays: Int
        let updatedAt: Date
    }

    static func writeContinueStudy(_ data: ContinueStudyData) {
        write(data, filename: "continue-study.json")
    }

    static func readContinueStudy() -> ContinueStudyData? {
        read(ContinueStudyData.self, filename: "continue-study.json")
    }

    // MARK: - Countdown

    struct CountdownData: Codable {
        let examDate: Date?
        let daysRemaining: Int?
        let readinessScore: Double
        let updatedAt: Date
    }

    static func writeCountdown(_ data: CountdownData) {
        write(data, filename: "countdown.json")
    }

    static func readCountdown() -> CountdownData? {
        read(CountdownData.self, filename: "countdown.json")
    }

    // MARK: - Internal

    private static func write<T: Encodable>(_ value: T, filename: String) {
        guard let url = containerURL?.appendingPathComponent("widget", isDirectory: true) else { return }
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        let fileURL = url.appendingPathComponent(filename)
        if let data = try? encoder.encode(value) {
            try? data.write(to: fileURL)
        }
    }

    private static func read<T: Decodable>(_ type: T.Type, filename: String) -> T? {
        guard let url = containerURL?.appendingPathComponent("widget/\(filename)") else { return nil }
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(type, from: data)
    }
}
