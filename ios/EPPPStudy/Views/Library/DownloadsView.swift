import SwiftUI

struct DownloadsView: View {
    @Environment(ContentManager.self) private var contentManager

    @State private var selectedSegment = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Content Type", selection: $selectedSegment) {
                    Text("Lessons").tag(0)
                    Text("Exams").tag(1)
                    Text("Storage").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                switch selectedSegment {
                case 0:
                    lessonsList
                case 1:
                    examsList
                case 2:
                    StorageView()
                default:
                    EmptyView()
                }
            }
            .navigationTitle("Library")
        }
    }

    private var lessonsList: some View {
        let lessons = contentManager.getDownloadedLessons()

        return Group {
            if lessons.isEmpty {
                emptyState(
                    icon: "arrow.down.circle",
                    title: "No downloaded lessons",
                    subtitle: "Download lessons from the Study tab to access them offline"
                )
            } else {
                List {
                    ForEach(lessons) { lesson in
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(lesson.title)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.white)
                                Text(lesson.domain)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            try? contentManager.deleteLesson(slug: lessons[index].slug)
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
    }

    private var examsList: some View {
        let exams = contentManager.getDownloadedExams()

        return Group {
            if exams.isEmpty {
                emptyState(
                    icon: "pencil.and.list.clipboard",
                    title: "No downloaded exams",
                    subtitle: "Download exams from the Exams tab to take them offline"
                )
            } else {
                List {
                    ForEach(exams) { exam in
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(exam.title)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.white)
                                Text("\(exam.questionCount) questions")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                    }
                    .onDelete { indexSet in
                        for index in indexSet {
                            try? contentManager.deleteExam(slug: exams[index].slug)
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
    }

    private func emptyState(icon: String, title: String, subtitle: String) -> some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(.secondary)
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.white)
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
        }
    }
}

#Preview {
    DownloadsView()
        .environment(ContentManager(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore()
        ))
        .preferredColorScheme(.dark)
}
