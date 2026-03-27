import WidgetKit
import SwiftUI

struct CountdownWidget: Widget {
    let kind = "CountdownWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CountdownProvider()) { entry in
            CountdownWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Exam Countdown")
        .description("Days until your EPPP exam.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Timeline

struct CountdownEntry: TimelineEntry {
    let date: Date
    let data: WidgetDataProvider.CountdownData?
}

struct CountdownProvider: TimelineProvider {
    func placeholder(in context: Context) -> CountdownEntry {
        CountdownEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (CountdownEntry) -> Void) {
        let data = WidgetDataProvider.readCountdown()
        completion(CountdownEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CountdownEntry>) -> Void) {
        let data = WidgetDataProvider.readCountdown()
        let entry = CountdownEntry(date: Date(), data: data)
        // Refresh at midnight
        let tomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date())
        let timeline = Timeline(entries: [entry], policy: .after(tomorrow))
        completion(timeline)
    }
}

// MARK: - View

struct CountdownWidgetView: View {
    let entry: CountdownEntry

    var body: some View {
        if let data = entry.data, let days = data.daysRemaining, data.examDate != nil {
            VStack(spacing: 6) {
                Text("EPPP Exam")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.secondary)

                Text("\(days)")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(daysColor(days))

                Text(days == 1 ? "day left" : "days left")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                Spacer(minLength: 4)

                // Readiness bar
                VStack(spacing: 2) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(.systemGray5))
                                .frame(height: 4)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(readinessColor(data.readinessScore))
                                .frame(width: geo.size.width * min(data.readinessScore / 100, 1.0), height: 4)
                        }
                    }
                    .frame(height: 4)

                    Text("\(Int(data.readinessScore))% ready")
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(4)
        } else {
            VStack(spacing: 8) {
                Image(systemName: "calendar")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text("Set your exam date")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private func daysColor(_ days: Int) -> Color {
        if days <= 7 { return .red }
        if days <= 30 { return .orange }
        return .white
    }

    private func readinessColor(_ score: Double) -> Color {
        if score >= 70 { return .green }
        if score >= 50 { return .yellow }
        return .red
    }
}
