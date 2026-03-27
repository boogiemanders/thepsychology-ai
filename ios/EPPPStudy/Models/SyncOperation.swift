import Foundation

struct SyncOperation: Codable, Identifiable, Sendable {
    let id: UUID
    let type: OperationType
    let entityId: String
    let payload: Data
    let createdAt: Date
    var syncedAt: Date?
    var status: SyncStatus
    var retryCount: Int

    enum OperationType: String, Codable, Sendable {
        case lessonProgress
        case examResult
        case studyStreak
        case bookmark
        case noteUpdate
    }

    enum SyncStatus: String, Codable, Sendable {
        case pending
        case syncing
        case synced
        case failed
    }

    init(type: OperationType, entityId: String, payload: Data) {
        self.id = UUID()
        self.type = type
        self.entityId = entityId
        self.payload = payload
        self.createdAt = Date()
        self.syncedAt = nil
        self.status = .pending
        self.retryCount = 0
    }
}

struct SyncPullResponse: Codable, Sendable {
    let timestamp: Date
    let lessonProgress: [LessonProgress]?
    let examResults: [ExamResult]?
    let studyProgress: StudyProgress?
}

struct SyncPushResponse: Codable, Sendable {
    let accepted: [UUID]
    let rejected: [SyncRejection]

    struct SyncRejection: Codable, Sendable {
        let operationId: UUID
        let reason: String
    }
}
