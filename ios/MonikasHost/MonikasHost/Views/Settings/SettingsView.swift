import SwiftUI

struct SettingsView: View {
    var body: some View {
        List {
            Section("Build") {
                LabeledContent("App", value: "Monikas")
                LabeledContent("Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "-")
                LabeledContent("API", value: Constants.apiBaseURL)
            }
            Section {
                Text("More coming soon — timer length, teams, character mode, callback mode.")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
}
