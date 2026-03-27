import SwiftUI

struct StreakCard: View {
    let streak: StudyStreak

    var body: some View {
        HStack(spacing: 16) {
            // Streak count
            VStack(spacing: 4) {
                Text("\(streak.currentStreak)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundStyle(streak.currentStreak > 0 ? .orange : .secondary)
                Text("day streak")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 80)

            Divider()
                .frame(height: 40)

            // Activity dots for last 7 days
            VStack(alignment: .leading, spacing: 6) {
                Text("Last 7 days")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(spacing: 6) {
                    ForEach(0..<7, id: \.self) { daysAgo in
                        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
                        let studied = streak.studyDates.contains { Calendar.current.isDate($0, inSameDayAs: date) }

                        Circle()
                            .fill(studied ? Color.orange : Color(.systemGray5))
                            .frame(width: 12, height: 12)
                    }
                }

                if streak.longestStreak > 0 {
                    Text("Best: \(streak.longestStreak) days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    StreakCard(streak: StudyStreak(
        currentStreak: 12,
        longestStreak: 23,
        lastStudyDate: Date(),
        studyDates: [
            Date(),
            Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
            Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
            Calendar.current.date(byAdding: .day, value: -4, to: Date())!,
            Calendar.current.date(byAdding: .day, value: -5, to: Date())!,
        ]
    ))
    .padding()
    .preferredColorScheme(.dark)
}
