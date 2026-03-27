import Foundation

actor APIClient {
    private let baseURL: String
    private let authService: AuthService
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(authService: AuthService) {
        self.baseURL = Constants.apiBaseURL
        self.authService = authService

        self.decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        self.encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
    }

    // MARK: - Content

    func fetchManifest() async throws -> ContentManifest {
        try await request(.get, path: "/manifest")
    }

    func fetchBundle(id: String) async throws -> ContentBundle {
        try await request(.get, path: "/bundles/\(id)")
    }

    func fetchLesson(slug: String) async throws -> Lesson {
        try await request(.get, path: "/lessons/\(slug)")
    }

    func fetchExam(slug: String) async throws -> Exam {
        try await request(.get, path: "/exams/\(slug)")
    }

    // MARK: - Sync

    func bootstrapSync() async throws -> SyncPullResponse {
        try await request(.get, path: "/sync/bootstrap")
    }

    func pushSync(operations: [SyncOperation]) async throws -> SyncPushResponse {
        try await request(.post, path: "/sync/push", body: operations)
    }

    func pullSync(since: Date) async throws -> SyncPullResponse {
        let timestamp = ISO8601DateFormatter().string(from: since)
        return try await request(.get, path: "/sync/pull?since=\(timestamp)")
    }

    // MARK: - Entitlements

    func checkEntitlement() async throws -> UserEntitlement {
        try await request(.get, path: "/entitlement")
    }

    // MARK: - Progress

    func fetchProgress() async throws -> StudyProgress {
        try await request(.get, path: "/progress")
    }

    func submitExamResult(_ result: ExamResult) async throws {
        let _: EmptyResponse = try await request(.post, path: "/exams/results", body: result)
    }

    // MARK: - Quick Study

    func fetchQuickStudyQuestions(count: Int = 5, domain: String? = nil) async throws -> [Question] {
        var path = "/questions/quick?count=\(count)"
        if let domain { path += "&domain=\(domain)" }
        return try await request(.get, path: path)
    }

    // MARK: - HTTP

    private enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case delete = "DELETE"
    }

    private func request<T: Decodable>(
        _ method: HTTPMethod,
        path: String,
        body: (any Encodable)? = nil,
        retried: Bool = false
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL(path)
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.timeoutInterval = 30

        let token = try await authService.getAccessToken()
        urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        if let body {
            urlRequest.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            return try decoder.decode(T.self, from: data)

        case 401:
            if !retried {
                try await authService.refreshAccessToken()
                return try await request(method, path: path, body: body, retried: true)
            }
            throw APIError.unauthorized

        case 403:
            throw APIError.forbidden

        case 404:
            throw APIError.notFound

        case 429:
            throw APIError.rateLimited

        default:
            if let errorBody = try? decoder.decode(APIErrorResponse.self, from: data) {
                throw APIError.serverError(httpResponse.statusCode, errorBody.message)
            }
            throw APIError.httpError(httpResponse.statusCode)
        }
    }
}

// MARK: - Types

enum APIError: LocalizedError {
    case invalidURL(String)
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case rateLimited
    case httpError(Int)
    case serverError(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidURL(let path): return "Invalid URL: \(path)"
        case .invalidResponse: return "Invalid server response"
        case .unauthorized: return "Session expired. Please sign in again."
        case .forbidden: return "You don't have access to this content."
        case .notFound: return "Content not found."
        case .rateLimited: return "Too many requests. Please wait a moment."
        case .httpError(let code): return "Server error (\(code))"
        case .serverError(_, let msg): return msg
        }
    }
}

private struct APIErrorResponse: Codable {
    let message: String
    let code: String?
}

private struct EmptyResponse: Codable {}
