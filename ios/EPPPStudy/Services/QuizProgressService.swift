import Foundation
import Observation

/// Fetches quiz progress from Supabase `quiz_results` table and caches
/// a per-topic best-percentage map. Used by StudyView to show real progress.
@Observable
final class QuizProgressService: @unchecked Sendable {
    private let authService: AuthService

    /// topicName -> best percentage (0-100)
    private(set) var progressMap: [String: Int] = [:]
    private(set) var isLoading = false

    init(authService: AuthService) {
        self.authService = authService
    }

    /// Fetch quiz_results from Supabase REST API, roll up to best % per topic.
    func refresh() async {
        guard authService.isAuthenticated,
              let userId = authService.currentUserId else {
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let token = try await authService.getAccessToken()
            let rows = try await fetchQuizResults(userId: userId, token: token)

            var map: [String: Int] = [:]
            for row in rows {
                let current = map[row.topicName] ?? 0
                map[row.topicName] = max(current, row.percentage)
            }

            progressMap = map
        } catch {
            // Silent fail — progress just stays at whatever it was (or 0)
        }
    }

    /// Best percentage for a given topic name, or 0 if none.
    func progress(for topicName: String) -> Int {
        progressMap[topicName] ?? 0
    }

    // MARK: - Supabase REST

    private struct QuizResultRow: Decodable {
        let topicName: String
        let percentage: Int

        enum CodingKeys: String, CodingKey {
            case topicName = "topic_name"
            case percentage
        }
    }

    private func fetchQuizResults(userId: String, token: String) async throws -> [QuizResultRow] {
        var components = URLComponents(string: "\(Constants.supabaseURL)/rest/v1/quiz_results")!
        components.queryItems = [
            URLQueryItem(name: "user_id", value: "eq.\(userId)"),
            URLQueryItem(name: "select", value: "topic_name,percentage"),
        ]

        var request = URLRequest(url: components.url!)
        request.setValue(Constants.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            return []
        }

        return try JSONDecoder().decode([QuizResultRow].self, from: data)
    }
}
