import SwiftUI

@main
struct EPPPStudyApp: App {
    @State private var authService = AuthService()
    @State private var networkMonitor = NetworkMonitor()
    @State private var notificationService = NotificationService()

    private let localStore = LocalStore()
    @State private var apiClient: APIClient?
    @State private var contentManager: ContentManager?
    @State private var syncEngine: SyncEngine?

    var body: some Scene {
        WindowGroup {
            Group {
                if authService.isAuthenticated {
                    if let contentManager, let syncEngine, let apiClient {
                        MainTabView()
                            .environment(authService)
                            .environment(networkMonitor)
                            .environment(notificationService)
                            .environment(localStore)
                            .environment(apiClient)
                            .environment(contentManager)
                            .environment(syncEngine)
                    } else {
                        ProgressView("Loading...")
                            .task { initializeServices() }
                    }
                } else {
                    SignInView()
                        .environment(authService)
                }
            }
            .preferredColorScheme(.dark)
            .tint(.white)
            .onChange(of: authService.isAuthenticated) { _, isAuthenticated in
                if isAuthenticated {
                    initializeServices()
                    Task { await performInitialSync() }
                } else {
                    teardownServices()
                }
            }
        }
    }

    private func initializeServices() {
        let client = APIClient(authService: authService)
        let content = ContentManager(apiClient: client, localStore: localStore)
        let sync = SyncEngine(apiClient: client, localStore: localStore, networkMonitor: networkMonitor)

        self.apiClient = client
        self.contentManager = content
        self.syncEngine = sync

        sync.startPeriodicSync()
    }

    private func teardownServices() {
        syncEngine?.stopPeriodicSync()
        apiClient = nil
        contentManager = nil
        syncEngine = nil
    }

    private func performInitialSync() async {
        guard let syncEngine else { return }

        do {
            try await syncEngine.bootstrapSync()
        } catch {
            // Bootstrap failed, will retry on next sync
        }

        // Refresh manifest
        try? await contentManager?.refreshManifest()

        // Update widget data
        updateWidgetData()
    }

    private func updateWidgetData() {
        let progress = localStore.getStudyProgress()
        let streak = localStore.getStreak()

        // Quick question widget: serve SRS-due question if available
        if let contentManager {
            let studyPath = StudyPathManager(localStore: localStore, contentManager: contentManager)
            studyPath.updateWidgetWithReviewQuestion()
            studyPath.updateContinueStudyWidget()
        } else if let progress {
            WidgetDataProvider.writeContinueStudy(.init(
                title: "Continue studying",
                subtitle: "Pick up where you left off",
                lessonSlug: nil,
                domain: nil,
                readinessScore: progress.readinessScore,
                streakDays: streak.currentStreak,
                updatedAt: Date()
            ))
        }

        // Countdown widget
        if let progress {
            WidgetDataProvider.writeCountdown(.init(
                examDate: progress.examDate,
                daysRemaining: progress.daysUntilExam,
                readinessScore: progress.readinessScore,
                updatedAt: Date()
            ))
        }
    }
}
