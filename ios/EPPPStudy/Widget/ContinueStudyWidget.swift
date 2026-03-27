import WidgetKit
import SwiftUI

struct ContinueStudyWidget: Widget {
    let kind = "ContinueStudyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ContinueStudyProvider()) { entry in
            ContinueStudyWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Continue Studying")
        .description("Jump back to where you left off.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Timeline

struct ContinueStudyEntry: TimelineEntry {
    let date: Date
    let data: WidgetDataProvider.ContinueStudyData?
}

struct ContinueStudyProvider: TimelineProvider {
    func placeholder(in context: Context) -> ContinueStudyEntry {
        ContinueStudyEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (ContinueStudyEntry) -> Void) {
        let data = WidgetDataProvider.readContinueStudy()
        completion(ContinueStudyEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ContinueStudyEntry>) -> Void) {
        let data = WidgetDataProvider.readContinueStudy()
        let entry = ContinueStudyEntry(date: Date(), data: data)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - View

struct ContinueStudyWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: ContinueStudyEntry

    var body: some View {
        if let data = entry.data {
            switch family {
            case .systemSmall:
                smallView(data)
            default:
                mediumView(data)
            }
        } else {
            placeholderView
        }
    }

    private func smallView(_ data: WidgetDataProvider.ContinueStudyData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                // Streak
                HStack(spacing: 2) {
                    Image(systemName: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                    Text("\(data.streakDays)")
                        .font(.caption2.bold().monospacedDigit())
                        .foregroundStyle(.orange)
                }
            }

            Spacer()

            Text(data.title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.primary)
                .lineLimit(2)

            Text(data.subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .padding(2)
    }

    private func mediumView(_ data: WidgetDataProvider.ContinueStudyData) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 4) {
                    Image(systemName: "brain.head.profile")
                        .font(.caption)
                    Text("EPPP Study")
                        .font(.caption.weight(.medium))
                }
                .foregroundStyle(.secondary)

                Text(data.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)

                Text(data.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Spacer()

                HStack(spacing: 12) {
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(.orange)
                        Text("\(data.streakDays)")
                            .bold()
                            .foregroundStyle(.orange)
                    }
                    .font(.caption2)

                    Text("\(Int(data.readinessScore))% ready")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right.circle.fill")
                .font(.title2)
                .foregroundStyle(.secondary)
        }
        .padding(4)
    }

    private var placeholderView: some View {
        VStack(spacing: 8) {
            Image(systemName: "brain.head.profile")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text("Start studying")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
