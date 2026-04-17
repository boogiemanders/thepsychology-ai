import Foundation
import Observation

/// Reads subscription tier from Supabase `users` table directly.
/// Pro = `stripe_customer_id` present OR active trial OR tier != 'free'.
@Observable
final class SubscriptionService: @unchecked Sendable {
    private let authService: AuthService

    private(set) var isPro: Bool = false
    private(set) var tier: String = "free"
    private(set) var isLoaded: Bool = false

    init(authService: AuthService) {
        self.authService = authService
    }

    func refresh() async {
        guard authService.isAuthenticated,
              let userId = authService.currentUserId else {
            isPro = false
            tier = "free"
            isLoaded = true
            return
        }

        do {
            let token = try await authService.getAccessToken()
            let row = try await fetchUserRow(userId: userId, token: token)
            let resolved = resolveTier(row: row)
            tier = resolved
            isPro = resolved == "pro"
            isLoaded = true
        } catch {
            // Fail closed: treat as free on error
            isPro = false
            tier = "free"
            isLoaded = true
        }
    }

    // MARK: - Supabase REST

    private struct UserRow: Decodable {
        let subscriptionTier: String?
        let stripeCustomerId: String?
        let trialEndsAt: String?

        enum CodingKeys: String, CodingKey {
            case subscriptionTier = "subscription_tier"
            case stripeCustomerId = "stripe_customer_id"
            case trialEndsAt = "trial_ends_at"
        }
    }

    private func fetchUserRow(userId: String, token: String) async throws -> UserRow {
        var components = URLComponents(string: "\(Constants.supabaseURL)/rest/v1/users")!
        components.queryItems = [
            URLQueryItem(name: "id", value: "eq.\(userId)"),
            URLQueryItem(name: "select", value: "subscription_tier,stripe_customer_id,trial_ends_at"),
            URLQueryItem(name: "limit", value: "1"),
        ]

        var request = URLRequest(url: components.url!)
        request.setValue(Constants.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw NSError(domain: "SubscriptionService", code: -1)
        }

        let rows = try JSONDecoder().decode([UserRow].self, from: data)
        guard let first = rows.first else {
            throw NSError(domain: "SubscriptionService", code: -2)
        }
        return first
    }

    /// Matches server `getEntitledSubscriptionTier` logic.
    private func resolveTier(row: UserRow) -> String {
        if let customerId = row.stripeCustomerId, !customerId.isEmpty {
            return "pro"
        }
        if row.subscriptionTier == "free" {
            return "free"
        }
        if let trialEnds = row.trialEndsAt,
           let endDate = parseFlexibleDate(trialEnds),
           Date() > endDate {
            return "free"
        }
        return "pro"
    }

    private func parseFlexibleDate(_ string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: string) { return d }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: string)
    }
}
