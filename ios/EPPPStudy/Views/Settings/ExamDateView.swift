import SwiftUI

struct ExamDateView: View {
    @Environment(NotificationService.self) private var notificationService

    @State private var examDate: Date = {
        if let saved = UserDefaults.standard.object(forKey: Constants.UserDefaultsKeys.examDate) as? Date {
            return saved
        }
        return Calendar.current.date(byAdding: .month, value: 3, to: Date()) ?? Date()
    }()

    @State private var hasExamDate: Bool = {
        UserDefaults.standard.object(forKey: Constants.UserDefaultsKeys.examDate) != nil
    }()

    private var daysUntilExam: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: examDate).day ?? 0
    }

    var body: some View {
        List {
            Section {
                Toggle("I have an exam date", isOn: $hasExamDate)
                    .onChange(of: hasExamDate) { _, newValue in
                        if newValue {
                            save()
                        } else {
                            clearExamDate()
                        }
                    }
            }

            if hasExamDate {
                Section {
                    DatePicker(
                        "Exam Date",
                        selection: $examDate,
                        in: Date()...,
                        displayedComponents: .date
                    )
                    .onChange(of: examDate) { _, _ in
                        save()
                    }
                } footer: {
                    Text("We'll send you milestone reminders as your exam approaches.")
                }

                Section {
                    VStack(spacing: 8) {
                        Text("\(daysUntilExam)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("days until your exam")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                }

                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        milestoneRow(days: 30, label: "30-day reminder", passed: daysUntilExam < 30)
                        milestoneRow(days: 14, label: "2-week reminder", passed: daysUntilExam < 14)
                        milestoneRow(days: 7, label: "1-week reminder", passed: daysUntilExam < 7)
                        milestoneRow(days: 3, label: "3-day reminder", passed: daysUntilExam < 3)
                        milestoneRow(days: 1, label: "Day before reminder", passed: daysUntilExam < 1)
                    }
                } header: {
                    Text("Countdown Reminders")
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Exam Date")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func milestoneRow(days: Int, label: String, passed: Bool) -> some View {
        HStack(spacing: 10) {
            Image(systemName: passed ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(passed ? .green : .secondary)
                .font(.caption)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(passed ? .secondary : .white)
            Spacer()
        }
    }

    private func save() {
        UserDefaults.standard.set(examDate, forKey: Constants.UserDefaultsKeys.examDate)
        notificationService.scheduleExamCountdown(examDate: examDate)
    }

    private func clearExamDate() {
        UserDefaults.standard.removeObject(forKey: Constants.UserDefaultsKeys.examDate)
    }
}

#Preview {
    NavigationStack {
        ExamDateView()
            .environment(NotificationService())
    }
    .preferredColorScheme(.dark)
}
