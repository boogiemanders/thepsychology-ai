import SwiftUI
import WebKit

/// Study tab — native accordion view of all EPPP domains + topics, mirroring
/// `thepsychology.ai/topic-selector`. Tapping a topic opens the web lesson
/// (`/topic-teacher`) in a WKWebView with the Supabase session injected.
///
/// Progress bars read from Supabase `quiz_results` via `QuizProgressService`.
/// Refreshes on appear and when returning from a topic webview.
struct StudyView: View {
    @Environment(LocalStore.self) private var localStore
    @Environment(AuthService.self) private var authService
    @Environment(QuizProgressService.self) private var quizProgress

    @State private var expandedDomainIds: Set<String> = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    header
                    domainList
                }
                .padding(.horizontal, Theme.Spacing.lg)
                .padding(.top, Theme.Spacing.sm)
                .padding(.bottom, Theme.Spacing.xxl)
            }
            .background(Theme.Colors.background.ignoresSafeArea())
            .scrollContentBackground(.hidden)
            .task { await quizProgress.refresh() }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: "book.fill")
                            .foregroundStyle(Theme.Colors.sage)
                        Text("Study")
                            .font(Theme.Typography.subheading)
                            .foregroundStyle(Theme.Colors.foreground)
                    }
                }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            AnimatedShinyText(
                "Lessons",
                font: Theme.Typography.display,
                baseColor: Theme.Colors.foreground.opacity(0.55),
                shimmerColor: Theme.Colors.foreground
            )
            Text("Select a lesson to start studying")
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Domain list

    private var domainList: some View {
        VStack(spacing: Theme.Spacing.md) {
            ForEach(EPPPDomains.all) { domain in
                DomainAccordion(
                    domain: domain,
                    isExpanded: expandedDomainIds.contains(domain.id),
                    domainProgress: overallProgress(for: domain),
                    topicProgress: { topic in progress(for: topic, in: domain) },
                    onToggle: { toggle(domain: domain) },
                    authService: authService,
                    onTopicDismiss: { Task { await quizProgress.refresh() } }
                )
            }
        }
    }

    private func toggle(domain: EPPPDomain) {
        withAnimation(.easeInOut(duration: 0.25)) {
            if expandedDomainIds.contains(domain.id) {
                expandedDomainIds.remove(domain.id)
            } else {
                expandedDomainIds.insert(domain.id)
            }
        }
    }

    // MARK: - Progress (from Supabase quiz_results via QuizProgressService)

    private func progress(for topic: EPPPTopic, in domain: EPPPDomain) -> Int {
        quizProgress.progress(for: topic.name)
    }

    private func overallProgress(for domain: EPPPDomain) -> Int {
        let total = domain.topics.reduce(0) { $0 + progress(for: $1, in: domain) }
        guard !domain.topics.isEmpty else { return 0 }
        return total / domain.topics.count
    }
}

// MARK: - Accordion row

private struct DomainAccordion: View {
    let domain: EPPPDomain
    let isExpanded: Bool
    let domainProgress: Int
    let topicProgress: (EPPPTopic) -> Int
    let onToggle: () -> Void
    let authService: AuthService
    var onTopicDismiss: (() -> Void)?

    var body: some View {
        VStack(spacing: 0) {
            header
            if isExpanded {
                Divider().background(Theme.Colors.borderSubtle)
                topics
            }
        }
        .background(Theme.Colors.card)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .stroke(Theme.Colors.borderSubtle, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
    }

    private var header: some View {
        Button(action: onToggle) {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                HStack(spacing: Theme.Spacing.sm) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(domain.name)
                            .font(Theme.Typography.captionBold)
                            .foregroundStyle(Theme.Colors.foreground)
                        Text(domain.description)
                            .font(Theme.Typography.caption)
                            .foregroundStyle(Theme.Colors.mutedForeground)
                    }
                    Spacer()
                    Text("\(domainProgress)%")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Colors.mutedForeground)
                        .monospacedDigit()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.Colors.dimForeground)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                ProgressBar(value: domainProgress, height: 2)
            }
            .padding(Theme.Spacing.lg)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var topics: some View {
        VStack(spacing: Theme.Spacing.md) {
            ForEach(domain.topics) { topic in
                NavigationLink {
                    TopicTeacherView(domainId: domain.id, topicName: topic.name, authService: authService, onDismiss: onTopicDismiss)
                } label: {
                    TopicRow(
                        name: topic.name,
                        progress: topicProgress(topic)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, Theme.Spacing.lg)
        .padding(.vertical, Theme.Spacing.md)
    }
}

// MARK: - Topic row

private struct TopicRow: View {
    let name: String
    let progress: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(name)
                    .font(Theme.Typography.body)
                    .foregroundStyle(Theme.Colors.foreground)
                Spacer()
                Text("\(progress)%")
                    .font(Theme.Typography.small)
                    .foregroundStyle(Theme.Colors.mutedForeground)
                    .monospacedDigit()
            }
            ProgressBar(value: progress, height: 3)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

// MARK: - Progress bar

private struct ProgressBar: View {
    let value: Int        // 0-100
    let height: CGFloat

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Theme.Colors.cardElevated)
                Capsule()
                    .fill(tint)
                    .frame(width: max(0, min(1, CGFloat(value) / 100)) * geo.size.width)
            }
        }
        .frame(height: height)
    }

    private var tint: Color {
        if value >= 70 { return Theme.Colors.olive }
        if value >= 40 { return Theme.Colors.sage }
        return Theme.Colors.coral.opacity(0.65)
    }
}

// MARK: - Topic-teacher webview

/// Pushes the `/topic-teacher?domain=...&topic=...` web page inside a WKWebView,
/// with Supabase session injected so the user stays signed in.
private struct TopicTeacherView: View {
    let domainId: String
    let topicName: String
    let authService: AuthService
    var onDismiss: (() -> Void)?

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()
            TopicTeacherWebViewRepresentable(
                url: Self.url(domainId: domainId, topicName: topicName),
                authService: authService
            )
        }
        .onDisappear { onDismiss?() }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(topicName)
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(Theme.Colors.foreground)
                    .lineLimit(1)
            }
        }
    }

    private static func url(domainId: String, topicName: String) -> URL {
        var components = URLComponents(string: baseURL)!
        components.path = "/topic-teacher"
        components.queryItems = [
            URLQueryItem(name: "domain", value: domainId),
            URLQueryItem(name: "topic", value: topicName),
        ]
        return components.url!
    }

    private static var baseURL: String {
        #if DEBUG
        "http://localhost:3000"
        #else
        "https://thepsychology.ai"
        #endif
    }
}

private struct TopicTeacherWebViewRepresentable: UIViewRepresentable {
    let url: URL
    let authService: AuthService

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()

        if let tokens = authService.currentTokensForWebView(),
           let script = SupabaseWebSessionInjector.script(
               accessToken: tokens.accessToken,
               refreshToken: tokens.refreshToken
           ) {
            controller.addUserScript(
                WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true)
            )
        }

        config.userContentController = controller
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(Theme.Colors.background)
        webView.scrollView.backgroundColor = UIColor(Theme.Colors.background)
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
