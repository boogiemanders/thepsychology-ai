import Foundation

enum Constants {
    #if DEBUG
    // Mac LAN IP — phone must be on the same Wi-Fi as your Mac running `npm run dev`.
    static let apiBaseURL = "http://192.168.1.158:3000/api/monikas"
    static let webJoinBaseURL = "http://192.168.1.158:3000/join"
    static let webDisplayBaseURL = "http://192.168.1.158:3000/display"
    static let webDisplayHumanHost = "192.168.1.158:3000/display"
    #else
    static let apiBaseURL = "https://thepsychology.ai/api/monikas"
    static let webJoinBaseURL = "https://thepsychology.ai/join"
    static let webDisplayBaseURL = "https://thepsychology.ai/display"
    static let webDisplayHumanHost = "thepsychology.ai/display"
    #endif

    static let supabaseURL = "https://hwkuxietvwvbgdowxzkw.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3a3V4aWV0dnd2Ymdkb3d4emt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTM1NTMsImV4cCI6MjA3ODQ2OTU1M30.ElDXc-JBYORsA4MGZ53y0NZfgGh9tpa81Yax9fENT6U" // Public anon key — safe to ship

    /// Seconds between lobby polls. Replace with Supabase Realtime in M2.
    static let lobbyPollInterval: TimeInterval = 1.5
}
