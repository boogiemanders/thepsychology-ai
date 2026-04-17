import SwiftUI

/// Dashboard tab — the home/hub. Shows welcome, share/invite cards, quick stats,
/// and navigation into Settings and Downloads. The four "mode" tabs
/// (Practice/Prioritize/Study/Recover) live in the bottom bar, so this screen
/// does NOT repeat them.
struct DashboardHomeView: View {
    @Environment(LocalStore.self) private var localStore
    @Environment(AuthService.self) private var authService

    @State private var streak: StudyStreak = StudyStreak(currentStreak: 0, longestStreak: 0, lastStudyDate: nil, studyDates: [])
    @State private var totalExams: Int = 0
    @State private var totalLessons: Int = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.xl) {
                    header
                    shareCards
                    statsGrid
                    accountLinks
                }
                .padding(.horizontal, Theme.Spacing.lg)
                .padding(.top, Theme.Spacing.sm)
                .padding(.bottom, Theme.Spacing.xxl)
            }
            .background(Theme.Colors.background.ignoresSafeArea())
            .scrollContentBackground(.hidden)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: Theme.Spacing.sm) {
                        if let logo = UIImage(named: "BunnyLogo") {
                            Image(uiImage: logo)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 24, height: 24)
                        } else {
                            Image(systemName: "pawprint.fill")
                                .foregroundStyle(Theme.Colors.sage)
                        }
                        Text("thePsychology.ai")
                            .font(Theme.Typography.subheading)
                            .foregroundStyle(Theme.Colors.foreground)
                    }
                }
            }
            .task { load() }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            AnimatedShinyText(
                "Dashboard",
                font: Theme.Typography.display,
                baseColor: Theme.Colors.foreground.opacity(0.55),
                shimmerColor: Theme.Colors.foreground
            )
            Text("Welcome back\(greetingName)")
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var greetingName: String {
        // Pulled from JWT-derived id, best effort. Left blank if unknown.
        guard let id = authService.currentUserId, !id.isEmpty else { return "" }
        return ", \(String(id.prefix(8)))"
    }

    // MARK: - Share / Invite cards

    private var shareCards: some View {
        VStack(spacing: Theme.Spacing.md) {
            ShareRow(
                icon: "person.2.fill",
                tint: Theme.Colors.sage,
                title: "Share with friends",
                subtitle: "Help other postdocs discover thePsychology.ai"
            )
            ShareRow(
                icon: "video.fill",
                tint: Theme.Colors.softBlue,
                title: "Post a Quick Video",
                subtitle: "30-sec clip on IG, TikTok, LinkedIn, or FB",
                badge: "Approved"
            )
            ShareRow(
                icon: "bubble.left.fill",
                tint: Theme.Colors.dustyRose,
                title: "Share Your Experience",
                subtitle: "Tell us how it helped your prep"
            )
            ShareRow(
                icon: "person.crop.circle.badge.plus",
                tint: Theme.Colors.coral,
                title: "Invite a Colleague",
                subtitle: "Share your link with friends who are studying"
            )
        }
        .themedCard(padding: Theme.Spacing.md)
    }

    // MARK: - Stats grid

    private var statsGrid: some View {
        HStack(spacing: Theme.Spacing.md) {
            StatTile(
                label: "Day Streak",
                value: streak.currentStreak,
                tint: Theme.Colors.coral,
                icon: "flame.fill"
            )
            StatTile(
                label: "Exams Taken",
                value: totalExams,
                tint: Theme.Colors.sage,
                icon: "checkmark.seal.fill"
            )
            StatTile(
                label: "Lessons Done",
                value: totalLessons,
                tint: Theme.Colors.softBlue,
                icon: "book.closed.fill"
            )
        }
    }

    // MARK: - Account links

    private var accountLinks: some View {
        VStack(spacing: 0) {
            NavigationLink {
                AccountView()
            } label: {
                AccountLinkRow(icon: "person.fill", title: "Account", subtitle: "Profile and exam date")
            }
            Divider().background(Theme.Colors.borderSubtle).padding(.leading, 54)

            NavigationLink {
                NotificationsView()
            } label: {
                AccountLinkRow(icon: "bell.fill", title: "Notifications", subtitle: "Daily reminders")
            }
            Divider().background(Theme.Colors.borderSubtle).padding(.leading, 54)

            NavigationLink {
                DownloadsView()
            } label: {
                AccountLinkRow(icon: "arrow.down.circle.fill", title: "Downloads", subtitle: "Offline content")
            }
            Divider().background(Theme.Colors.borderSubtle).padding(.leading, 54)

            NavigationLink {
                StorageView()
            } label: {
                AccountLinkRow(icon: "internaldrive.fill", title: "Storage", subtitle: "Manage cached content")
            }
            Divider().background(Theme.Colors.borderSubtle).padding(.leading, 54)

            Button {
                authService.signOut()
            } label: {
                AccountLinkRow(icon: "arrow.right.square.fill", title: "Sign out", subtitle: nil, destructive: true)
            }
        }
        .themedCard(padding: 0)
    }

    // MARK: - Data

    private func load() {
        streak = localStore.getStreak()
        totalExams = localStore.getAllExamResults().count
        totalLessons = localStore.getAllLessons().filter { lesson in
            localStore.getLessonProgress(id: lesson.slug)?.completed == true
        }.count
    }
}

// MARK: - Subviews

private struct ShareRow: View {
    let icon: String
    let tint: Color
    let title: String
    let subtitle: String
    var badge: String? = nil

    var body: some View {
        HStack(spacing: Theme.Spacing.md) {
            ZStack {
                Circle()
                    .fill(tint.opacity(0.15))
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(tint)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(Theme.Colors.foreground)
                Text(subtitle)
                    .font(Theme.Typography.caption)
                    .foregroundStyle(Theme.Colors.mutedForeground)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            if let badge {
                Text(badge)
                    .font(Theme.Typography.small)
                    .foregroundStyle(Theme.Colors.sage)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        Capsule().stroke(Theme.Colors.sage.opacity(0.5), lineWidth: 1)
                    )
            } else {
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.Colors.dimForeground)
            }
        }
        .padding(.vertical, Theme.Spacing.xs)
    }
}

private struct StatTile: View {
    let label: String
    let value: Int
    let tint: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(tint)
                Spacer()
            }
            NumberTicker(
                value: value,
                font: .system(size: 28, weight: .bold, design: .rounded),
                color: Theme.Colors.foreground
            )
            Text(label)
                .font(Theme.Typography.small)
                .foregroundStyle(Theme.Colors.mutedForeground)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .themedCard(padding: Theme.Spacing.md)
    }
}

private struct AccountLinkRow: View {
    let icon: String
    let title: String
    let subtitle: String?
    var destructive: Bool = false

    var body: some View {
        HStack(spacing: Theme.Spacing.md) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Theme.Colors.cardElevated)
                    .frame(width: 30, height: 30)
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(destructive ? Theme.Colors.coral : Theme.Colors.foreground)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(destructive ? Theme.Colors.coral : Theme.Colors.foreground)
                if let subtitle {
                    Text(subtitle)
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Colors.mutedForeground)
                }
            }
            Spacer(minLength: 0)
            if !destructive {
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.Colors.dimForeground)
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.vertical, Theme.Spacing.md)
        .contentShape(Rectangle())
    }
}
