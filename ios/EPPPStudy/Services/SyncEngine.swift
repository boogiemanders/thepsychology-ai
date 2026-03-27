import Foundation
import Observation

@Observable
final class SyncEngine: @unchecked Sendable {
    private let apiClient: APIClient
    private let localStore: LocalStore
    private let networkMonitor: NetworkMonitor

    private(set) var isSyncing = false
    private(set) var lastSyncDate: Date?
    private(set) var pendingOperationCount = 0

    private var syncTask: Task<Void, Never>?

    init(apiClient: APIClient, localStore: LocalStore, networkMonitor: NetworkMonitor) {
        self.apiClient = apiClient
        self.localStore = localStore
        self.networkMonitor = networkMonitor

        self.lastSyncDate = UserDefaults.standard.object(forKey: Constants.UserDefaultsKeys.lastSyncTimestamp) as? Date
        self.pendingOperationCount = localStore.getPendingOperations().count

        networkMonitor.onConnectionRestored = { [weak self] in
            Task { await self?.sync() }
        }
    }

    // MARK: - Queue Operations

    func enqueue(_ operation: SyncOperation) {
        localStore.saveSyncOperation(operation)
        pendingOperationCount = localStore.getPendingOperations().count

        if networkMonitor.isConnected {
            Task { await sync() }
        }
    }

    func enqueueLessonProgress(_ progress: LessonProgress) {
        guard let data = try? JSONEncoder().encode(progress) else { return }
        let op = SyncOperation(type: .lessonProgress, entityId: progress.lessonId, payload: data)
        enqueue(op)
    }

    func enqueueExamResult(_ result: ExamResult) {
        guard let data = try? JSONEncoder().encode(result) else { return }
        let op = SyncOperation(type: .examResult, entityId: result.id, payload: data)
        enqueue(op)
    }

    func enqueueStreakUpdate(_ streak: StudyStreak) {
        guard let data = try? JSONEncoder().encode(streak) else { return }
        let op = SyncOperation(type: .studyStreak, entityId: "streak", payload: data)
        enqueue(op)
    }

    // MARK: - Sync

    func sync() async {
        guard !isSyncing, networkMonitor.isConnected else { return }

        isSyncing = true
        defer {
            isSyncing = false
            pendingOperationCount = localStore.getPendingOperations().count
        }

        // Push local changes
        await pushPendingOperations()

        // Pull remote changes
        await pullRemoteChanges()

        lastSyncDate = Date()
        UserDefaults.standard.set(lastSyncDate, forKey: Constants.UserDefaultsKeys.lastSyncTimestamp)
    }

    func bootstrapSync() async throws {
        guard networkMonitor.isConnected else { return }

        isSyncing = true
        defer { isSyncing = false }

        let response = try await apiClient.bootstrapSync()
        mergeRemoteData(response)

        lastSyncDate = Date()
        UserDefaults.standard.set(lastSyncDate, forKey: Constants.UserDefaultsKeys.lastSyncTimestamp)
    }

    // MARK: - Push

    private func pushPendingOperations() async {
        let pending = localStore.getPendingOperations()
        guard !pending.isEmpty else { return }

        do {
            let response = try await apiClient.pushSync(operations: pending)

            for acceptedId in response.accepted {
                localStore.markOperationSynced(id: acceptedId)
            }

            for rejection in response.rejected {
                localStore.markOperationFailed(id: rejection.operationId)
            }
        } catch {
            // Will retry on next sync
        }
    }

    // MARK: - Pull

    private func pullRemoteChanges() async {
        let since = lastSyncDate ?? Date.distantPast

        do {
            let response = try await apiClient.pullSync(since: since)
            mergeRemoteData(response)
        } catch {
            // Will retry on next sync
        }
    }

    // MARK: - Merge

    private func mergeRemoteData(_ response: SyncPullResponse) {
        // Merge lesson progress (latest timestamp wins)
        if let remoteProgress = response.lessonProgress {
            for remote in remoteProgress {
                if let local = localStore.getLessonProgress(id: remote.lessonId) {
                    if remote.updatedAt > local.updatedAt {
                        localStore.saveLessonProgress(remote)
                    }
                } else {
                    localStore.saveLessonProgress(remote)
                }
            }
        }

        // Append exam results (never overwrite)
        if let remoteResults = response.examResults {
            for result in remoteResults {
                if !localStore.hasExamResult(id: result.id) {
                    localStore.saveExamResult(result)
                }
            }
        }

        // Merge study progress
        if let remoteStudy = response.studyProgress {
            localStore.saveStudyProgress(remoteStudy)
        }
    }

    // MARK: - Periodic Sync

    func startPeriodicSync(interval: TimeInterval = 300) {
        syncTask?.cancel()
        syncTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(interval))
                await sync()
            }
        }
    }

    func stopPeriodicSync() {
        syncTask?.cancel()
        syncTask = nil
    }
}
