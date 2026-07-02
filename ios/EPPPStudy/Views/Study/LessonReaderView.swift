import SwiftUI

/// Native lesson reader — replaces the `/topic-teacher` WKWebView.
/// Fetches the same markdown the site renders (`/api/get-topic-content`)
/// and renders it natively: serif body like the web's Merriweather lesson
/// text, sans-serif headings, themed tables. A coral pill CTA at the bottom
/// launches the native topic quiz.
struct LessonReaderView: View {
    let domainId: String
    let topicName: String
    var onDismiss: (() -> Void)?

    @State private var blocks: [LessonBlock] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading {
                loadingView
            } else if let error = errorMessage {
                errorView(error)
            } else {
                content
            }
        }
        .background(Theme.Colors.background.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(topicName)
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(Theme.Colors.foreground)
                    .lineLimit(1)
            }
        }
        .onDisappear { onDismiss?() }
        .task { await loadLesson() }
    }

    // MARK: - Content

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                Text(topicName)
                    .font(Theme.Typography.title)
                    .foregroundStyle(Theme.Colors.foreground)
                    .padding(.top, Theme.Spacing.sm)

                ForEach(blocks) { block in
                    LessonBlockView(block: block)
                }
            }
            .padding(.horizontal, Theme.Spacing.lg)
            .padding(.bottom, 96) // clear the floating quiz CTA
        }
        .safeAreaInset(edge: .bottom) {
            quizCTA
        }
    }

    private var quizCTA: some View {
        NavigationLink {
            NativeQuizView(topicName: topicName, domainId: domainId)
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: "checkmark.circle")
                Text("Quiz Me on This Topic")
            }
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(Theme.Colors.accent)
            .clipShape(Capsule())
            .shadow(color: Theme.Colors.cardShadow, radius: 8, y: 3)
        }
        .padding(.horizontal, Theme.Spacing.lg)
        .padding(.bottom, Theme.Spacing.sm)
    }

    // MARK: - Loading / error

    private var loadingView: some View {
        VStack(spacing: Theme.Spacing.md) {
            ProgressView()
                .tint(Theme.Colors.accent)
            Text("Loading lesson...")
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: Theme.Spacing.lg) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 40))
                .foregroundStyle(Theme.Colors.coral)
            Text(message)
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
                .multilineTextAlignment(.center)
            Button {
                Task { await loadLesson() }
            } label: {
                Text("Try Again")
            }
            .buttonStyle(PillButtonStyle())
        }
        .padding(Theme.Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Fetch

    private func loadLesson() async {
        isLoading = true
        errorMessage = nil

        do {
            var components = URLComponents(string: "\(Self.baseURL)/api/get-topic-content")!
            components.queryItems = [
                URLQueryItem(name: "topicName", value: topicName),
                URLQueryItem(name: "domain", value: domainId),
            ]
            guard let url = components.url else { throw URLError(.badURL) }

            var request = URLRequest(url: url)
            request.timeoutInterval = 30
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoded = try JSONDecoder().decode(TopicContentResponse.self, from: data)
            let markdown = decoded.baseContent ?? decoded.content ?? ""
            guard !markdown.isEmpty else { throw URLError(.cannotDecodeContentData) }

            blocks = LessonMarkdown.parse(markdown)
            isLoading = false
        } catch {
            errorMessage = "Couldn't load this lesson. Check your connection."
            isLoading = false
        }
    }

    private static var baseURL: String {
        #if DEBUG
        "http://localhost:3000"
        #else
        "https://thepsychology.ai"
        #endif
    }
}

// MARK: - Response model

private struct TopicContentResponse: Codable {
    let success: Bool?
    let baseContent: String?
    let content: String?
}

// MARK: - Markdown blocks

enum LessonBlock: Identifiable {
    case heading2(String)
    case heading3(String)
    case paragraph(String)
    case bullets([String])
    case numbered([String])
    case table(header: [String], rows: [[String]])

    var id: String {
        switch self {
        case .heading2(let t): return "h2-\(t)"
        case .heading3(let t): return "h3-\(t)"
        case .paragraph(let t): return "p-\(t.prefix(48))-\(t.count)"
        case .bullets(let items): return "ul-\(items.first?.prefix(32) ?? "")-\(items.count)"
        case .numbered(let items): return "ol-\(items.first?.prefix(32) ?? "")-\(items.count)"
        case .table(let header, let rows): return "tbl-\(header.joined())-\(rows.count)"
        }
    }
}

enum LessonMarkdown {

    static func parse(_ raw: String) -> [LessonBlock] {
        let cleaned = preprocess(raw)
        var blocks: [LessonBlock] = []
        var paragraph: [String] = []
        var bullets: [String] = []
        var numbered: [String] = []
        var tableLines: [String] = []

        func flushParagraph() {
            if !paragraph.isEmpty {
                blocks.append(.paragraph(paragraph.joined(separator: " ")))
                paragraph = []
            }
        }
        func flushLists() {
            if !bullets.isEmpty { blocks.append(.bullets(bullets)); bullets = [] }
            if !numbered.isEmpty { blocks.append(.numbered(numbered)); numbered = [] }
        }
        func flushTable() {
            guard tableLines.count >= 2 else { tableLines = []; return }
            let rows = tableLines.map(parseTableRow)
            let header = rows[0]
            // Row 2 is the |---|---| separator; keep only real data rows.
            let dataRows = rows.dropFirst(2).filter { !$0.isEmpty }
            blocks.append(.table(header: header, rows: Array(dataRows)))
            tableLines = []
        }
        func flushAll() {
            flushParagraph(); flushLists(); flushTable()
        }

        for rawLine in cleaned.components(separatedBy: "\n") {
            let line = rawLine.trimmingCharacters(in: .whitespaces)

            if line.isEmpty {
                flushAll()
            } else if line.hasPrefix("### ") {
                flushAll()
                blocks.append(.heading3(String(line.dropFirst(4))))
            } else if line.hasPrefix("## ") {
                flushAll()
                blocks.append(.heading2(String(line.dropFirst(3))))
            } else if line.hasPrefix("# ") {
                flushAll()
                blocks.append(.heading2(String(line.dropFirst(2))))
            } else if line.hasPrefix("|") {
                flushParagraph(); flushLists()
                tableLines.append(line)
            } else if line.hasPrefix("- ") || line.hasPrefix("* ") {
                flushParagraph(); flushTable()
                bullets.append(String(line.dropFirst(2)))
            } else if let item = numberedItem(line) {
                flushParagraph(); flushTable()
                numbered.append(item)
            } else {
                flushLists(); flushTable()
                paragraph.append(line)
            }
        }
        flushAll()
        return blocks
    }

    /// Strip web-only markers: {{M}}metaphor{{/M}} keeps its text,
    /// {{PERSONALIZED_EXAMPLES}} placeholders drop entirely.
    private static func preprocess(_ raw: String) -> String {
        raw
            .replacingOccurrences(of: "{{M}}", with: "")
            .replacingOccurrences(of: "{{/M}}", with: "")
            .replacingOccurrences(of: "{{PERSONALIZED_EXAMPLES}}", with: "")
    }

    private static func numberedItem(_ line: String) -> String? {
        guard let dotIndex = line.firstIndex(of: "."),
              line.distance(from: line.startIndex, to: dotIndex) <= 3,
              Int(line[line.startIndex..<dotIndex]) != nil else { return nil }
        let after = line.index(after: dotIndex)
        guard after < line.endIndex, line[after] == " " else { return nil }
        return String(line[line.index(after, offsetBy: 1)...])
    }

    private static func parseTableRow(_ line: String) -> [String] {
        line
            .trimmingCharacters(in: CharacterSet(charactersIn: "|"))
            .components(separatedBy: "|")
            .map { $0.trimmingCharacters(in: .whitespaces) }
    }

    /// Inline markdown (bold/italic/code) via AttributedString; falls back to plain.
    static func inline(_ text: String) -> AttributedString {
        (try? AttributedString(
            markdown: text,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        )) ?? AttributedString(text)
    }
}

// MARK: - Block renderer

private struct LessonBlockView: View {
    let block: LessonBlock

    var body: some View {
        switch block {
        case .heading2(let text):
            Text(LessonMarkdown.inline(text))
                .font(Theme.Typography.heading)
                .foregroundStyle(Theme.Colors.foreground)
                .padding(.top, Theme.Spacing.sm)

        case .heading3(let text):
            Text(LessonMarkdown.inline(text))
                .font(Theme.Typography.subheading)
                .foregroundStyle(Theme.Colors.foreground)
                .padding(.top, Theme.Spacing.xs)

        case .paragraph(let text):
            Text(LessonMarkdown.inline(text))
                .font(Theme.Typography.lessonBody)
                .foregroundStyle(Theme.Colors.foreground)
                .lineSpacing(6)

        case .bullets(let items):
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                        Circle()
                            .fill(Theme.Colors.accent)
                            .frame(width: 5, height: 5)
                            .padding(.top, 8)
                        Text(LessonMarkdown.inline(item))
                            .font(Theme.Typography.lessonBody)
                            .foregroundStyle(Theme.Colors.foreground)
                            .lineSpacing(5)
                    }
                }
            }

        case .numbered(let items):
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                        Text("\(index + 1).")
                            .font(Theme.Typography.callout.weight(.semibold))
                            .foregroundStyle(Theme.Colors.accent)
                            .frame(width: 22, alignment: .trailing)
                        Text(LessonMarkdown.inline(item))
                            .font(Theme.Typography.lessonBody)
                            .foregroundStyle(Theme.Colors.foreground)
                            .lineSpacing(5)
                    }
                }
            }

        case .table(let header, let rows):
            LessonTableView(header: header, rows: rows)
        }
    }
}

// MARK: - Table

private struct LessonTableView: View {
    let header: [String]
    let rows: [[String]]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                tableRow(cells: header, isHeader: true)
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    Divider().background(Theme.Colors.borderSubtle)
                    tableRow(cells: row, isHeader: false)
                }
            }
        }
        .background(Theme.Colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .stroke(Theme.Colors.border, lineWidth: 1)
        )
    }

    private func tableRow(cells: [String], isHeader: Bool) -> some View {
        HStack(alignment: .top, spacing: 0) {
            ForEach(Array(cells.enumerated()), id: \.offset) { _, cell in
                Text(LessonMarkdown.inline(cell))
                    .font(isHeader ? Theme.Typography.captionBold : Theme.Typography.caption)
                    .foregroundStyle(isHeader ? Theme.Colors.foreground : Theme.Colors.mutedForeground)
                    .frame(width: 132, alignment: .leading)
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.vertical, Theme.Spacing.sm)
            }
        }
        .background(isHeader ? Theme.Colors.cardElevated : Theme.Colors.card)
    }
}
