import SwiftUI

struct MainTabView: View {
    @State private var selectedTab: Tab = .dashboard

    enum Tab: String, CaseIterable {
        case dashboard = "Dashboard"
        case study = "Study"
        case exams = "Exams"
        case library = "Library"
        case settings = "Settings"

        var icon: String {
            switch self {
            case .dashboard: return "square.grid.2x2"
            case .study: return "book"
            case .exams: return "pencil.and.list.clipboard"
            case .library: return "arrow.down.circle"
            case .settings: return "gearshape"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(Tab.allCases, id: \.self) { tab in
                tabContent(for: tab)
                    .tabItem {
                        Label(tab.rawValue, systemImage: tab.icon)
                    }
                    .tag(tab)
            }
        }
        .tint(.white)
    }

    @ViewBuilder
    private func tabContent(for tab: Tab) -> some View {
        switch tab {
        case .dashboard:
            DashboardView()
        case .study:
            LessonListView()
        case .exams:
            ExamListView()
        case .library:
            DownloadsView()
        case .settings:
            SettingsView()
        }
    }
}

#Preview {
    MainTabView()
        .preferredColorScheme(.dark)
}
