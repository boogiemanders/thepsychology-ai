import SwiftUI

struct SettingsView: View {
    @Environment(AuthService.self) private var authService
    @Environment(SyncEngine.self) private var syncEngine

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink(destination: AccountView()) {
                        Label("Account", systemImage: "person.circle")
                    }
                    NavigationLink(destination: ExamDateView()) {
                        Label("Exam Date", systemImage: "calendar")
                    }
                    NavigationLink(destination: NotificationsView()) {
                        Label("Notifications", systemImage: "bell")
                    }
                }

                Section {
                    HStack {
                        Label("Last Synced", systemImage: "arrow.triangle.2.circlepath")
                        Spacer()
                        if let lastSync = syncEngine.lastSyncDate {
                            Text(lastSync.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            Text("Never")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    if syncEngine.pendingOperationCount > 0 {
                        HStack {
                            Label("Pending Changes", systemImage: "clock.arrow.circlepath")
                            Spacer()
                            Text("\(syncEngine.pendingOperationCount)")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }
                    }

                    Button {
                        Task { await syncEngine.sync() }
                    } label: {
                        HStack {
                            Label("Sync Now", systemImage: "arrow.clockwise")
                            Spacer()
                            if syncEngine.isSyncing {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(syncEngine.isSyncing)
                } header: {
                    Text("Data")
                }

                Section {
                    Link(destination: URL(string: "https://thepsychology.ai/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                    Link(destination: URL(string: "https://thepsychology.ai/terms")!) {
                        Label("Terms of Service", systemImage: "doc.text")
                    }
                } header: {
                    Text("Legal")
                }

                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    SettingsView()
        .environment(AuthService())
        .environment(SyncEngine(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore(),
            networkMonitor: NetworkMonitor()
        ))
        .preferredColorScheme(.dark)
}
