import SwiftUI

struct LessonDetailView: View {
    let lesson: Lesson

    @Environment(LocalStore.self) private var localStore
    @Environment(SyncEngine.self) private var syncEngine

    @State private var progress: LessonProgress?
    @State private var startTime = Date()
    @State private var showAudioPlayer = false

    var body: some View {
        VStack(spacing: 0) {
            // Audio bar
            if lesson.audioURL != nil {
                audioBar
            }

            // Content
            MarkdownRenderer(markdown: lesson.content)
                .padding(.top, 8)
        }
        .navigationTitle(lesson.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    markComplete()
                } label: {
                    Image(systemName: progress?.completed == true ? "checkmark.circle.fill" : "checkmark.circle")
                        .foregroundStyle(progress?.completed == true ? .green : .secondary)
                }
            }
        }
        .onAppear {
            startTime = Date()
            progress = localStore.getLessonProgress(id: lesson.id)
            if progress == nil {
                progress = LessonProgress(lessonId: lesson.id, userId: "")
            }
        }
        .onDisappear {
            saveProgress()
        }
        .sheet(isPresented: $showAudioPlayer) {
            if let audioURL = lesson.audioURL {
                AudioPlayerView(
                    title: lesson.title,
                    audioURL: audioURL,
                    startPosition: progress?.audioPosition ?? 0
                ) { position in
                    progress?.audioPosition = position
                }
            }
        }
    }

    private var audioBar: some View {
        Button {
            showAudioPlayer = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "headphones")
                    .font(.subheadline)
                Text("Listen to audio")
                    .font(.subheadline)
                Spacer()
                if let duration = lesson.audioDurationSeconds {
                    Text("\(duration / 60) min")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
        }
    }

    // MARK: - Key Terms

    @ViewBuilder
    private var keyTermsSection: some View {
        if let keyTerms = lesson.keyTerms, !keyTerms.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("Key Terms")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding(.horizontal)

                ForEach(keyTerms) { term in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(term.term)
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                        Text(term.definition)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        }
    }

    // MARK: - Progress

    private func saveProgress() {
        guard var progress else { return }
        let elapsed = Int(Date().timeIntervalSince(startTime))
        progress.timeSpentSeconds += elapsed
        progress.updatedAt = Date()
        localStore.saveLessonProgress(progress)
        syncEngine.enqueueLessonProgress(progress)
    }

    private func markComplete() {
        guard var progress else { return }
        progress.completed.toggle()
        progress.completedAt = progress.completed ? Date() : nil
        progress.updatedAt = Date()
        self.progress = progress
        localStore.saveLessonProgress(progress)
        syncEngine.enqueueLessonProgress(progress)
    }
}

#Preview {
    NavigationStack {
        LessonDetailView(lesson: Lesson(
            id: "1",
            slug: "brain-regions",
            title: "Brain Regions & Functions",
            domain: "Biological Bases",
            content: """
            # Brain Regions & Functions

            ## The Cerebral Cortex

            The cerebral cortex is the outermost layer of the brain, responsible for higher-order functions.

            ### Frontal Lobe
            - **Motor cortex**: Controls voluntary movement
            - **Prefrontal cortex**: Executive functions, planning, decision-making
            - **Broca's area**: Speech production

            ### Temporal Lobe
            - **Auditory cortex**: Processes sound
            - **Wernicke's area**: Language comprehension
            - **Hippocampus**: Memory formation

            > The frontal lobe is the largest lobe, comprising about one-third of the cortical surface.

            ---

            This topic represents approximately 12% of the EPPP exam.
            """,
            summary: "Overview of major brain regions and their functions",
            keyTerms: [
                .init(term: "Cerebral Cortex", definition: "Outermost layer of the brain"),
                .init(term: "Broca's Area", definition: "Region responsible for speech production"),
            ],
            audioURL: nil,
            audioDurationSeconds: nil,
            estimatedReadingMinutes: 15,
            order: 1,
            updatedAt: Date()
        ))
        .environment(LocalStore())
        .environment(SyncEngine(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore(),
            networkMonitor: NetworkMonitor()
        ))
        .preferredColorScheme(.dark)
    }
}
