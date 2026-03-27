import WidgetKit
import SwiftUI

struct QuickQuestionWidget: Widget {
    let kind = "QuickQuestionWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuickQuestionProvider()) { entry in
            QuickQuestionWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Practice Question")
        .description("Answer a quick EPPP practice question.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Timeline

struct QuickQuestionEntry: TimelineEntry {
    let date: Date
    let question: WidgetDataProvider.WidgetQuestion?
}

struct QuickQuestionProvider: TimelineProvider {
    func placeholder(in context: Context) -> QuickQuestionEntry {
        QuickQuestionEntry(date: Date(), question: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuickQuestionEntry) -> Void) {
        let data = WidgetDataProvider.readQuickQuestion()
        completion(QuickQuestionEntry(date: Date(), question: data?.question))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuickQuestionEntry>) -> Void) {
        let data = WidgetDataProvider.readQuickQuestion()
        let entry = QuickQuestionEntry(date: Date(), question: data?.question)
        // Refresh every 2 hours for SRS-driven questions (due times change)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - View

struct QuickQuestionWidgetView: View {
    let entry: QuickQuestionEntry

    var body: some View {
        if let question = entry.question {
            VStack(alignment: .leading, spacing: 8) {
                // Domain tag with review indicator
                HStack(spacing: 4) {
                    if question.domain == "Review" {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.caption2)
                            .foregroundStyle(.purple)
                    }
                    Text(question.domain)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(question.domain == "Review" ? .purple : .secondary)
                }

                // Question stem (truncated)
                Text(question.stem)
                    .font(.caption)
                    .foregroundStyle(.primary)
                    .lineLimit(3)

                Spacer(minLength: 4)

                // Answer choices as tappable buttons (iOS 17+ interactive widgets)
                VStack(spacing: 4) {
                    ForEach(question.choices) { choice in
                        Link(destination: URL(string: "epppstudy://question/\(question.id)?choice=\(choice.id)")!) {
                            HStack(spacing: 6) {
                                Text(choice.label)
                                    .font(.caption2.bold().monospacedDigit())
                                    .foregroundStyle(.secondary)
                                Text(choice.text)
                                    .font(.caption2)
                                    .foregroundStyle(.primary)
                                    .lineLimit(1)
                                Spacer()
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(Color(.systemGray5).opacity(0.5))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                        }
                    }
                }
            }
            .padding(4)
        } else {
            VStack(spacing: 8) {
                Image(systemName: "brain.head.profile")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text("Open the app to load a practice question")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}
