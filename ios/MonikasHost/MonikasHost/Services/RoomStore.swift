import Foundation
import Observation

/// Holds the current room + roster and keeps them fresh.
/// MVP uses polling — swap for Supabase Realtime in Milestone 2.
@Observable
@MainActor
final class RoomStore {
    private(set) var room: Room?
    private(set) var players: [Player] = []
    private(set) var cardCounts: [String: Int] = [:]
    private(set) var playerToken: String?
    private(set) var selfPlayerId: String?
    private(set) var errorMessage: String?

    private let api: APIClient
    private var pollTask: Task<Void, Never>?

    init(api: APIClient) {
        self.api = api
    }

    func createRoom(hostName: String) async {
        do {
            let resp = try await api.createRoom(hostName: hostName)
            self.room = resp.room
            self.players = [resp.player]
            self.playerToken = resp.playerToken
            self.selfPlayerId = resp.player.id
            self.errorMessage = nil
            startPolling(code: resp.room.roomCode)
        } catch {
            self.errorMessage = error.localizedDescription
        }
    }

    func submitCards(_ cards: [(text: String, note: String?)]) async -> Bool {
        guard let code = room?.roomCode, let token = playerToken else { return false }
        do {
            _ = try await api.submitCards(code: code, playerToken: token, cards: cards)
            self.errorMessage = nil
            return true
        } catch {
            self.errorMessage = error.localizedDescription
            return false
        }
    }

    func startGame() async {
        guard let code = room?.roomCode, let token = playerToken else { return }
        do {
            let updated = try await api.startRoom(code: code, playerToken: token)
            self.room = updated
            self.errorMessage = nil
        } catch {
            self.errorMessage = error.localizedDescription
        }
    }

    func leave() {
        pollTask?.cancel()
        pollTask = nil
        room = nil
        players = []
        playerToken = nil
        selfPlayerId = nil
    }

    private func startPolling(code: String) {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.refresh(code: code)
                try? await Task.sleep(for: .seconds(Constants.lobbyPollInterval))
            }
        }
    }

    private func refresh(code: String) async {
        do {
            let resp = try await api.getRoom(code: code)
            self.room = resp.room
            self.players = resp.players
            self.cardCounts = resp.cardCounts ?? [:]
        } catch {
            // Soft-fail: keep last known state. Future: surface banner on repeated failure.
        }
    }
}
