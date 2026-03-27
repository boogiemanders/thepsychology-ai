import Foundation
import Security
import Observation

@Observable
final class AuthService: @unchecked Sendable {
    private(set) var isAuthenticated = false
    private(set) var currentUserId: String?

    private var accessToken: String?
    private var refreshToken: String?

    init() {
        loadTokensFromKeychain()
    }

    // MARK: - Sign In

    func signIn(email: String, password: String) async throws {
        let url = URL(string: "\(Constants.supabaseURL)/auth/v1/token?grant_type=password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Constants.supabaseAnonKey, forHTTPHeaderField: "apikey")

        let body: [String: String] = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if let errorBody = try? JSONDecoder().decode(AuthErrorResponse.self, from: data) {
                throw AuthError.serverError(errorBody.errorDescription ?? errorBody.msg ?? "Sign in failed")
            }
            throw AuthError.httpError(httpResponse.statusCode)
        }

        let tokenResponse = try JSONDecoder().decode(AuthTokenResponse.self, from: data)
        saveSession(tokenResponse)
    }

    // MARK: - Sign Up

    func signUp(email: String, password: String) async throws {
        let url = URL(string: "\(Constants.supabaseURL)/auth/v1/signup")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Constants.supabaseAnonKey, forHTTPHeaderField: "apikey")

        let body: [String: String] = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }

        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            if let errorBody = try? JSONDecoder().decode(AuthErrorResponse.self, from: data) {
                throw AuthError.serverError(errorBody.errorDescription ?? errorBody.msg ?? "Sign up failed")
            }
            throw AuthError.httpError(httpResponse.statusCode)
        }

        let tokenResponse = try JSONDecoder().decode(AuthTokenResponse.self, from: data)
        saveSession(tokenResponse)
    }

    // MARK: - Token Refresh

    func refreshAccessToken() async throws {
        guard let refreshToken else {
            throw AuthError.noRefreshToken
        }

        let url = URL(string: "\(Constants.supabaseURL)/auth/v1/token?grant_type=refresh_token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Constants.supabaseAnonKey, forHTTPHeaderField: "apikey")

        let body = ["refresh_token": refreshToken]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            signOut()
            throw AuthError.tokenRefreshFailed
        }

        let tokenResponse = try JSONDecoder().decode(AuthTokenResponse.self, from: data)
        saveSession(tokenResponse)
    }

    // MARK: - Sign Out

    func signOut() {
        accessToken = nil
        refreshToken = nil
        currentUserId = nil
        isAuthenticated = false
        deleteFromKeychain(key: Constants.Keychain.accessToken)
        deleteFromKeychain(key: Constants.Keychain.refreshToken)
        deleteFromKeychain(key: Constants.Keychain.userId)
    }

    // MARK: - Token Access

    func getAccessToken() async throws -> String {
        guard let token = accessToken else {
            throw AuthError.notAuthenticated
        }
        return token
    }

    // MARK: - Session Management

    private func saveSession(_ response: AuthTokenResponse) {
        accessToken = response.accessToken
        refreshToken = response.refreshToken
        currentUserId = response.user.id
        isAuthenticated = true

        saveToKeychain(key: Constants.Keychain.accessToken, value: response.accessToken)
        saveToKeychain(key: Constants.Keychain.refreshToken, value: response.refreshToken)
        saveToKeychain(key: Constants.Keychain.userId, value: response.user.id)
    }

    private func loadTokensFromKeychain() {
        accessToken = loadFromKeychain(key: Constants.Keychain.accessToken)
        refreshToken = loadFromKeychain(key: Constants.Keychain.refreshToken)
        currentUserId = loadFromKeychain(key: Constants.Keychain.userId)
        isAuthenticated = accessToken != nil
    }

    // MARK: - Keychain

    private func saveToKeychain(key: String, value: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Constants.keychainService,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)

        var addQuery = query
        addQuery[kSecValueData as String] = data
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    private func loadFromKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Constants.keychainService,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Constants.keychainService,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Types

enum AuthError: LocalizedError {
    case invalidResponse
    case httpError(Int)
    case serverError(String)
    case noRefreshToken
    case tokenRefreshFailed
    case notAuthenticated

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Invalid server response"
        case .httpError(let code): return "Server error (\(code))"
        case .serverError(let msg): return msg
        case .noRefreshToken: return "No refresh token available"
        case .tokenRefreshFailed: return "Session expired. Please sign in again."
        case .notAuthenticated: return "Not signed in"
        }
    }
}

private struct AuthTokenResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: AuthUser

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }

    struct AuthUser: Codable {
        let id: String
        let email: String?
    }
}

private struct AuthErrorResponse: Codable {
    let error: String?
    let errorDescription: String?
    let msg: String?

    enum CodingKeys: String, CodingKey {
        case error
        case errorDescription = "error_description"
        case msg
    }
}
