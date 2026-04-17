import SwiftUI

// MARK: - ShineBorder
// Animated gradient border — the conic gradient slowly rotates.
// Mirrors the web's `ShineBorder` component.

struct ShineBorder: ViewModifier {
    let cornerRadius: CGFloat
    let colors: [Color]
    let lineWidth: CGFloat
    let duration: Double

    @State private var angle: Double = 0

    func body(content: Content) -> some View {
        content.overlay(
            RoundedRectangle(cornerRadius: cornerRadius)
                .strokeBorder(
                    AngularGradient(
                        gradient: Gradient(colors: colors + [colors.first ?? .clear]),
                        center: .center,
                        angle: .degrees(angle)
                    ),
                    lineWidth: lineWidth
                )
                .task {
                    withAnimation(.linear(duration: duration).repeatForever(autoreverses: false)) {
                        angle = 360
                    }
                }
        )
    }
}

extension View {
    /// Applies an animated gradient border that rotates around the shape.
    func shineBorder(
        radius: CGFloat = Theme.Radius.lg,
        colors: [Color] = [Theme.Colors.sage, Theme.Colors.softBlue, Theme.Colors.dustyRose, Theme.Colors.sage],
        lineWidth: CGFloat = 1.5,
        duration: Double = 8
    ) -> some View {
        modifier(ShineBorder(cornerRadius: radius, colors: colors, lineWidth: lineWidth, duration: duration))
    }
}

// MARK: - NumberTicker
// Counts up from 0 to the target on appear.

struct NumberTicker: View {
    let value: Int
    let duration: Double
    let font: Font
    let color: Color

    @State private var displayed: Double = 0

    init(
        value: Int,
        duration: Double = 1.2,
        font: Font = .system(size: 44, weight: .bold, design: .rounded),
        color: Color = Theme.Colors.foreground
    ) {
        self.value = value
        self.duration = duration
        self.font = font
        self.color = color
    }

    var body: some View {
        Text("\(Int(displayed.rounded()))")
            .font(font)
            .foregroundStyle(color)
            .contentTransition(.numericText())
            .monospacedDigit()
            .onAppear {
                withAnimation(.easeOut(duration: duration)) {
                    displayed = Double(value)
                }
            }
    }
}

// MARK: - AnimatedShinyText
// Text with a shimmer highlight moving left-to-right.

struct AnimatedShinyText: View {
    let text: String
    let font: Font
    let baseColor: Color
    let shimmerColor: Color

    @State private var phase: CGFloat = -0.5

    init(
        _ text: String,
        font: Font = Theme.Typography.heading,
        baseColor: Color = Theme.Colors.mutedForeground,
        shimmerColor: Color = Theme.Colors.foreground
    ) {
        self.text = text
        self.font = font
        self.baseColor = baseColor
        self.shimmerColor = shimmerColor
    }

    var body: some View {
        Text(text)
            .font(font)
            .overlay {
                LinearGradient(
                    stops: [
                        .init(color: .clear, location: min(1, max(0, phase - 0.2))),
                        .init(color: shimmerColor, location: min(1, max(0, phase))),
                        .init(color: .clear, location: min(1, max(0, phase + 0.2)))
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .mask(Text(text).font(font))
            }
            .foregroundStyle(baseColor)
            .task {
                withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: false)) {
                    phase = 1.5
                }
            }
    }
}

// MARK: - Marquee
// Horizontal infinite scroller. Duplicates content so loop is seamless.

struct Marquee: View {
    let items: [String]
    let speed: Double
    let font: Font
    let color: Color

    @State private var offset: CGFloat = 0
    @State private var contentWidth: CGFloat = 0

    init(
        items: [String],
        speed: Double = 20,
        font: Font = .system(size: 13, weight: .medium),
        color: Color = Theme.Colors.mutedForeground.opacity(0.35)
    ) {
        self.items = items
        self.speed = speed
        self.font = font
        self.color = color
    }

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 0) {
                row
                    .background(
                        GeometryReader { inner in
                            Color.clear.preference(key: WidthKey.self, value: inner.size.width)
                        }
                    )
                row
            }
            .offset(x: offset)
            .onPreferenceChange(WidthKey.self) { width in
                contentWidth = width
                guard width > 0 else { return }
                offset = 0
                withAnimation(.linear(duration: speed).repeatForever(autoreverses: false)) {
                    offset = -width
                }
            }
            .frame(width: geo.size.width, alignment: .leading)
        }
        .frame(height: 20)
        .clipped()
        .allowsHitTesting(false)
    }

    private var row: some View {
        HStack(spacing: Theme.Spacing.lg) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                Text(item)
                    .font(font)
                    .foregroundStyle(color)
                Text("•")
                    .foregroundStyle(color)
            }
        }
        .fixedSize()
    }

    private struct WidthKey: PreferenceKey {
        static var defaultValue: CGFloat = 0
        static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
            value = nextValue()
        }
    }
}

// MARK: - BreathingRipple
// Soft expanding circles for the Recover card's ambient background.

struct BreathingRipple: View {
    var color: Color = Theme.Colors.sage
    var count: Int = 3
    var duration: Double = 4

    var body: some View {
        TimelineView(.animation) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate
            ZStack {
                ForEach(0..<count, id: \.self) { i in
                    let stagger = Double(i) / Double(count)
                    let local = (t / duration + stagger).truncatingRemainder(dividingBy: 1)
                    Circle()
                        .stroke(color.opacity(0.35 * (1 - local)), lineWidth: 1)
                        .scaleEffect(0.3 + CGFloat(local) * 1.7)
                }
            }
        }
        .allowsHitTesting(false)
    }
}

// MARK: - PulsingDot
// Small pulsing indicator dot — used for "live" or "due" badges.

struct PulsingDot: View {
    var color: Color = Theme.Colors.sage
    var size: CGFloat = 8

    @State private var pulse = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.4))
                .frame(width: size * 2, height: size * 2)
                .scaleEffect(pulse ? 1.3 : 0.8)
                .opacity(pulse ? 0 : 0.6)
            Circle()
                .fill(color)
                .frame(width: size, height: size)
        }
        .task {
            withAnimation(.easeOut(duration: 1.6).repeatForever(autoreverses: false)) {
                pulse = true
            }
        }
    }
}
