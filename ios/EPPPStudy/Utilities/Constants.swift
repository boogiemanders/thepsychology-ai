import Foundation

enum Constants {
    #if DEBUG
    static let apiBaseURL = "http://localhost:3000/api/mobile"
    #else
    static let apiBaseURL = "https://thepsychology.ai/api/mobile"
    #endif

    static let appGroupID = "group.ai.thepsychology.eppp"
    static let keychainService = "ai.thepsychology.eppp"
    static let bundleID = "ai.thepsychology.eppp"

    static let supabaseURL = "https://hwkuxietvwvbgdowxzkw.supabase.co"
    // Public anon key — same value the website ships to every browser. RLS is the security boundary.
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3a3V4aWV0dnd2Ymdkb3d4emt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTM1NTMsImV4cCI6MjA3ODQ2OTU1M30.ElDXc-JBYORsA4MGZ53y0NZfgGh9tpa81Yax9fENT6U"

    enum Keychain {
        static let accessToken = "access_token"
        static let refreshToken = "refresh_token"
        static let userId = "user_id"
    }

    enum UserDefaultsKeys {
        static let lastSyncTimestamp = "last_sync_timestamp"
        static let examDate = "exam_date"
        static let streakCount = "streak_count"
        static let lastStudyDate = "last_study_date"
        static let notificationsEnabled = "notifications_enabled"
        static let dailyReminderTime = "daily_reminder_time"
    }

    enum Domain: String, CaseIterable, Identifiable {
        case biologicalBases = "Biological Bases"
        case cognitiveAffective = "Cognitive-Affective Bases"
        case socialCultural = "Social & Cultural Bases"
        case growthLifespan = "Growth & Lifespan Development"
        case assessmentDiagnosis = "Assessment & Diagnosis"
        case treatment = "Treatment & Intervention"
        case research = "Research Methods & Statistics"
        case ethical = "Ethical, Legal & Professional"

        var id: String { rawValue }

        var shortName: String {
            switch self {
            case .biologicalBases: return "Bio"
            case .cognitiveAffective: return "Cog"
            case .socialCultural: return "Social"
            case .growthLifespan: return "Dev"
            case .assessmentDiagnosis: return "Assess"
            case .treatment: return "Tx"
            case .research: return "Research"
            case .ethical: return "Ethics"
            }
        }

        var iconName: String {
            switch self {
            case .biologicalBases: return "brain.head.profile"
            case .cognitiveAffective: return "lightbulb"
            case .socialCultural: return "person.3"
            case .growthLifespan: return "figure.and.child.holdinghands"
            case .assessmentDiagnosis: return "checklist"
            case .treatment: return "cross.case"
            case .research: return "chart.bar"
            case .ethical: return "scale.3d"
            }
        }
    }
}
