import SwiftUI

struct DashboardView: View {
    @Environment(LocalStore.self) private var localStore
    @Environment(SyncEngine.self) private var syncEngine

    @State private var progress: StudyProgress?
    @State private var streak: StudyStreak?
    @State private var nextAction: NextAction?
    @State private var dueReviewCount: Int = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Readiness Score
                    readinessCard

                    // Streak
                    StreakCard(streak: streak ?? StudyStreak(
                        currentStreak: 0, longestStreak: 0, lastStudyDate: nil, studyDates: []
                    ))

                    // Next Action
                    if let nextAction {
                        NextActionCard(action: nextAction)
                    }

                    // Domain Heatmap
                    if let progress {
                        DomainHeatmap(mastery: progress.domainMastery)
                    }

                    // Exam Countdown
                    if let daysUntil = progress?.daysUntilExam {
                        examCountdownCard(days: daysUntil)
                    }

                    // SRS Review Banner
                    if dueReviewCount > 0 {
                        reviewBanner
                    }

                    // Quick Stats
                    quickStatsRow
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await refresh()
            }
            .task {
                loadData()
            }
        }
    }

    // MARK: - Readiness Card

    private var readinessCard: some View {
        VStack(spacing: 12) {
            Text("Exam Readiness")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("\(Int(progress?.readinessScore ?? 0))%")
                .font(.system(size: 56, weight: .bold, design: .rounded))
                .foregroundStyle(readinessColor)

            Text(readinessLabel)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var readinessColor: Color {
        let score = progress?.readinessScore ?? 0
        if score >= 70 { return .green }
        if score >= 50 { return .yellow }
        return .red
    }

    private var readinessLabel: String {
        let score = progress?.readinessScore ?? 0
        if score >= 80 { return "You're well prepared" }
        if score >= 70 { return "Almost there" }
        if score >= 50 { return "Making progress" }
        if score >= 25 { return "Keep studying" }
        return "Just getting started"
    }

    // MARK: - Exam Countdown

    private func examCountdownCard(days: Int) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Exam in")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("\(days) days")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
            }
            Spacer()
            Image(systemName: "calendar")
                .font(.title2)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Quick Stats

    private var quickStatsRow: some View {
        HStack(spacing: 12) {
            statCard(
                label: "Lessons",
                value: "\(progress?.lessonsCompleted ?? 0)",
                icon: "book.closed"
            )
            statCard(
                label: "Exams",
                value: "\(progress?.examsCompleted ?? 0)",
                icon: "checkmark.circle"
            )
            statCard(
                label: "Hours",
                value: "\((progress?.totalStudyTimeSeconds ?? 0) / 3600)",
                icon: "clock"
            )
        }
    }

    private func statCard(label: String, value: String, icon: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold().monospacedDigit())
                .foregroundStyle(.white)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Review Banner

    private var reviewBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "arrow.counterclockwise.circle.fill")
                .font(.title3)
                .foregroundStyle(.purple)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(dueReviewCount) questions due for review")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                Text("Spaced repetition keeps knowledge fresh")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.purple.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Data

    private func loadData() {
        progress = localStore.getStudyProgress()
        streak = localStore.getStreak()
        dueReviewCount = ReviewScheduler.getDueCount(localStore: localStore)
        nextAction = computeNextAction()
    }

    private func refresh() async {
        await syncEngine.sync()
        loadData()
    }

    private func computeNextAction() -> NextAction? {
        // 1. Priority: SRS review questions due
        if dueReviewCount > 0 {
            return NextAction(
                type: .reviewWeakArea,
                title: "Review \(dueReviewCount) due questions",
                subtitle: "Spaced repetition — don't let knowledge fade",
                destination: .quickStudy
            )
        }

        // 2. Use priority engine for weighted weak-area detection
        if let progress, let weakest = PriorityEngine.getWeakestDomain(from: progress) {
            if weakest.percentage < 50 {
                return NextAction(
                    type: .reviewWeakArea,
                    title: "Review \(weakest.domain)",
                    subtitle: "Priority area at \(Int(weakest.percentage))%",
                    destination: .domain(weakest.domain)
                )
            }
        }

        // 3. Fallback: general quick study
        return NextAction(
            type: .quickStudy,
            title: "Quick Study",
            subtitle: "5 practice questions across all domains",
            destination: .quickStudy
        )
    }
}

#Preview {
    DashboardView()
        .environment(LocalStore())
        .environment(SyncEngine(
            apiClient: APIClient(authService: AuthService()),
            localStore: LocalStore(),
            networkMonitor: NetworkMonitor()
        ))
        .preferredColorScheme(.dark)
}
