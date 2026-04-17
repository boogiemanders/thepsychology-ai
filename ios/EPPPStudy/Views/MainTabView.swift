import SwiftUI

struct MainTabView: View {
    @State private var selectedTab: Tab = .dashboard

    enum Tab: Int, CaseIterable {
        case dashboard, practice, prioritize, study, recover

        var title: String {
            switch self {
            case .dashboard: return "Dashboard"
            case .practice:  return "Practice"
            case .prioritize: return "Prioritize"
            case .study:     return "Study"
            case .recover:   return "Recover"
            }
        }

        var icon: String {
            switch self {
            case .dashboard: return "square.grid.2x2.fill"
            case .practice:  return "graduationcap.fill"
            case .prioritize: return "chart.bar.doc.horizontal.fill"
            case .study:     return "book.fill"
            case .recover:   return "drop.fill"
            }
        }
    }

    init() {
        // Style the native tab bar to match our theme.
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Theme.Colors.background)
        appearance.shadowColor = UIColor(Theme.Colors.borderSubtle)

        let item = appearance.stackedLayoutAppearance
        item.normal.iconColor = UIColor(Theme.Colors.dimForeground)
        item.normal.titleTextAttributes = [.foregroundColor: UIColor(Theme.Colors.dimForeground)]
        item.selected.iconColor = UIColor(Theme.Colors.sage)
        item.selected.titleTextAttributes = [.foregroundColor: UIColor(Theme.Colors.sage)]

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance

        // Navigation bar styling
        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = UIColor(Theme.Colors.background)
        nav.shadowColor = .clear
        nav.titleTextAttributes = [.foregroundColor: UIColor(Theme.Colors.foreground)]
        nav.largeTitleTextAttributes = [.foregroundColor: UIColor(Theme.Colors.foreground)]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardHomeView()
                .tag(Tab.dashboard)
                .tabItem { Label(Tab.dashboard.title, systemImage: Tab.dashboard.icon) }

            ExamGeneratorView()
                .tag(Tab.practice)
                .tabItem { Label(Tab.practice.title, systemImage: Tab.practice.icon) }

            PrioritizeView()
                .tag(Tab.prioritize)
                .tabItem { Label(Tab.prioritize.title, systemImage: Tab.prioritize.icon) }

            StudyView()
                .tag(Tab.study)
                .tabItem { Label(Tab.study.title, systemImage: Tab.study.icon) }

            RecoverView()
                .tag(Tab.recover)
                .tabItem { Label(Tab.recover.title, systemImage: Tab.recover.icon) }
        }
        .tint(Theme.Colors.sage)
    }
}

#Preview {
    MainTabView()
        .preferredColorScheme(.dark)
}
