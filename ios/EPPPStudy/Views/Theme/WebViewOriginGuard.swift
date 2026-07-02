import WebKit
import UIKit

/// Keeps first-party webviews on our own origin. The Supabase session script
/// (see SupabaseWebSessionInjector) runs on every main-frame navigation, so
/// letting the webview wander to a third-party page would hand that page the
/// user's tokens via its localStorage. Any off-origin main-frame navigation
/// opens in Safari instead.
final class WebViewOriginGuard: NSObject, WKNavigationDelegate {
    /// WKWebView.navigationDelegate is weak — the singleton keeps it alive.
    static let shared = WebViewOriginGuard()

    private static let allowedHosts: Set<String> = {
        var hosts: Set<String> = ["thepsychology.ai", "www.thepsychology.ai"]
        #if DEBUG
        hosts.insert("localhost")
        hosts.insert("127.0.0.1")
        #endif
        return hosts
    }()

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        // Subframes can't read our origin's localStorage; only guard the main frame.
        guard navigationAction.targetFrame?.isMainFrame != false else {
            decisionHandler(.allow)
            return
        }
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if url.scheme == "about" || (url.host.map { Self.allowedHosts.contains($0) } ?? false) {
            decisionHandler(.allow)
            return
        }
        decisionHandler(.cancel)
        if url.scheme == "http" || url.scheme == "https" {
            UIApplication.shared.open(url)
        }
    }
}
