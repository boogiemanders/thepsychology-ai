import SwiftUI

struct PlaylistView: View {
    @Environment(ContentManager.self) private var contentManager
    @Environment(LocalStore.self) private var localStore

    struct Playlist: Identifiable {
        let id = UUID()
        let name: String
        let domain: String
        let lessonSlugs: [String]
    }

    @State private var playlists: [Playlist] = []
    @State private var isDownloading = false
    @State private var downloadingPlaylistId: UUID?

    var body: some View {
        NavigationStack {
            List {
                // Auto-generated playlists by domain
                Section("By Domain") {
                    ForEach(Constants.Domain.allCases) { domain in
                        let lessons = contentManager.manifest?.domains
                            .first(where: { $0.name == domain.rawValue })?
                            .lessons ?? []

                        if !lessons.isEmpty {
                            domainPlaylistRow(domain: domain, lessons: lessons)
                        }
                    }
                }

                // Weak areas playlist
                Section("Recommended") {
                    if let progress = localStore.getStudyProgress() {
                        let weakDomains = progress.domainMastery.filter { $0.value.percentage < 50 }
                        if !weakDomains.isEmpty {
                            HStack(spacing: 12) {
                                Image(systemName: "exclamationmark.triangle")
                                    .foregroundStyle(.orange)
                                    .frame(width: 32)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Weak Areas Review")
                                        .font(.subheadline.weight(.medium))
                                    Text("\(weakDomains.count) domains below 50%")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Playlists")
        }
    }

    private func domainPlaylistRow(domain: Constants.Domain, lessons: [ContentManifest.LessonEntry]) -> some View {
        let downloadedCount = lessons.filter { contentManager.isLessonDownloaded(slug: $0.slug) }.count

        return HStack(spacing: 12) {
            Image(systemName: domain.iconName)
                .foregroundStyle(.secondary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(domain.rawValue)
                    .font(.subheadline.weight(.medium))
                Text("\(lessons.count) lessons")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if downloadedCount == lessons.count {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else {
                Text("\(downloadedCount)/\(lessons.count)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    PlaylistView()
        .environment(ContentManager(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore()
        ))
        .environment(LocalStore())
        .preferredColorScheme(.dark)
}
