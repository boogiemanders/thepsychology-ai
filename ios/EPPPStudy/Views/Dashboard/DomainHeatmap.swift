import SwiftUI

struct DomainHeatmap: View {
    let mastery: [String: StudyProgress.DomainMastery]

    private let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Domain Mastery")
                .font(.headline)
                .foregroundStyle(.white)

            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(Constants.Domain.allCases) { domain in
                    let domainMastery = mastery[domain.rawValue]
                    DomainCell(
                        domain: domain,
                        percentage: domainMastery?.percentage ?? 0,
                        questionsAttempted: domainMastery?.questionsAttempted ?? 0
                    )
                }
            }

            // Legend
            HStack(spacing: 16) {
                legendItem(color: .red, label: "< 50%")
                legendItem(color: .yellow, label: "50-70%")
                legendItem(color: .green, label: "> 70%")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color.opacity(0.7))
                .frame(width: 8, height: 8)
            Text(label)
        }
    }
}

private struct DomainCell: View {
    let domain: Constants.Domain
    let percentage: Double
    let questionsAttempted: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: domain.iconName)
                    .font(.caption)
                    .foregroundStyle(masteryColor.opacity(0.8))
                Spacer()
                Text("\(Int(percentage))%")
                    .font(.system(.caption, design: .rounded).bold().monospacedDigit())
                    .foregroundStyle(masteryColor)
            }

            Text(domain.shortName)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.white)

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemGray5))
                        .frame(height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(masteryColor)
                        .frame(width: geo.size.width * min(percentage / 100, 1.0), height: 4)
                }
            }
            .frame(height: 4)

            Text("\(questionsAttempted) questions")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(masteryColor.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var masteryColor: Color {
        if percentage >= 70 { return .green }
        if percentage >= 50 { return .yellow }
        return .red
    }
}

#Preview {
    DomainHeatmap(mastery: [
        "Biological Bases": .init(
            domain: "Biological Bases", percentage: 82,
            questionsAttempted: 45, questionsCorrect: 37,
            lessonsCompleted: 8, totalLessons: 9, lastStudiedAt: Date()
        ),
        "Cognitive-Affective Bases": .init(
            domain: "Cognitive-Affective Bases", percentage: 65,
            questionsAttempted: 30, questionsCorrect: 20,
            lessonsCompleted: 4, totalLessons: 5, lastStudiedAt: Date()
        ),
        "Treatment & Intervention": .init(
            domain: "Treatment & Intervention", percentage: 35,
            questionsAttempted: 12, questionsCorrect: 4,
            lessonsCompleted: 2, totalLessons: 4, lastStudiedAt: nil
        ),
    ])
    .padding()
    .preferredColorScheme(.dark)
}
