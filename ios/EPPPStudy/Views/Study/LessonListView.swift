import SwiftUI

struct LessonListView: View {
    @Environment(ContentManager.self) private var contentManager
    @Environment(LocalStore.self) private var localStore

    @State private var selectedDomain: Constants.Domain?
    @State private var searchText = ""

    private var lessons: [Lesson] {
        var all = contentManager.getDownloadedLessons()
        if let domain = selectedDomain {
            all = all.filter { $0.domain == domain.rawValue }
        }
        if !searchText.isEmpty {
            all = all.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
        }
        return all
    }

    private var manifestLessons: [ContentManifest.LessonEntry] {
        guard let manifest = contentManager.manifest else { return [] }
        var entries = manifest.domains.flatMap(\.lessons)
        if let domain = selectedDomain {
            entries = entries.filter { $0.domain == domain.rawValue }
        }
        if !searchText.isEmpty {
            entries = entries.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
        }
        return entries
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Domain filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: "All", isSelected: selectedDomain == nil) {
                            selectedDomain = nil
                        }
                        ForEach(Constants.Domain.allCases) { domain in
                            FilterChip(title: domain.shortName, isSelected: selectedDomain == domain) {
                                selectedDomain = domain
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                List {
                    if !lessons.isEmpty {
                        Section("Downloaded") {
                            ForEach(lessons) { lesson in
                                NavigationLink(destination: LessonDetailView(lesson: lesson)) {
                                    LessonRow(
                                        title: lesson.title,
                                        domain: lesson.domain,
                                        duration: "\(lesson.estimatedReadingMinutes) min",
                                        isDownloaded: true,
                                        progress: localStore.getLessonProgress(id: lesson.id)
                                    )
                                }
                            }
                        }
                    }

                    if !manifestLessons.isEmpty {
                        Section("Available") {
                            ForEach(manifestLessons) { entry in
                                if !contentManager.isLessonDownloaded(slug: entry.slug) {
                                    LessonAvailableRow(entry: entry)
                                }
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
            .navigationTitle("Study")
            .searchable(text: $searchText, prompt: "Search lessons")
            .refreshable {
                try? await contentManager.refreshManifest()
            }
        }
    }
}

// MARK: - Subviews

private struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.white : Color(.systemGray6))
                .foregroundStyle(isSelected ? .black : .secondary)
                .clipShape(Capsule())
        }
    }
}

private struct LessonRow: View {
    let title: String
    let domain: String
    let duration: String
    let isDownloaded: Bool
    let progress: LessonProgress?

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                HStack(spacing: 8) {
                    Text(domain)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(duration)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if let progress, progress.completed {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else if isDownloaded {
                Image(systemName: "arrow.down.circle.fill")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

private struct LessonAvailableRow: View {
    let entry: ContentManifest.LessonEntry
    @Environment(ContentManager.self) private var contentManager
    @State private var isDownloading = false

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                HStack(spacing: 8) {
                    Text(entry.domain)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(ByteCountFormatter.string(fromByteCount: entry.bundleSize, countStyle: .file))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Button {
                download()
            } label: {
                if isDownloading {
                    ProgressView()
                        .frame(width: 24, height: 24)
                } else {
                    Image(systemName: "arrow.down.to.line")
                        .foregroundStyle(.white)
                }
            }
            .disabled(isDownloading)
        }
        .padding(.vertical, 4)
    }

    private func download() {
        isDownloading = true
        Task {
            try? await contentManager.downloadLesson(slug: entry.slug, title: entry.title)
            isDownloading = false
        }
    }
}

#Preview {
    LessonListView()
        .environment(ContentManager(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore()
        ))
        .environment(LocalStore())
        .preferredColorScheme(.dark)
}
