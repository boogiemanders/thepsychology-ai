import SwiftUI

/// Design tokens ported from `src/app/globals.css` (dark theme).
/// Keep in sync with web — if a token changes there, update it here.
enum Theme {

    enum Colors {
        // Background hierarchy
        static let background = Color(red: 0.094, green: 0.094, blue: 0.106)       // #18181B
        static let card = Color(red: 0.125, green: 0.125, blue: 0.137)             // #202023
        static let cardElevated = Color(red: 0.153, green: 0.153, blue: 0.165)     // #272729
        static let border = Color(red: 0.204, green: 0.204, blue: 0.212)           // #343436
        static let borderSubtle = Color(red: 0.165, green: 0.165, blue: 0.176)     // #2A2A2D

        // Text
        static let foreground = Color(red: 0.980, green: 0.980, blue: 0.980)       // #FAFAFA
        static let mutedForeground = Color(red: 0.627, green: 0.627, blue: 0.627)  // #A0A0A0
        static let dimForeground = Color(red: 0.471, green: 0.471, blue: 0.471)    // #787878

        // Accent
        static let accent = Color(red: 0.169, green: 0.498, blue: 1.0)             // #2B7FFF

        // Brand palette — from globals.css
        static let sage = Color(red: 0.741, green: 0.820, blue: 0.792)             // #BDD1CA
        static let olive = Color(red: 0.471, green: 0.549, blue: 0.365)            // #788C5D
        static let coral = Color(red: 0.847, green: 0.467, blue: 0.345)            // #D87758
        static let dustyRose = Color(red: 0.769, green: 0.400, blue: 0.522)        // #C46685
        static let lavenderGray = Color(red: 0.796, green: 0.788, blue: 0.859)     // #CBC9DB
        static let softBlue = Color(red: 0.416, green: 0.608, blue: 0.800)         // #6A9BCC
    }

    enum Radius {
        static let sm: CGFloat = 6
        static let md: CGFloat = 10
        static let lg: CGFloat = 14
        static let xl: CGFloat = 20
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
    }
}

// MARK: - Reusable card style

struct ThemedCardStyle: ViewModifier {
    var padding: CGFloat = Theme.Spacing.lg
    var radius: CGFloat = Theme.Radius.lg

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.Colors.card)
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke(Theme.Colors.borderSubtle, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: radius))
    }
}

extension View {
    func themedCard(padding: CGFloat = Theme.Spacing.lg, radius: CGFloat = Theme.Radius.lg) -> some View {
        modifier(ThemedCardStyle(padding: padding, radius: radius))
    }
}
