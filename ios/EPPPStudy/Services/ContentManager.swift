import Foundation
import Observation

@Observable
final class ContentManager: @unchecked Sendable {
    private let apiClient: APIClient
    private let localStore: LocalStore

    private(set) var manifest: ContentManifest?
    private(set) var activeDownloads: [String: DownloadTask] = [:]
    private(set) var totalStorageBytes: Int64 = 0

    var downloadProgress: [String: Double] {
        activeDownloads.mapValues(\.progress)
    }

    init(apiClient: APIClient, localStore: LocalStore) {
        self.apiClient = apiClient
        self.localStore = localStore
        Task { await calculateStorageUsage() }
    }

    // MARK: - Manifest

    func refreshManifest() async throws {
        manifest = try await apiClient.fetchManifest()
    }

    // MARK: - Download Lesson

    func downloadLesson(slug: String, title: String) async throws {
        let taskId = "lesson-\(slug)"
        activeDownloads[taskId] = DownloadTask(
            id: taskId,
            title: title,
            type: .lesson,
            progress: 0,
            state: .downloading,
            totalBytes: 0,
            downloadedBytes: 0
        )

        do {
            let lesson = try await apiClient.fetchLesson(slug: slug)
            activeDownloads[taskId]?.progress = 0.8

            try localStore.saveLesson(lesson)
            activeDownloads[taskId]?.progress = 1.0
            activeDownloads[taskId]?.state = .completed

            await calculateStorageUsage()

            // Remove from active downloads after a delay
            try? await Task.sleep(for: .seconds(2))
            activeDownloads.removeValue(forKey: taskId)
        } catch {
            activeDownloads[taskId]?.state = .failed(error.localizedDescription)
            throw error
        }
    }

    // MARK: - Download Exam

    func downloadExam(slug: String, title: String) async throws {
        let taskId = "exam-\(slug)"
        activeDownloads[taskId] = DownloadTask(
            id: taskId,
            title: title,
            type: .exam,
            progress: 0,
            state: .downloading,
            totalBytes: 0,
            downloadedBytes: 0
        )

        do {
            let exam = try await apiClient.fetchExam(slug: slug)
            activeDownloads[taskId]?.progress = 0.8

            try localStore.saveExam(exam)
            activeDownloads[taskId]?.progress = 1.0
            activeDownloads[taskId]?.state = .completed

            await calculateStorageUsage()

            try? await Task.sleep(for: .seconds(2))
            activeDownloads.removeValue(forKey: taskId)
        } catch {
            activeDownloads[taskId]?.state = .failed(error.localizedDescription)
            throw error
        }
    }

    // MARK: - Batch Download

    func downloadPlaylist(lessons: [(slug: String, title: String)]) async throws {
        for lesson in lessons {
            try await downloadLesson(slug: lesson.slug, title: lesson.title)
        }
    }

    // MARK: - Delete Content

    func deleteLesson(slug: String) throws {
        try localStore.deleteLesson(slug: slug)
        Task { await calculateStorageUsage() }
    }

    func deleteExam(slug: String) throws {
        try localStore.deleteExam(slug: slug)
        Task { await calculateStorageUsage() }
    }

    func deleteAllDownloads() throws {
        try localStore.deleteAllContent()
        Task { await calculateStorageUsage() }
    }

    // MARK: - Query

    func isLessonDownloaded(slug: String) -> Bool {
        localStore.hasLesson(slug: slug)
    }

    func isExamDownloaded(slug: String) -> Bool {
        localStore.hasExam(slug: slug)
    }

    func getDownloadedLessons() -> [Lesson] {
        localStore.getAllLessons()
    }

    func getDownloadedExams() -> [Exam] {
        localStore.getAllExams()
    }

    // MARK: - Storage

    private func calculateStorageUsage() async {
        totalStorageBytes = localStore.calculateStorageBytes()
    }

    var formattedStorageUsage: String {
        ByteCountFormatter.string(fromByteCount: totalStorageBytes, countStyle: .file)
    }
}
