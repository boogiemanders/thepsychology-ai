import SwiftUI

struct ExamListView: View {
    @Environment(ContentManager.self) private var contentManager
    @Environment(LocalStore.self) private var localStore

    @State private var recentResults: [ExamResult] = []

    var body: some View {
        NavigationStack {
            List {
                // Quick Study section
                Section {
                    NavigationLink(destination: QuickStudyView(mode: .sprint)) {
                        HStack(spacing: 12) {
                            Image(systemName: "bolt.fill")
                                .foregroundStyle(.yellow)
                                .frame(width: 32)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("5-Question Sprint")
                                    .font(.subheadline.weight(.medium))
                                Text("Quick practice across all domains")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }

                    NavigationLink(destination: QuickStudyView(mode: .tenMinute)) {
                        HStack(spacing: 12) {
                            Image(systemName: "timer")
                                .foregroundStyle(.blue)
                                .frame(width: 32)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("10-Minute Mode")
                                    .font(.subheadline.weight(.medium))
                                Text("Timed practice session")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                } header: {
                    Text("Quick Study")
                }

                // Downloaded exams
                let exams = contentManager.getDownloadedExams()
                if !exams.isEmpty {
                    Section {
                        ForEach(exams) { exam in
                            NavigationLink(destination: ExamSessionView(exam: exam)) {
                                ExamRow(exam: exam)
                            }
                        }
                    } header: {
                        Text("Downloaded Exams")
                    }
                }

                // Available from manifest
                if let manifest = contentManager.manifest {
                    let availableExams = manifest.domains.flatMap(\.exams)
                        .filter { !contentManager.isExamDownloaded(slug: $0.slug) }

                    if !availableExams.isEmpty {
                        Section {
                            ForEach(availableExams) { entry in
                                ExamAvailableRow(entry: entry)
                            }
                        } header: {
                            Text("Available Exams")
                        }
                    }
                }

                // Recent Results
                if !recentResults.isEmpty {
                    Section {
                        ForEach(recentResults.prefix(5)) { result in
                            NavigationLink(destination: ExamResultsView(result: result)) {
                                ResultRow(result: result)
                            }
                        }
                    } header: {
                        Text("Recent Results")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Exams")
            .onAppear {
                recentResults = localStore.getAllExamResults()
            }
        }
    }
}

private struct ExamRow: View {
    let exam: Exam

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(exam.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                HStack(spacing: 8) {
                    Text("\(exam.questionCount) questions")
                    if let time = exam.timeLimitMinutes {
                        Text("\(time) min")
                    }
                    Text(exam.domain)
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "arrow.down.circle.fill")
                .foregroundStyle(.green.opacity(0.7))
        }
        .padding(.vertical, 4)
    }
}

private struct ExamAvailableRow: View {
    let entry: ContentManifest.ExamEntry
    @Environment(ContentManager.self) private var contentManager
    @State private var isDownloading = false

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                HStack(spacing: 8) {
                    Text("\(entry.questionCount) questions")
                    Text(entry.domain)
                    Text(ByteCountFormatter.string(fromByteCount: entry.bundleSize, countStyle: .file))
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            Button {
                isDownloading = true
                Task {
                    try? await contentManager.downloadExam(slug: entry.slug, title: entry.title)
                    isDownloading = false
                }
            } label: {
                if isDownloading {
                    ProgressView()
                } else {
                    Image(systemName: "arrow.down.to.line")
                        .foregroundStyle(.white)
                }
            }
            .disabled(isDownloading)
        }
        .padding(.vertical, 4)
    }
}

private struct ResultRow: View {
    let result: ExamResult

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(result.correctCount)/\(result.totalQuestions)")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                Text(result.completedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(Int(result.score * 100))%")
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(result.score >= 0.7 ? .green : result.score >= 0.5 ? .yellow : .red)
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    ExamListView()
        .environment(ContentManager(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore()
        ))
        .environment(LocalStore())
        .preferredColorScheme(.dark)
}
