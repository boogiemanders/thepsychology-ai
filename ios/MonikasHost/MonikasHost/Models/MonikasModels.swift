import Foundation

// MARK: - Enums

enum RoomStatus: String, Codable {
    case lobby
    case inProgress = "in_progress"
    case paused
    case completed
}

enum JoinType: String, Codable {
    case hostDevice = "host_device"
    case webPlayer = "web_player"
}

enum AvatarType: String, Codable {
    case preset
    case drawing
    case presetPlusDrawing = "preset_plus_drawing"
}

enum CardLifecycle: String, Codable {
    case unplayed
    case guessed
    case skipped
    case removed
}

// MARK: - Models — mirror src/lib/monikas/types.ts

struct Room: Codable, Identifiable, Hashable {
    let id: String
    let roomCode: String
    let status: RoomStatus
    let hostPlayerId: String?
    let timerSeconds: Int
    let currentRound: Int
    let currentTeam: Int
    let currentTurnIndex: Int
    let activeActorPlayerId: String?
    let publicDisplayConnected: Bool
    let characterModeEnabled: Bool
    let callbackModeEnabled: Bool
    let suddenDeathEnabled: Bool
    let createdAt: String
    let updatedAt: String
}

struct Player: Codable, Identifiable, Hashable {
    let id: String
    let roomId: String
    let displayName: String
    let joinType: JoinType
    let team: Int
    let turnOrder: Int
    let isConnected: Bool
    let lastSeenAt: String
    let avatarType: AvatarType?
    let presetAvatarId: String?
    let avatarImageUrl: String?
    let legendVotesRemaining: Int
    let createdAt: String
}

// MARK: - API shapes

struct CreateRoomRequest: Codable {
    let hostName: String
    let timerSeconds: Int?
}

struct CreateRoomResponse: Codable {
    let room: Room
    let player: Player
    let playerToken: String
    let roomCode: String
}

struct GetRoomResponse: Codable {
    let room: Room
    let players: [Player]
    let cardCounts: [String: Int]?
}
