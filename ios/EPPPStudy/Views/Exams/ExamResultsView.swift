import SwiftUI

struct ExamResultsView: View {
    let result: ExamResult

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Score
                VStack(spacing: 8) {
                    Text("\(Int(result.score * 100))%")
                        .font(.system(size: 64, weight: .bold, design: .rounded))
                        .foregroundStyle(scoreColor)

                    Text("\(result.correctCount) of \(result.totalQuestions) correct")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Text(scoreLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 16)

                // Stats row
                HStack(spacing: 0) {
                    statItem(label: "Time", value: formatTime(result.totalTimeSeconds))
                    Divider().frame(height: 32)
                    statItem(label: "Mode", value: result.mode == .study ? "Study" : "Test")
                    Divider().frame(height: 32)
                    statItem(label: "Avg/Q", value: "\(result.totalTimeSeconds / max(result.totalQuestions, 1))s")
                }
                .padding()
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // Domain Breakdown
                if !result.domainScores.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Domain Breakdown")
                            .font(.headline)
                            .foregroundStyle(.white)

                        ForEach(result.domainScores.sorted(by: { $0.percentage < $1.percentage })) { score in
                            domainRow(score)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Weak Areas
                if !result.weakAreas.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundStyle(.orange)
                            Text("Focus Areas")
                                .font(.headline)
                                .foregroundStyle(.white)
                        }

                        ForEach(result.weakAreas, id: \.self) { area in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(Color.red.opacity(0.7))
                                    .frame(width: 6, height: 6)
                                Text(area)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Recommended Lessons
                if !result.recommendedLessons.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.down.circle")
                                .foregroundStyle(.blue)
                            Text("Recommended Study")
                                .font(.headline)
                                .foregroundStyle(.white)
                        }

                        Text("Lessons for your weak areas are being downloaded for offline study.")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        ForEach(result.recommendedLessons.prefix(5), id: \.self) { slug in
                            HStack(spacing: 8) {
                                Image(systemName: "book.closed")
                                    .font(.caption)
                                    .foregroundStyle(.blue.opacity(0.7))
                                Text(slug.replacingOccurrences(of: "-", with: " ").capitalized)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding()
        }
        .navigationTitle("Results")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func statItem(label: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline.bold().monospacedDigit())
                .foregroundStyle(.white)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func domainRow(_ score: ExamResult.DomainScore) -> some View {
        VStack(spacing: 6) {
            HStack {
                Text(score.domain)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer()
                Text("\(score.correct)/\(score.total)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                Text("\(Int(score.percentage * 100))%")
                    .font(.caption.bold().monospacedDigit())
                    .foregroundStyle(domainColor(score.percentage))
                    .frame(width: 36, alignment: .trailing)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemGray5))
                        .frame(height: 4)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(domainColor(score.percentage))
                        .frame(width: geo.size.width * min(score.percentage, 1.0), height: 4)
                }
            }
            .frame(height: 4)
        }
    }

    private var scoreColor: Color {
        if result.score >= 0.7 { return .green }
        if result.score >= 0.5 { return .yellow }
        return .red
    }

    private var scoreLabel: String {
        if result.score >= 0.8 { return "Excellent performance" }
        if result.score >= 0.7 { return "Above passing threshold" }
        if result.score >= 0.5 { return "Below passing - review weak areas" }
        return "Significant review needed"
    }

    private func domainColor(_ percentage: Double) -> Color {
        if percentage >= 0.7 { return .green }
        if percentage >= 0.5 { return .yellow }
        return .red
    }

    private func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}

#Preview {
    NavigationStack {
        ExamResultsView(result: ExamResult(
            id: "1",
            examId: "exam-1",
            sessionId: "session-1",
            userId: "user-1",
            mode: .test,
            score: 0.72,
            correctCount: 36,
            totalQuestions: 50,
            totalTimeSeconds: 2400,
            domainScores: [
                .init(domain: "Biological Bases", correct: 8, total: 10),
                .init(domain: "Cognitive-Affective", correct: 5, total: 8),
                .init(domain: "Treatment", correct: 3, total: 7),
                .init(domain: "Research Methods", correct: 6, total: 8),
                .init(domain: "Ethics", correct: 4, total: 5),
            ],
            completedAt: Date(),
            weakAreas: ["Treatment", "Cognitive-Affective"],
            recommendedLessons: []
        ))
    }
    .preferredColorScheme(.dark)
}
