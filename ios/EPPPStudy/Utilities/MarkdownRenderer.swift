import SwiftUI

struct MarkdownRenderer: View {
    let markdown: String

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 12) {
                ForEach(Array(parseBlocks().enumerated()), id: \.offset) { _, block in
                    renderBlock(block)
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Block Types

    private enum Block {
        case heading1(String)
        case heading2(String)
        case heading3(String)
        case paragraph(String)
        case bulletList([String])
        case numberedList([String])
        case codeBlock(String)
        case blockquote(String)
        case divider
    }

    // MARK: - Parsing

    private func parseBlocks() -> [Block] {
        var blocks: [Block] = []
        let lines = markdown.components(separatedBy: "\n")
        var i = 0

        while i < lines.count {
            let line = lines[i]
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            if trimmed.isEmpty {
                i += 1
                continue
            }

            if trimmed.hasPrefix("# ") {
                blocks.append(.heading1(String(trimmed.dropFirst(2))))
                i += 1
            } else if trimmed.hasPrefix("## ") {
                blocks.append(.heading2(String(trimmed.dropFirst(3))))
                i += 1
            } else if trimmed.hasPrefix("### ") {
                blocks.append(.heading3(String(trimmed.dropFirst(4))))
                i += 1
            } else if trimmed.hasPrefix("```") {
                var code: [String] = []
                i += 1
                while i < lines.count && !lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("```") {
                    code.append(lines[i])
                    i += 1
                }
                blocks.append(.codeBlock(code.joined(separator: "\n")))
                i += 1
            } else if trimmed.hasPrefix("> ") {
                var quoteLines: [String] = []
                while i < lines.count && lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("> ") {
                    quoteLines.append(String(lines[i].trimmingCharacters(in: .whitespaces).dropFirst(2)))
                    i += 1
                }
                blocks.append(.blockquote(quoteLines.joined(separator: " ")))
            } else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                var items: [String] = []
                while i < lines.count {
                    let l = lines[i].trimmingCharacters(in: .whitespaces)
                    if l.hasPrefix("- ") || l.hasPrefix("* ") {
                        items.append(String(l.dropFirst(2)))
                        i += 1
                    } else {
                        break
                    }
                }
                blocks.append(.bulletList(items))
            } else if trimmed.first?.isNumber == true && trimmed.contains(". ") {
                var items: [String] = []
                while i < lines.count {
                    let l = lines[i].trimmingCharacters(in: .whitespaces)
                    if let dotIndex = l.firstIndex(of: "."),
                       l[l.startIndex..<dotIndex].allSatisfy(\.isNumber),
                       l.index(after: dotIndex) < l.endIndex,
                       l[l.index(after: dotIndex)] == " " {
                        items.append(String(l[l.index(dotIndex, offsetBy: 2)...]))
                        i += 1
                    } else {
                        break
                    }
                }
                blocks.append(.numberedList(items))
            } else if trimmed == "---" || trimmed == "***" {
                blocks.append(.divider)
                i += 1
            } else {
                var paragraph: [String] = []
                while i < lines.count {
                    let l = lines[i].trimmingCharacters(in: .whitespaces)
                    if l.isEmpty || l.hasPrefix("#") || l.hasPrefix("```") || l.hasPrefix("> ")
                        || l.hasPrefix("- ") || l.hasPrefix("* ") || l == "---" || l == "***" {
                        break
                    }
                    paragraph.append(l)
                    i += 1
                }
                blocks.append(.paragraph(paragraph.joined(separator: " ")))
            }
        }

        return blocks
    }

    // MARK: - Rendering

    @ViewBuilder
    private func renderBlock(_ block: Block) -> some View {
        switch block {
        case .heading1(let text):
            Text(text)
                .font(.title.bold())
                .foregroundStyle(.primary)
                .padding(.top, 8)

        case .heading2(let text):
            Text(text)
                .font(.title2.bold())
                .foregroundStyle(.primary)
                .padding(.top, 6)

        case .heading3(let text):
            Text(text)
                .font(.title3.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(.top, 4)

        case .paragraph(let text):
            Text(applyInlineFormatting(text))
                .font(.body)
                .foregroundStyle(.secondary)
                .lineSpacing(4)

        case .bulletList(let items):
            VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\u{2022}")
                            .font(.body.bold())
                            .foregroundStyle(.secondary)
                        Text(applyInlineFormatting(item))
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .lineSpacing(3)
                    }
                }
            }

        case .numberedList(let items):
            VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\(index + 1).")
                            .font(.body.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 24, alignment: .trailing)
                        Text(applyInlineFormatting(item))
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .lineSpacing(3)
                    }
                }
            }

        case .codeBlock(let code):
            Text(code)
                .font(.system(.callout, design: .monospaced))
                .foregroundStyle(.primary)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 8))

        case .blockquote(let text):
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.accentColor.opacity(0.6))
                    .frame(width: 3)
                Text(applyInlineFormatting(text))
                    .font(.body.italic())
                    .foregroundStyle(.secondary)
                    .lineSpacing(3)
            }
            .padding(.vertical, 4)

        case .divider:
            Divider()
                .padding(.vertical, 4)
        }
    }

    private func applyInlineFormatting(_ text: String) -> AttributedString {
        // Use iOS built-in markdown parsing for inline formatting
        if let attributed = try? AttributedString(markdown: text) {
            return attributed
        }
        return AttributedString(text)
    }
}

#Preview {
    MarkdownRenderer(markdown: """
    # Biological Bases of Behavior

    ## The Nervous System

    The nervous system is divided into two main parts:

    - **Central Nervous System (CNS)**: Brain and spinal cord
    - **Peripheral Nervous System (PNS)**: All nerves outside the CNS

    ### Key Concepts

    1. Neurons transmit electrical signals
    2. Neurotransmitters cross the synaptic gap
    3. The brain has remarkable plasticity

    > Understanding neuroanatomy is essential for the EPPP.

    ---

    This section covers approximately **12%** of the exam.
    """)
    .preferredColorScheme(.dark)
}
