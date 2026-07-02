import SwiftUI
import UIKit

/// Design tokens ported from `src/app/globals.css`, both light AND dark.
/// The site defaults to light with dark opt-in; the app follows the phone's
/// appearance setting and resolves every token per-mode automatically.
/// Keep in sync with web — if a token changes there, update it here.
enum Theme {

    enum Colors {
        // MARK: Background hierarchy
        /// light #FAFAFB / dark #18181B — web --background
        static let background = adaptive(light: 0xFAFAFB, dark: 0x18181B)
        /// light #FFFFFF / dark #252525 — web --card
        static let card = adaptive(light: 0xFFFFFF, dark: 0x252525)
        /// One step above card. Web doesn't formalize this; stays close to --accent dark.
        static let cardElevated = adaptive(light: 0xFFFFFF, dark: 0x2C2C2F)
        /// light #E5E5E5 / dark #3F3F3F — web --border
        static let border = adaptive(light: 0xE5E5E5, dark: 0x3F3F3F)
        static let borderSubtle = adaptive(light: 0xEFEFEF, dark: 0x2F2F33)

        // MARK: Text
        /// light #252525 / dark #FAFAFA — web --foreground
        static let foreground = adaptive(light: 0x252525, dark: 0xFAFAFA)
        /// web --muted-foreground
        static let mutedForeground = adaptive(light: 0x8A8A8A, dark: 0xB4B4B4)
        static let dimForeground = adaptive(light: 0xA3A3A3, dark: 0x787878)

        // MARK: Accents
        /// Coral — the site's dominant CTA/action color (brand-coral-bg buttons).
        static let accent = fixed(0xD87758)
        /// Blue — web --secondary; links and prose accents, NOT primary actions.
        static let link = fixed(0x2B7FFF)
        /// Web --brand-highlight: coral in light mode, sage in dark. Read-along/selection tint.
        static let highlight = adaptive(light: 0xD87758, dark: 0xBDD1CA)
        /// Web --destructive
        static let destructive = adaptive(light: 0xE7000B, dark: 0xC22B33)
        /// Correct-answer green, tuned per mode for contrast.
        static let success = adaptive(light: 0x16A34A, dark: 0x4ADE80)

        // MARK: Brand palette — mode-independent, from globals.css / BRAND_COLORS.md
        static let sage = fixed(0xBDD1CA)
        static let olive = fixed(0x788C5D)
        static let coral = fixed(0xD87758)
        static let dustyRose = fixed(0xC46685)
        static let lavenderGray = fixed(0xCBC9DB)
        static let softBlue = fixed(0x6A9BCC)

        /// Card shadow — visible in light (web `shadow`), near-invisible in dark
        /// where the border does the separating, matching the site.
        static let cardShadow = Color(UIColor { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor.black.withAlphaComponent(0.25)
                : UIColor.black.withAlphaComponent(0.07)
        })

        // MARK: Helpers
        private static func adaptive(light: UInt32, dark: UInt32) -> Color {
            Color(UIColor { trait in
                trait.userInterfaceStyle == .dark ? uiColor(dark) : uiColor(light)
            })
        }

        private static func fixed(_ hex: UInt32) -> Color {
            Color(uiColor(hex))
        }

        private static func uiColor(_ hex: UInt32) -> UIColor {
            UIColor(
                red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255,
                alpha: 1
            )
        }
    }

    /// Web scale: --radius 10px base → sm 6 / md 8 / lg 10 / xl 14, cards rounded-xl 12.
    enum Radius {
        static let sm: CGFloat = 6
        static let md: CGFloat = 8
        static let lg: CGFloat = 10
        static let card: CGFloat = 12
        static let xl: CGFloat = 14
        static let full: CGFloat = 999
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
    }

    enum Typography {
        static let display = Font.system(size: 34, weight: .bold)
        static let title = Font.system(size: 28, weight: .semibold)
        static let heading = Font.system(size: 22, weight: .semibold)
        static let subheading = Font.system(size: 17, weight: .semibold)
        static let body = Font.system(size: 16, weight: .regular)
        static let callout = Font.system(size: 15, weight: .regular)
        static let caption = Font.system(size: 13, weight: .regular)
        static let captionBold = Font.system(size: 13, weight: .semibold)
        static let small = Font.system(size: 11, weight: .medium)

        /// Question stem — serif, like the site's Merriweather `.question-text`
        /// (New York is the platform serif). Pair with `.lineSpacing(6)`.
        static let question = Font.system(size: 19, weight: .regular, design: .serif)
        /// Serif for lesson body text.
        static let lessonBody = Font.system(size: 17, weight: .regular, design: .serif)
    }
}

// MARK: - Reusable card style

/// Web card: white surface, 1px border, 12px corners, soft drop shadow.
struct ThemedCardStyle: ViewModifier {
    var padding: CGFloat = Theme.Spacing.lg
    var radius: CGFloat = Theme.Radius.card

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.Colors.card)
            .clipShape(RoundedRectangle(cornerRadius: radius))
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke(Theme.Colors.border, lineWidth: 1)
            )
            .shadow(color: Theme.Colors.cardShadow, radius: 6, y: 2)
    }
}

extension View {
    func themedCard(padding: CGFloat = Theme.Spacing.lg, radius: CGFloat = Theme.Radius.card) -> some View {
        modifier(ThemedCardStyle(padding: padding, radius: radius))
    }

    /// Web `.brand-pill-*`: tinted capsule — 18% fill, 35% border of a brand color.
    func brandPill(_ color: Color) -> some View {
        self
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.18))
            .clipShape(Capsule())
            .overlay(Capsule().stroke(color.opacity(0.35), lineWidth: 1))
    }
}

// MARK: - Pill button (web CTA: rounded-full, coral fill, white text)

struct PillButtonStyle: ButtonStyle {
    var fill: Color = Theme.Colors.accent

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .frame(minHeight: 44)
            .background(fill)
            .clipShape(Capsule())
            .opacity(configuration.isPressed ? 0.9 : 1)
    }
}
