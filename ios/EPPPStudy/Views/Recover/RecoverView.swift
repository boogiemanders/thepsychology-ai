import SwiftUI
import WebKit

/// Recover tab — hosts the `/recover` chat interface inside a WKWebView.
/// Chat with markdown streaming is too heavy to port natively right now; the web
/// implementation works great inside a webview, and the native session injection
/// (see WebAppView) keeps the user signed in.
struct RecoverView: View {
    @Environment(AuthService.self) private var authService

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()
            RecoverWebViewRepresentable(authService: authService)
        }
        // NOTE: do NOT ignore bottom safe area — the tab bar would cover the
        // chat input box. Webview stops above the tab bar.
    }
}

private struct RecoverWebViewRepresentable: UIViewRepresentable {
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
        webView.navigationDelegate = WebViewOriginGuard.shared
        webView.isOpaque = false
        webView.backgroundColor = UIColor(Theme.Colors.background)
        webView.scrollView.backgroundColor = UIColor(Theme.Colors.background)
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: Self.recoverURL))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    private static var recoverURL: URL {
        #if DEBUG
        URL(string: "http://localhost:3000/recover")!
        #else
        URL(string: "https://thepsychology.ai/recover")!
        #endif
    }
}
