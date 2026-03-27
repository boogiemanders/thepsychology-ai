import Foundation

struct UserEntitlement: Codable, Sendable {
    let userId: String
    let plan: Plan
    let status: Status
    let expiresAt: Date?
    let features: Features

    enum Plan: String, Codable, Sendable {
        case free
        case basic
        case premium
        case lifetime
    }

    enum Status: String, Codable, Sendable {
        case active
        case expired
        case cancelled
        case trial
    }

    struct Features: Codable, Sendable {
        let offlineAccess: Bool
        let allDomains: Bool
        let practiceExams: Bool
        let audioLessons: Bool
        let analytics: Bool
        let maxDownloads: Int
    }

    var isActive: Bool {
        switch status {
        case .active, .trial:
            if let expiresAt {
                return expiresAt > Date()
            }
            return true
        case .expired, .cancelled:
            return false
        }
    }

    var canAccessOffline: Bool {
        isActive && features.offlineAccess
    }

    var canDownload: Bool {
        isActive && features.maxDownloads > 0
    }

    static let freeUser = UserEntitlement(
        userId: "",
        plan: .free,
        status: .active,
        expiresAt: nil,
        features: Features(
            offlineAccess: false,
            allDomains: false,
            practiceExams: false,
            audioLessons: false,
            analytics: false,
            maxDownloads: 0
        )
    )
}
