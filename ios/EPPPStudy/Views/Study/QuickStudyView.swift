import SwiftUI

struct QuickStudyView: View {
    let mode: QuickStudyMode
    @Environment(APIClient.self) private var apiClient
    @Environment(LocalStore.self) private var localStore
    @Environment(\.dismiss) private var dismiss

    @State private var questions: [Question] = []
    @State private var currentIndex = 0
    @State private var selectedChoiceId: String?
    @State private var showExplanation = false
    @State private var correctCount = 0
    @State private var isLoading = true
    @State private var isComplete = false
    @State private var errorMessage: String?

    enum QuickStudyMode {
        case sprint // 5 questions
        case tenMinute // As many as possible in 10 minutes

        var questionCount: Int {
            switch self {
            case .sprint: return 5
            case .tenMinute: return 20
            }
        }

        var title: String {
            switch self {
            case .sprint: return "5-Question Sprint"
            case .tenMinute: return "10-Minute Mode"
            }
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading questions...")
                } else if isComplete {
                    completionView
                } else if let error = errorMessage {
                    errorView(error)
                } else if !questions.isEmpty {
                    questionContent
                } else {
                    Text("No questions available")
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle(mode.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(.secondary)
                }
                if !isComplete && !questions.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Text("\(currentIndex + 1)/\(questions.count)")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .task { await loadQuestions() }
    }

    // MARK: - Question Content

    private var questionContent: some View {
        let question = questions[currentIndex]

        return ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(.systemGray5))
                            .frame(height: 3)
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.white)
                            .frame(width: geo.size.width * Double(currentIndex) / Double(questions.count), height: 3)
                    }
                }
                .frame(height: 3)

                // Stem
                Text(question.stem)
                    .font(.body)
                    .foregroundStyle(.white)
                    .lineSpacing(4)

                // Choices
                VStack(spacing: 10) {
                    ForEach(question.choices) { choice in
                        choiceButton(choice, question: question)
                    }
                }

                // Explanation
                if showExplanation {
                    VStack(alignment: .leading, spacing: 8) {
                        Divider()
                        Text("Explanation")
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                        Text(question.explanation)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineSpacing(3)
                    }
                    .padding(.top, 8)

                    Button {
                        advanceToNext()
                    } label: {
                        Text(currentIndex < questions.count - 1 ? "Next Question" : "See Results")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.white)
                    .foregroundStyle(.black)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .padding(.top, 8)
                }
            }
            .padding()
        }
    }

    private func choiceButton(_ choice: Question.Choice, question: Question) -> some View {
        let isSelected = selectedChoiceId == choice.id
        let isCorrect = choice.id == question.correctChoiceId
        let showResult = showExplanation

        return Button {
            guard !showExplanation else { return }
            selectChoice(choice.id, question: question)
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Text(choice.label)
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(labelColor(isSelected: isSelected, isCorrect: isCorrect, showResult: showResult))
                    .frame(width: 24)

                Text(choice.text)
                    .font(.subheadline)
                    .foregroundStyle(.white)
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
            .background(choiceBackground(isSelected: isSelected, isCorrect: isCorrect, showResult: showResult))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(choiceBorder(isSelected: isSelected, isCorrect: isCorrect, showResult: showResult), lineWidth: 1)
            )
        }
        .disabled(showExplanation)
    }

    private func labelColor(isSelected: Bool, isCorrect: Bool, showResult: Bool) -> Color {
        if showResult && isCorrect { return .green }
        if showResult && isSelected && !isCorrect { return .red }
        if isSelected { return .white }
        return .secondary
    }

    private func choiceBackground(isSelected: Bool, isCorrect: Bool, showResult: Bool) -> Color {
        if showResult && isCorrect { return .green.opacity(0.1) }
        if showResult && isSelected && !isCorrect { return .red.opacity(0.1) }
        if isSelected { return Color(.systemGray5) }
        return Color(.systemGray6)
    }

    private func choiceBorder(isSelected: Bool, isCorrect: Bool, showResult: Bool) -> Color {
        if showResult && isCorrect { return .green.opacity(0.3) }
        if showResult && isSelected && !isCorrect { return .red.opacity(0.3) }
        if isSelected { return .white.opacity(0.2) }
        return Color.clear
    }

    // MARK: - Completion

    private var completionView: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("\(correctCount)/\(questions.count)")
                .font(.system(size: 56, weight: .bold, design: .rounded))
                .foregroundStyle(scoreColor)

            Text(scoreMessage)
                .font(.title3)
                .foregroundStyle(.secondary)

            Spacer()

            Button {
                dismiss()
            } label: {
                Text("Done")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
            }
            .buttonStyle(.borderedProminent)
            .tint(.white)
            .foregroundStyle(.black)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal)
            .padding(.bottom, 32)
        }
    }

    private var scoreColor: Color {
        let pct = Double(correctCount) / Double(max(questions.count, 1))
        if pct >= 0.7 { return .green }
        if pct >= 0.5 { return .yellow }
        return .red
    }

    private var scoreMessage: String {
        let pct = Double(correctCount) / Double(max(questions.count, 1))
        if pct >= 0.8 { return "Excellent work" }
        if pct >= 0.7 { return "Good job" }
        if pct >= 0.5 { return "Keep practicing" }
        return "Review this material"
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text(message)
                .foregroundStyle(.secondary)
            Button("Try Again") {
                Task { await loadQuestions() }
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - Logic

    private func loadQuestions() async {
        isLoading = true
        errorMessage = nil
        do {
            questions = try await apiClient.fetchQuickStudyQuestions(count: mode.questionCount)
            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    private func selectChoice(_ choiceId: String, question: Question) {
        selectedChoiceId = choiceId
        if choiceId == question.correctChoiceId {
            correctCount += 1
        }
        withAnimation(.easeInOut(duration: 0.2)) {
            showExplanation = true
        }
    }

    private func advanceToNext() {
        if currentIndex < questions.count - 1 {
            currentIndex += 1
            selectedChoiceId = nil
            showExplanation = false
        } else {
            isComplete = true
        }
    }
}

#Preview {
    QuickStudyView(mode: .sprint)
        .environment(APIClient(authService: AuthService()))
        .environment(LocalStore())
        .preferredColorScheme(.dark)
}
