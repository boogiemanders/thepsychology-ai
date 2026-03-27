import SwiftUI

struct QuestionView: View {
    let question: Question
    let questionNumber: Int
    let totalQuestions: Int
    let mode: ExamSession.ExamMode
    let selectedChoiceId: String?
    let isFlagged: Bool
    let onSelectChoice: (String) -> Void
    let onToggleFlag: () -> Void

    @State private var strikethroughChoices: Set<String> = []

    private var showResult: Bool {
        mode == .study && selectedChoiceId != nil
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                HStack {
                    Text("Question \(questionNumber) of \(totalQuestions)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Button {
                        onToggleFlag()
                    } label: {
                        Image(systemName: isFlagged ? "flag.fill" : "flag")
                            .foregroundStyle(isFlagged ? .orange : .secondary)
                    }
                }

                // Difficulty indicator
                HStack(spacing: 4) {
                    Circle()
                        .fill(difficultyColor)
                        .frame(width: 6, height: 6)
                    Text(question.difficulty.rawValue.capitalized)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                // Stem
                Text(question.stem)
                    .font(.body)
                    .foregroundStyle(.white)
                    .lineSpacing(4)

                // Choices
                VStack(spacing: 10) {
                    ForEach(question.choices) { choice in
                        choiceRow(choice)
                    }
                }

                // Explanation (study mode only)
                if showResult {
                    VStack(alignment: .leading, spacing: 8) {
                        Divider()

                        HStack(spacing: 6) {
                            Image(systemName: selectedChoiceId == question.correctChoiceId
                                  ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(selectedChoiceId == question.correctChoiceId ? .green : .red)
                            Text(selectedChoiceId == question.correctChoiceId ? "Correct" : "Incorrect")
                                .font(.subheadline.bold())
                                .foregroundStyle(selectedChoiceId == question.correctChoiceId ? .green : .red)
                        }

                        Text(question.explanation)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineSpacing(3)
                    }
                    .padding(.top, 4)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
            }
            .padding()
        }
        .animation(.easeInOut(duration: 0.25), value: showResult)
    }

    @ViewBuilder
    private func choiceRow(_ choice: Question.Choice) -> some View {
        let isSelected = selectedChoiceId == choice.id
        let isCorrect = choice.id == question.correctChoiceId
        let isStruck = strikethroughChoices.contains(choice.id)

        Button {
            if selectedChoiceId == nil && mode == .study {
                onSelectChoice(choice.id)
            } else if mode == .test {
                onSelectChoice(choice.id)
            }
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Text(choice.label)
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(choiceLabelColor(isSelected: isSelected, isCorrect: isCorrect))
                    .frame(width: 24)

                Text(choice.text)
                    .font(.subheadline)
                    .foregroundStyle(isStruck ? .secondary : .white)
                    .strikethrough(isStruck, color: .secondary)
                    .multilineTextAlignment(.leading)

                Spacer()

                if showResult && isCorrect {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                } else if showResult && isSelected && !isCorrect {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.red)
                }
            }
            .padding(14)
            .background(choiceBG(isSelected: isSelected, isCorrect: isCorrect))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(choiceStroke(isSelected: isSelected, isCorrect: isCorrect), lineWidth: 1)
            )
        }
        .contextMenu {
            Button {
                if strikethroughChoices.contains(choice.id) {
                    strikethroughChoices.remove(choice.id)
                } else {
                    strikethroughChoices.insert(choice.id)
                }
            } label: {
                Label(
                    isStruck ? "Remove strikethrough" : "Strikethrough",
                    systemImage: "strikethrough"
                )
            }
        }
    }

    private func choiceLabelColor(isSelected: Bool, isCorrect: Bool) -> Color {
        if showResult && isCorrect { return .green }
        if showResult && isSelected && !isCorrect { return .red }
        if isSelected { return .white }
        return .secondary
    }

    private func choiceBG(isSelected: Bool, isCorrect: Bool) -> Color {
        if showResult && isCorrect { return .green.opacity(0.1) }
        if showResult && isSelected && !isCorrect { return .red.opacity(0.1) }
        if isSelected { return Color(.systemGray5) }
        return Color(.systemGray6)
    }

    private func choiceStroke(isSelected: Bool, isCorrect: Bool) -> Color {
        if showResult && isCorrect { return .green.opacity(0.3) }
        if showResult && isSelected && !isCorrect { return .red.opacity(0.3) }
        if isSelected { return .white.opacity(0.2) }
        return .clear
    }

    private var difficultyColor: Color {
        switch question.difficulty {
        case .easy: return .green
        case .medium: return .yellow
        case .hard: return .red
        }
    }
}
