import Foundation
import UserNotifications
import Observation

@Observable
final class NotificationService: @unchecked Sendable {
    private(set) var isAuthorized = false
    private let center = UNUserNotificationCenter.current()

    init() {
        Task { await checkAuthorization() }
    }

    // MARK: - Authorization

    func requestAuthorization() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            await MainActor.run { isAuthorized = granted }
            return granted
        } catch {
            return false
        }
    }

    private func checkAuthorization() async {
        let settings = await center.notificationSettings()
        await MainActor.run {
            isAuthorized = settings.authorizationStatus == .authorized
        }
    }

    // MARK: - Streak Reminders

    func scheduleStreakReminder(at hour: Int = 20, minute: Int = 0) {
        let content = UNMutableNotificationContent()
        content.title = "Keep your streak alive"
        content.body = "You haven't studied today. A quick 5-minute session will maintain your streak."
        content.sound = .default
        content.categoryIdentifier = "STREAK_REMINDER"

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "streak-reminder", content: content, trigger: trigger)

        center.add(request)
    }

    func cancelStreakReminder() {
        center.removePendingNotificationRequests(withIdentifiers: ["streak-reminder"])
    }

    // MARK: - Exam Countdown

    func scheduleExamCountdown(examDate: Date) {
        center.removePendingNotificationRequests(withIdentifiers: [
            "exam-countdown-30", "exam-countdown-14", "exam-countdown-7",
            "exam-countdown-3", "exam-countdown-1",
        ])

        let milestones: [(days: Int, message: String)] = [
            (30, "30 days until your EPPP exam. Stay consistent with your study plan."),
            (14, "2 weeks until your EPPP exam. Focus on your weakest domains."),
            (7, "1 week until your EPPP exam. Review key concepts and take practice exams."),
            (3, "3 days until your EPPP exam. Light review only - trust your preparation."),
            (1, "Your EPPP exam is tomorrow. Rest well tonight. You've prepared for this."),
        ]

        let calendar = Calendar.current

        for milestone in milestones {
            guard let notifyDate = calendar.date(byAdding: .day, value: -milestone.days, to: examDate),
                  notifyDate > Date() else { continue }

            let content = UNMutableNotificationContent()
            content.title = "EPPP Exam Countdown"
            content.body = milestone.message
            content.sound = .default

            var components = calendar.dateComponents([.year, .month, .day], from: notifyDate)
            components.hour = 9
            components.minute = 0

            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: "exam-countdown-\(milestone.days)",
                content: content,
                trigger: trigger
            )
            center.add(request)
        }
    }

    // MARK: - Study Complete

    func sendStudyCompleteNotification(lessonTitle: String) {
        let content = UNMutableNotificationContent()
        content.title = "Lesson complete"
        content.body = "You finished \"\(lessonTitle)\". Ready for a practice question?"
        content.sound = .default
        content.categoryIdentifier = "STUDY_COMPLETE"

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)

        center.add(request)
    }

    // MARK: - Clear

    func clearAllNotifications() {
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }
}
