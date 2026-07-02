import Foundation

/// Builds the JS snippet that writes the native Supabase session into the web
/// view's localStorage before the page loads. Shared between `WebAppView` and
/// `RecoverView` so the storage key stays consistent in one place.
enum SupabaseWebSessionInjector {

    /// Supabase project ref — the subdomain of the Supabase URL in Constants.
    /// The JS client stores sessions under `sb-<ref>-auth-token`.
    static let supabaseProjectRef = "hwkuxietvwvbgdowxzkw"

    static func script(accessToken: String, refreshToken: String) -> String? {
        guard
            let accessTokenJSON = try? jsonString(accessToken),
            let refreshTokenJSON = try? jsonString(refreshToken)
        else { return nil }

        let storageKey = "sb-\(supabaseProjectRef)-auth-token"

        return """
        (function() {
          try {
            var accessToken = \(accessTokenJSON);
            var refreshToken = \(refreshTokenJSON);
            var parts = accessToken.split('.');
            if (parts.length !== 3) return;
            var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) { b64 += '='; }
            var payload = JSON.parse(atob(b64));
            var session = {
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'bearer',
              expires_at: payload.exp,
              expires_in: Math.max(0, payload.exp - Math.floor(Date.now() / 1000)),
              user: {
                id: payload.sub,
                email: payload.email || null,
                aud: payload.aud || 'authenticated',
                role: payload.role || 'authenticated',
                app_metadata: payload.app_metadata || {},
                user_metadata: payload.user_metadata || {}
              }
            };
            window.localStorage.setItem('\(storageKey)', JSON.stringify(session));
          } catch (e) {
            console.error('[iOS] Session injection failed:', e);
          }
        })();
        """
    }

    private static func jsonString(_ value: String) throws -> String {
        let data = try JSONSerialization.data(withJSONObject: [value], options: [])
        guard
            let raw = String(data: data, encoding: .utf8),
            raw.hasPrefix("[\""), raw.hasSuffix("\"]")
        else {
            throw NSError(domain: "SupabaseWebSessionInjector", code: 1)
        }
        return String(raw.dropFirst().dropLast())
    }
}
