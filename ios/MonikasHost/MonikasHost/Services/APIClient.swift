import Foundation
import Observation

enum APIError: LocalizedError {
    case invalidURL
    case http(Int, String?)
    case decode(Error)
    case transport(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .http(let code, let msg): return msg ?? "Server error (\(code))"
        case .decode(let err): return "Decode failed: \(err.localizedDescription)"
        case .transport(let err): return err.localizedDescription
        }
    }
}

@Observable
final class APIClient: @unchecked Sendable {
    private let baseURL: String
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: String = Constants.apiBaseURL) {
        self.baseURL = baseURL
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    // MARK: - Rooms

    func createRoom(hostName: String, timerSeconds: Int = 60) async throws -> CreateRoomResponse {
        let body = CreateRoomRequest(hostName: hostName, timerSeconds: timerSeconds)
        return try await request(.post, path: "/rooms", body: body)
    }

    func getRoom(code: String) async throws -> GetRoomResponse {
        try await request(.get, path: "/rooms/\(code)")
    }

    private struct EmptyBody: Encodable {}
    private struct StartResp: Decodable { let room: Room }

    struct SubmitCardsRequest: Encodable {
        struct Card: Encodable { let text: String; let secretNote: String? }
        let cards: [Card]
    }
    private struct SubmitCardsResp: Decodable { let count: Int }

    @discardableResult
    func submitCards(code: String, playerToken: String, cards: [(text: String, note: String?)]) async throws -> Int {
        let body = SubmitCardsRequest(cards: cards.map { .init(text: $0.text, secretNote: $0.note) })
        let resp: SubmitCardsResp = try await request(
            .post,
            path: "/rooms/\(code)/cards",
            body: body,
            playerToken: playerToken
        )
        return resp.count
    }

    func startRoom(code: String, playerToken: String) async throws -> Room {
        let resp: StartResp = try await request(
            .post,
            path: "/rooms/\(code)/start",
            body: EmptyBody(),
            playerToken: playerToken
        )
        return resp.room
    }

    // MARK: - HTTP

    private enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
    }

    private func request<T: Decodable>(
        _ method: HTTPMethod,
        path: String,
        body: (any Encodable)? = nil,
        playerToken: String? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw APIError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 15
        if let playerToken { req.setValue("Bearer \(playerToken)", forHTTPHeaderField: "Authorization") }
        if let body { req.httpBody = try encoder.encode(body) }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.http(-1, "Invalid response")
        }

        guard (200..<300).contains(http.statusCode) else {
            let msg = try? JSONDecoder().decode([String: String].self, from: data)["error"]
            throw APIError.http(http.statusCode, msg)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decode(error)
        }
    }
}
