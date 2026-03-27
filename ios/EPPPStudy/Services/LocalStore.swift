import Foundation

final class LocalStore: @unchecked Sendable {
    private let fileManager = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder: JSONDecoder
    private let queue = DispatchQueue(label: "ai.thepsychology.eppp.localstore")

    private let containerURL: URL
    private let lessonsDir: URL
    private let examsDir: URL
    private let progressDir: URL
    private let syncDir: URL
    private let widgetDir: URL
    private let reviewDir: URL

    init() {
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601

        let appGroupURL = fileManager.containerURL(
            forSecurityApplicationGroupIdentifier: Constants.appGroupID
        ) ?? fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!

        containerURL = appGroupURL
        lessonsDir = containerURL.appendingPathComponent("lessons", isDirectory: true)
        examsDir = containerURL.appendingPathComponent("exams", isDirectory: true)
        progressDir = containerURL.appendingPathComponent("progress", isDirectory: true)
        syncDir = containerURL.appendingPathComponent("sync", isDirectory: true)
        widgetDir = containerURL.appendingPathComponent("widget", isDirectory: true)
        reviewDir = containerURL.appendingPathComponent("review", isDirectory: true)

        createDirectories()
    }

    private func createDirectories() {
        for dir in [lessonsDir, examsDir, progressDir, syncDir, widgetDir, reviewDir] {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        }
    }

    // MARK: - Lessons

    func saveLesson(_ lesson: Lesson) throws {
        let data = try encoder.encode(lesson)
        let url = lessonsDir.appendingPathComponent("\(lesson.slug).json")
        try data.write(to: url)
    }

    func getLesson(slug: String) -> Lesson? {
        let url = lessonsDir.appendingPathComponent("\(slug).json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(Lesson.self, from: data)
    }

    func getAllLessons() -> [Lesson] {
        guard let files = try? fileManager.contentsOfDirectory(at: lessonsDir, includingPropertiesForKeys: nil) else {
            return []
        }
        return files
            .filter { $0.pathExtension == "json" }
            .compactMap { try? Data(contentsOf: $0) }
            .compactMap { try? decoder.decode(Lesson.self, from: $0) }
            .sorted { $0.order < $1.order }
    }

    func hasLesson(slug: String) -> Bool {
        fileManager.fileExists(atPath: lessonsDir.appendingPathComponent("\(slug).json").path)
    }

    func deleteLesson(slug: String) throws {
        let url = lessonsDir.appendingPathComponent("\(slug).json")
        if fileManager.fileExists(atPath: url.path) {
            try fileManager.removeItem(at: url)
        }
    }

    // MARK: - Exams

    func saveExam(_ exam: Exam) throws {
        let data = try encoder.encode(exam)
        let url = examsDir.appendingPathComponent("\(exam.slug).json")
        try data.write(to: url)
    }

    func getExam(slug: String) -> Exam? {
        let url = examsDir.appendingPathComponent("\(slug).json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(Exam.self, from: data)
    }

    func getAllExams() -> [Exam] {
        guard let files = try? fileManager.contentsOfDirectory(at: examsDir, includingPropertiesForKeys: nil) else {
            return []
        }
        return files
            .filter { $0.pathExtension == "json" }
            .compactMap { try? Data(contentsOf: $0) }
            .compactMap { try? decoder.decode(Exam.self, from: $0) }
    }

    func hasExam(slug: String) -> Bool {
        fileManager.fileExists(atPath: examsDir.appendingPathComponent("\(slug).json").path)
    }

    func deleteExam(slug: String) throws {
        let url = examsDir.appendingPathComponent("\(slug).json")
        if fileManager.fileExists(atPath: url.path) {
            try fileManager.removeItem(at: url)
        }
    }

    // MARK: - Lesson Progress

    func saveLessonProgress(_ progress: LessonProgress) {
        let url = progressDir.appendingPathComponent("lesson-\(progress.lessonId).json")
        if let data = try? encoder.encode(progress) {
            try? data.write(to: url)
        }
    }

    func getLessonProgress(id: String) -> LessonProgress? {
        let url = progressDir.appendingPathComponent("lesson-\(id).json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(LessonProgress.self, from: data)
    }

    // MARK: - Exam Results

    func saveExamResult(_ result: ExamResult) {
        let url = progressDir.appendingPathComponent("exam-result-\(result.id).json")
        if let data = try? encoder.encode(result) {
            try? data.write(to: url)
        }
    }

    func hasExamResult(id: String) -> Bool {
        fileManager.fileExists(atPath: progressDir.appendingPathComponent("exam-result-\(id).json").path)
    }

    func getAllExamResults() -> [ExamResult] {
        guard let files = try? fileManager.contentsOfDirectory(at: progressDir, includingPropertiesForKeys: nil) else {
            return []
        }
        return files
            .filter { $0.lastPathComponent.hasPrefix("exam-result-") }
            .compactMap { try? Data(contentsOf: $0) }
            .compactMap { try? decoder.decode(ExamResult.self, from: $0) }
            .sorted { $0.completedAt > $1.completedAt }
    }

    // MARK: - Study Progress

    func saveStudyProgress(_ progress: StudyProgress) {
        let url = progressDir.appendingPathComponent("study-progress.json")
        if let data = try? encoder.encode(progress) {
            try? data.write(to: url)
        }
    }

    func getStudyProgress() -> StudyProgress? {
        let url = progressDir.appendingPathComponent("study-progress.json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(StudyProgress.self, from: data)
    }

    // MARK: - Study Streak

    func saveStreak(_ streak: StudyStreak) {
        let url = progressDir.appendingPathComponent("streak.json")
        if let data = try? encoder.encode(streak) {
            try? data.write(to: url)
        }
    }

    func getStreak() -> StudyStreak {
        let url = progressDir.appendingPathComponent("streak.json")
        guard let data = try? Data(contentsOf: url),
              let streak = try? decoder.decode(StudyStreak.self, from: data) else {
            return StudyStreak(currentStreak: 0, longestStreak: 0, lastStudyDate: nil, studyDates: [])
        }
        return streak
    }

    // MARK: - Sync Queue

    func saveSyncOperation(_ operation: SyncOperation) {
        let url = syncDir.appendingPathComponent("\(operation.id.uuidString).json")
        if let data = try? encoder.encode(operation) {
            try? data.write(to: url)
        }
    }

    func getPendingOperations() -> [SyncOperation] {
        guard let files = try? fileManager.contentsOfDirectory(at: syncDir, includingPropertiesForKeys: nil) else {
            return []
        }
        return files
            .filter { $0.pathExtension == "json" }
            .compactMap { try? Data(contentsOf: $0) }
            .compactMap { try? decoder.decode(SyncOperation.self, from: $0) }
            .filter { $0.status == .pending || $0.status == .failed }
            .sorted { $0.createdAt < $1.createdAt }
    }

    func markOperationSynced(id: UUID) {
        let url = syncDir.appendingPathComponent("\(id.uuidString).json")
        // Remove synced operations to keep the queue clean
        try? fileManager.removeItem(at: url)
    }

    func markOperationFailed(id: UUID) {
        let url = syncDir.appendingPathComponent("\(id.uuidString).json")
        guard let data = try? Data(contentsOf: url),
              var op = try? decoder.decode(SyncOperation.self, from: data) else { return }
        op.status = .failed
        op.retryCount += 1
        if let newData = try? encoder.encode(op) {
            try? newData.write(to: url)
        }
    }

    // MARK: - Widget Data

    func saveWidgetData<T: Encodable>(_ data: T, filename: String) {
        let url = widgetDir.appendingPathComponent(filename)
        if let encoded = try? encoder.encode(data) {
            try? encoded.write(to: url)
        }
    }

    func loadWidgetData<T: Decodable>(_ type: T.Type, filename: String) -> T? {
        let url = widgetDir.appendingPathComponent(filename)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(type, from: data)
    }

    // MARK: - Review Items (SRS)

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

    /// Get review items that are due (nextReviewAt <= now), sorted by most overdue first.
    func getDueReviewItems(limit: Int) -> [ReviewItem] {
        let now = Date()
        return getAllReviewItems()
            .filter { !$0.suspended && $0.nextReviewAt <= now }
            .sorted { $0.nextReviewAt < $1.nextReviewAt }
            .prefix(limit)
            .map { $0 }
    }

    func deleteReviewItem(questionKey: String) {
        let url = reviewDir.appendingPathComponent("\(questionKey).json")
        try? fileManager.removeItem(at: url)
    }

    func reviewItemCount() -> Int {
        (try? fileManager.contentsOfDirectory(at: reviewDir, includingPropertiesForKeys: nil))?.count ?? 0
    }

    // MARK: - Storage

    func calculateStorageBytes() -> Int64 {
        var total: Int64 = 0
        for dir in [lessonsDir, examsDir, progressDir] {
            if let enumerator = fileManager.enumerator(at: dir, includingPropertiesForKeys: [.fileSizeKey]) {
                for case let url as URL in enumerator {
                    if let size = try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                        total += Int64(size)
                    }
                }
            }
        }
        return total
    }

    func deleteAllContent() throws {
        for dir in [lessonsDir, examsDir] {
            let files = try fileManager.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            for file in files {
                try fileManager.removeItem(at: file)
            }
        }
    }
}
