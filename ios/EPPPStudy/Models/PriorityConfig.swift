import Foundation

/// Codable model for priority-config.json — the offline priority engine configuration
/// exported from the web app's knowledge statement data.
struct PriorityConfig: Codable, Sendable {
    let domains: [String: DomainConfig]
    let domainWeights: [String: Double]
    let knData: [String: KNStatement]
    let knTopicMapping: [String: [String]]
    let topicToLessonSlug: [String: String]
    let defaultQuestionCounts: [String: Int]

    struct DomainConfig: Codable, Sendable {
        let name: String
        let weight: Double
        let knowledgeStatements: [String]
        let defaultQuestionCount: Int
    }

    struct KNStatement: Codable, Sendable {
        let domain: Int
        let name: String
        let description: String
    }

    /// Load from bundled JSON or a downloaded file URL.
    static func load(from url: URL? = nil) -> PriorityConfig? {
        let fileURL: URL
        if let url {
            fileURL = url
        } else if let bundledURL = Bundle.main.url(forResource: "priority-config", withExtension: "json") {
            fileURL = bundledURL
        } else {
            return nil
        }

        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return try? JSONDecoder().decode(PriorityConfig.self, from: data)
    }

    /// Given a set of domain numbers that are weak, return recommended lesson slugs
    /// by tracing: domain -> KN statements -> topic IDs -> lesson slugs
    func recommendedLessonSlugs(forDomains domainNumbers: [Int]) -> [String] {
        var slugs: [String] = []
        var seen = Set<String>()

        for domainNum in domainNumbers {
            let key = String(domainNum)
            guard let config = domains[key] else { continue }

            for kn in config.knowledgeStatements {
                let topicIds = knTopicMapping[kn] ?? []
                for topicId in topicIds {
                    if let slug = topicToLessonSlug[topicId], !seen.contains(slug) {
                        seen.insert(slug)
                        slugs.append(slug)
                    }
                }
            }
        }

        return slugs
    }
}
