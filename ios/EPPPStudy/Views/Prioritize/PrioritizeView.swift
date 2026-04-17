import SwiftUI
import WebKit

/// Prioritize tab — loads `/prioritize` in a WKWebView with the Supabase session
/// injected and the web chrome hidden so it feels native on iOS.
struct PrioritizeView: View {
    @Environment(AuthService.self) private var authService

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()
                PrioritizeWebViewRepresentable(
                    url: Self.url,
                    authService: authService
                )
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: "chart.bar.doc.horizontal.fill")
                            .foregroundStyle(Theme.Colors.sage)
                        Text("Prioritize")
                            .font(Theme.Typography.subheading)
                            .foregroundStyle(Theme.Colors.foreground)
                    }
                }
            }
        }
    }

    private static var url: URL {
        URL(string: "\(baseURL)/prioritize")!
    }

    private static var baseURL: String {
        #if DEBUG
        "http://localhost:3000"
        #else
        "https://thepsychology.ai"
        #endif
    }
}

private struct PrioritizeWebViewRepresentable: UIViewRepresentable {
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

        controller.addUserScript(
            WKUserScript(source: Self.iosEmbedScript, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )

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

    private static let iosEmbedScript = """
    (function(){
      var s=document.createElement('style');
      s.textContent='[data-site-navbar]{display:none!important}'
        +'nav[aria-label="breadcrumb"]{display:none!important}'
        +'footer{display:none!important}'
        +'main>div{padding-left:10px!important;padding-right:10px!important}'
        +'#ios-theme-toggle{position:fixed;bottom:16px;right:16px;z-index:9999;'
        +'width:36px;height:36px;border-radius:50%;'
        +'border:1px solid hsl(var(--border));background:hsl(var(--background));'
        +'display:flex;align-items:center;justify-content:center;'
        +'-webkit-tap-highlight-color:transparent;backdrop-filter:blur(8px);}'
        +'#ios-theme-toggle svg{width:16px;height:16px;color:hsl(var(--foreground))}';
      (document.head||document.documentElement).appendChild(s);
      function init(){
        if(document.getElementById('ios-theme-toggle'))return;
        var b=document.createElement('button');b.id='ios-theme-toggle';
        function r(){
          var d=document.documentElement.classList.contains('dark');
          b.innerHTML=d
            ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
            :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
        }
        r();
        b.addEventListener('click',function(){
          document.documentElement.classList.toggle('dark');
          var nd=document.documentElement.classList.contains('dark');
          localStorage.setItem('theme',nd?'dark':'light');
          window.dispatchEvent(new CustomEvent('app-theme-updated',{detail:{theme:nd?'dark':'light',themePreference:nd?'dark':'light'}}));
          r();
        });
        document.body.appendChild(b);
      }
      if(document.body)init();
      else document.addEventListener('DOMContentLoaded',init);
    })();
    """
}
