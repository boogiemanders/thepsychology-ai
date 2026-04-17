import SwiftUI

/// Native port of /exam-generator. Picks Diagnostic or Practice, then Study/Test mode.
/// Practice is Pro-gated (server-enforced via Supabase subscription check).
struct ExamGeneratorView: View {
    @Environment(APIClient.self) private var apiClient
    @Environment(SubscriptionService.self) private var subscriptionService
    @Environment(LocalStore.self) private var localStore

    @State private var selectedType: ExamType?
    @State private var selectedMode: ExamSession.ExamMode?
    @State private var isGenerating = false
    @State private var errorMessage: String?
    @State private var generatedExam: Exam?
    @State private var showUpgradeAlert = false
    @State private var recentResults: [ExamResult] = []

    enum ExamType: String, Identifiable {
        case diagnostic
        case practice
        var id: String { rawValue }

        var title: String {
            switch self {
            case .diagnostic: return "Diagnostic Exam"
            case .practice:   return "Full Practice Exam"
            }
        }

        var icon: String {
            switch self {
            case .diagnostic: return "stethoscope"
            case .practice:   return "graduationcap.fill"
            }
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    header

                    examTypeCards

                    Divider()
                        .padding(.horizontal)

                    quickStudySection

                    if !recentResults.isEmpty {
                        recentResultsSection
                    }
                }
                .padding(.vertical, 16)
            }
            .navigationTitle("Practice")
            .navigationBarTitleDisplayMode(.large)
            .sheet(item: $selectedType) { type in
                modeSheet(for: type)
                    .presentationDetents([.medium])
            }
            .navigationDestination(item: $generatedExam) { exam in
                ExamSessionView(exam: exam, preselectedMode: selectedMode)
            }
            .alert("Pro required", isPresented: $showUpgradeAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("The 225-question practice exam is part of the Pro plan. Diagnostic exams are included for free.")
            }
            .task {
                await subscriptionService.refresh()
                recentResults = localStore.getAllExamResults()
            }
            .onChange(of: generatedExam) { _, newValue in
                if newValue == nil {
                    // returned from exam session — refresh results
                    recentResults = localStore.getAllExamResults()
                }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Choose your exam")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text("Diagnostic is a quick readiness check. Practice mirrors the full 225-question EPPP.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
    }

    // MARK: - Exam Type Cards

    private var examTypeCards: some View {
        VStack(spacing: 12) {
            examTypeCard(
                type: .diagnostic,
                subtitle: subscriptionService.isPro ? "71 questions · 30-45 min" : "8 questions · 10 min",
                highlights: [
                    "Covers all EPPP domains",
                    "Get priority recommendations",
                    "Identify knowledge gaps",
                ],
                locked: false
            )

            examTypeCard(
                type: .practice,
                subtitle: "225 questions · 4-5 hours",
                highlights: [
                    "Full EPPP simulation",
                    "Includes experimental items",
                    "Comprehensive knowledge check",
                ],
                locked: !subscriptionService.isPro
            )
        }
        .padding(.horizontal)
    }

    private func examTypeCard(
        type: ExamType,
        subtitle: String,
        highlights: [String],
        locked: Bool
    ) -> some View {
        Button {
            if locked {
                showUpgradeAlert = true
            } else {
                selectedType = type
            }
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .center, spacing: 12) {
                    Image(systemName: type.icon)
                        .font(.title2)
                        .foregroundStyle(locked ? Color.secondary : Color.white)
                        .frame(width: 36)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 8) {
                            Text(type.title)
                                .font(.headline)
                                .foregroundStyle(.white)
                            if locked {
                                Image(systemName: "lock.fill")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Text(subtitle)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if !locked {
                        Image(systemName: "chevron.right")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    ForEach(highlights, id: \.self) { item in
                        HStack(spacing: 6) {
                            Image(systemName: locked ? "circle" : "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundStyle(locked ? .secondary : Color.green.opacity(0.8))
                            Text(item)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.leading, 48)

                if locked {
                    Text("Pro only")
                        .font(.caption2.bold())
                        .foregroundStyle(.black)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.yellow.opacity(0.85))
                        .clipShape(Capsule())
                        .padding(.leading, 48)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.white.opacity(locked ? 0.04 : 0.08), lineWidth: 1)
            )
            .opacity(locked ? 0.6 : 1.0)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Mode Sheet

    private func modeSheet(for type: ExamType) -> some View {
        VStack(spacing: 20) {
            VStack(spacing: 6) {
                Text(type.title)
                    .font(.title3.bold())
                    .foregroundStyle(.white)
                Text("Choose how you want to take it")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 24)

            VStack(spacing: 12) {
                modeButton(
                    type: type,
                    mode: .study,
                    title: "Study Mode",
                    subtitle: "See the answer and explanation after each question",
                    icon: "book"
                )
                modeButton(
                    type: type,
                    mode: .test,
                    title: "Test Mode",
                    subtitle: "Timed — results shown at the end",
                    icon: "timer"
                )
            }
            .padding(.horizontal)

            if isGenerating {
                HStack(spacing: 10) {
                    ProgressView()
                    Text("Loading exam…")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 8)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            Spacer()
        }
        .presentationBackground(Color(.systemBackground))
    }

    private func modeButton(
        type: ExamType,
        mode: ExamSession.ExamMode,
        title: String,
        subtitle: String,
        icon: String
    ) -> some View {
        Button {
            Task { await startExam(type: type, mode: mode) }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3)
                    .frame(width: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .disabled(isGenerating)
    }

    // MARK: - Quick Study

    private var quickStudySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Quick Practice")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal)

            VStack(spacing: 10) {
                NavigationLink {
                    QuickStudyView(mode: .sprint)
                } label: {
                    quickStudyRow(
                        icon: "bolt.fill",
                        tint: .yellow,
                        title: "5-Question Sprint",
                        subtitle: "Quick check across all domains"
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    QuickStudyView(mode: .tenMinute)
                } label: {
                    quickStudyRow(
                        icon: "timer",
                        tint: .blue,
                        title: "10-Minute Mode",
                        subtitle: "As many as you can in 10"
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal)
        }
    }

    private func quickStudyRow(icon: String, tint: Color, title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(tint)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .padding(14)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Recent Results

    private var recentResultsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Recent Results")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal)

            VStack(spacing: 6) {
                ForEach(recentResults.prefix(5)) { result in
                    NavigationLink {
                        ExamResultsView(result: result)
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
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
                                .foregroundStyle(scoreColor(result.score))
                        }
                        .padding(14)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
        }
    }

    private func scoreColor(_ score: Double) -> Color {
        if score >= 0.7 { return .green }
        if score >= 0.5 { return .yellow }
        return .red
    }

    // MARK: - Generate

    private func startExam(type: ExamType, mode: ExamSession.ExamMode) async {
        isGenerating = true
        errorMessage = nil
        selectedMode = mode

        do {
            let exam = try await apiClient.generateExam(examType: type.rawValue)
            isGenerating = false
            selectedType = nil // dismiss sheet
            try? await Task.sleep(nanoseconds: 150_000_000) // let sheet settle
            generatedExam = exam
        } catch APIError.forbidden {
            isGenerating = false
            errorMessage = "Practice exams require a Pro subscription."
        } catch {
            isGenerating = false
            errorMessage = error.localizedDescription
        }
    }
}

// Exam needs Hashable for navigationDestination(item:)
extension Exam: Hashable {
    static func == (lhs: Exam, rhs: Exam) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
