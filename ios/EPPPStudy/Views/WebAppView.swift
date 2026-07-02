import SwiftUI
import WebKit

/// Full-screen WKWebView host for the web dashboard. No longer wired into the
/// app (MainTabView with 5 native-ish tabs is active). Kept as insurance so we
/// can swap back to a pure webview quickly if needed.
struct WebAppView: View {
    @Environment(AuthService.self) private var authService

    var body: some View {
        WebAppViewRepresentable(authService: authService)
            .ignoresSafeArea()
    }
}

private struct WebAppViewRepresentable: UIViewRepresentable {
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
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: Self.dashboardURL))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    private static var dashboardURL: URL {
        #if DEBUG
        URL(string: "http://localhost:3000/dashboard")!
        #else
        URL(string: "https://thepsychology.ai/dashboard")!
        #endif
    }
}
