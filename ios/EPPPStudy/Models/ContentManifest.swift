import Foundation

struct ContentManifest: Codable, Sendable {
    let version: Int
    let generatedAt: Date
    let domains: [DomainManifest]

    struct DomainManifest: Codable, Sendable, Identifiable {
        let id: String
        let name: String
        let slug: String
        let lessons: [LessonEntry]
        let exams: [ExamEntry]
    }

    struct LessonEntry: Codable, Sendable, Identifiable {
        let id: String
        let slug: String
        let title: String
        let domain: String
        let bundleURL: String
        let bundleSize: Int64
        let contentHash: String
        let updatedAt: Date
        let hasAudio: Bool
    }

    struct ExamEntry: Codable, Sendable, Identifiable {
        let id: String
        let slug: String
        let title: String
        let domain: String
        let questionCount: Int
        let bundleURL: String
        let bundleSize: Int64
        let contentHash: String
        let updatedAt: Date
    }
}

struct ContentBundle: Codable, Sendable {
    let type: BundleType
    let id: String
    let slug: String
    let contentHash: String
    let data: Data

    enum BundleType: String, Codable, Sendable {
        case lesson
        case exam
    }
}

struct DownloadTask: Identifiable, Sendable {
    let id: String
    let title: String
    let type: ContentBundle.BundleType
    var progress: Double
    var state: DownloadState
    var totalBytes: Int64
    var downloadedBytes: Int64

    enum DownloadState: Sendable {
        case queued
        case downloading
        case completed
        case failed(String)
        case cancelled
    }
}
