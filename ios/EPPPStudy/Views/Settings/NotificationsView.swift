import SwiftUI

struct NotificationsView: View {
    @Environment(NotificationService.self) private var notificationService

    @State private var notificationsEnabled = UserDefaults.standard.bool(forKey: Constants.UserDefaultsKeys.notificationsEnabled)
    @State private var reminderTime: Date = {
        if let saved = UserDefaults.standard.object(forKey: Constants.UserDefaultsKeys.dailyReminderTime) as? Date {
            return saved
        }
        var components = DateComponents()
        components.hour = 20
        components.minute = 0
        return Calendar.current.date(from: components) ?? Date()
    }()

    var body: some View {
        List {
            Section {
                if !notificationService.isAuthorized {
                    Button {
                        Task {
                            let granted = await notificationService.requestAuthorization()
                            if granted {
                                notificationsEnabled = true
                                saveSettings()
                            }
                        }
                    } label: {
                        HStack {
                            Label("Enable Notifications", systemImage: "bell.badge")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } else {
                    Toggle("Daily Streak Reminder", isOn: $notificationsEnabled)
                        .onChange(of: notificationsEnabled) { _, _ in
                            saveSettings()
                        }
                }
            } header: {
                Text("Reminders")
            } footer: {
                Text("Get a reminder if you haven't studied today. Keeps your streak alive.")
            }

            if notificationsEnabled && notificationService.isAuthorized {
                Section {
                    DatePicker(
                        "Reminder Time",
                        selection: $reminderTime,
                        displayedComponents: .hourAndMinute
                    )
                    .onChange(of: reminderTime) { _, _ in
                        saveSettings()
                    }
                } footer: {
                    Text("You'll only receive a reminder if you haven't studied that day.")
                }
            }

            Section {
                HStack {
                    Label("System Notifications", systemImage: "gear")
                    Spacer()
                    Text(notificationService.isAuthorized ? "Enabled" : "Disabled")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } footer: {
                if !notificationService.isAuthorized {
                    Text("Open Settings > EPPP Study > Notifications to enable.")
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func saveSettings() {
        UserDefaults.standard.set(notificationsEnabled, forKey: Constants.UserDefaultsKeys.notificationsEnabled)
        UserDefaults.standard.set(reminderTime, forKey: Constants.UserDefaultsKeys.dailyReminderTime)

        if notificationsEnabled {
            let components = Calendar.current.dateComponents([.hour, .minute], from: reminderTime)
            notificationService.scheduleStreakReminder(
                at: components.hour ?? 20,
                minute: components.minute ?? 0
            )
        } else {
            notificationService.cancelStreakReminder()
        }
    }
}

#Preview {
    NavigationStack {
        NotificationsView()
            .environment(NotificationService())
    }
    .preferredColorScheme(.dark)
}
