import SwiftUI

/// Native quiz replacing the WKWebView topic-teacher quiz.
/// Fetches questions from /api/quizzer, runs the quiz, then writes results
/// to /api/save-quiz-results + Supabase quiz_results (for progress display).
struct NativeQuizView: View {
    let topicName: String
    let domainId: String

    @Environment(AuthService.self) private var authService
    @Environment(QuizProgressService.self) private var quizProgress
    @Environment(\.dismiss) private var dismiss

    // Quiz state
    @State private var questions: [QuizzerQuestion] = []
    @State private var currentIndex = 0
    @State private var selectedAnswer: String?
    @State private var showExplanation = false
    @State private var correctCount = 0
    @State private var scoredCorrectCount = 0
    @State private var scoredTotal = 0
    @State private var answers: [QuizAnswer] = []
    @State private var questionStartTime: Date = .now
    @State private var quizStartTime: Date = .now

    // View state
    @State private var isLoading = true
    @State private var isComplete = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var ringProgress: CGFloat = 0

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            Group {
                if isLoading {
                    loadingView
                } else if let error = errorMessage {
                    errorView(error)
                } else if isComplete {
                    completionView
                } else if !questions.isEmpty {
                    questionContent
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(topicName)
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(Theme.Colors.foreground)
                    .lineLimit(1)
            }
            if !isComplete && !questions.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Text("\(currentIndex + 1)/\(questions.count)")
                        .font(Theme.Typography.small)
                        .foregroundStyle(Theme.Colors.dimForeground)
                        .monospacedDigit()
                }
            }
        }
        .task {
            quizStartTime = .now
            await loadQuestions()
        }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: Theme.Spacing.md) {
            ProgressView()
                .tint(Theme.Colors.sage)
            Text("Loading quiz...")
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
        }
    }

    // MARK: - Error

    private func errorView(_ message: String) -> some View {
        VStack(spacing: Theme.Spacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundStyle(Theme.Colors.coral)
            Text(message)
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
                .multilineTextAlignment(.center)
            Button {
                Task { await loadQuestions() }
            } label: {
                Text("Try Again")
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(Theme.Colors.foreground)
                    .padding(.horizontal, Theme.Spacing.xl)
                    .padding(.vertical, Theme.Spacing.md)
            }
            .themedCard(padding: 0, radius: Theme.Radius.md)
        }
        .padding(Theme.Spacing.xl)
    }

    // MARK: - Question

    private var questionContent: some View {
        let question = questions[currentIndex]

        return ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                progressBar

                Text(question.question)
                    .font(Theme.Typography.question)
                    .foregroundStyle(Theme.Colors.foreground)
                    .lineSpacing(6)

                if question.isScored == false {
                    HStack(spacing: Theme.Spacing.xs) {
                        Image(systemName: "flask")
                            .font(.system(size: 10))
                        Text("Experimental")
                            .font(Theme.Typography.small)
                    }
                    .foregroundStyle(Theme.Colors.dimForeground)
                }

                VStack(spacing: Theme.Spacing.md) {
                    ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                        optionButton(option, label: Self.labels[index], question: question)
                    }
                }

                if showExplanation {
                    explanationSection(question)
                }
            }
            .padding(Theme.Spacing.lg)
        }
        .animation(.easeInOut(duration: 0.25), value: showExplanation)
    }

    // MARK: - Progress bar

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Theme.Colors.cardElevated)
                RoundedRectangle(cornerRadius: 2)
                    .fill(Theme.Colors.sage)
                    .frame(width: geo.size.width * CGFloat(currentIndex) / CGFloat(max(questions.count, 1)))
                    .animation(.easeInOut(duration: 0.3), value: currentIndex)
            }
        }
        .frame(height: 3)
    }

    // MARK: - Option button

    private func optionButton(_ option: String, label: String, question: QuizzerQuestion) -> some View {
        let isSelected = selectedAnswer == option
        let isCorrect = option == question.correctAnswer
        let revealed = showExplanation

        return Button {
            guard !showExplanation else { return }
            selectAnswer(option, question: question)
        } label: {
            HStack(alignment: .top, spacing: Theme.Spacing.md) {
                Text(label)
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(labelColor(isSelected: isSelected, isCorrect: isCorrect, revealed: revealed))
                    .frame(width: 24)

                Text(Self.stripPrefix(option))
                    .font(Theme.Typography.callout)
                    .foregroundStyle(Theme.Colors.foreground)
                    .multilineTextAlignment(.leading)

                Spacer()

                if revealed && isCorrect {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Theme.Colors.olive)
                } else if revealed && isSelected && !isCorrect {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Theme.Colors.coral)
                }
            }
            .padding(14)
            .background(optionBG(isSelected: isSelected, isCorrect: isCorrect, revealed: revealed))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.md))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .stroke(optionStroke(isSelected: isSelected, isCorrect: isCorrect, revealed: revealed), lineWidth: 1)
            )
        }
        .disabled(showExplanation)
    }

    // MARK: - Explanation

    private func explanationSection(_ question: QuizzerQuestion) -> some View {
        let wasCorrect = selectedAnswer == question.correctAnswer

        return VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Divider().background(Theme.Colors.borderSubtle)

            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: wasCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundStyle(wasCorrect ? Theme.Colors.olive : Theme.Colors.coral)
                Text(wasCorrect ? "Correct" : "Incorrect")
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(wasCorrect ? Theme.Colors.olive : Theme.Colors.coral)
            }

            Text(question.explanation)
                .font(Theme.Typography.callout)
                .foregroundStyle(Theme.Colors.mutedForeground)
                .lineSpacing(3)

            Button(action: advanceToNext) {
                Text(currentIndex < questions.count - 1 ? "Next Question" : "See Results")
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Theme.Colors.accent)
                    .clipShape(Capsule())
            }
            .padding(.top, Theme.Spacing.sm)
        }
        .transition(.opacity.combined(with: .move(edge: .bottom)))
    }

    // MARK: - Completion

    private var completionView: some View {
        VStack(spacing: Theme.Spacing.xl) {
            Spacer()

            ZStack {
                Circle()
                    .stroke(Theme.Colors.cardElevated, lineWidth: 6)
                    .frame(width: 140, height: 140)
                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(scoreColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .frame(width: 140, height: 140)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 2) {
                    Text("\(percentage)%")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(scoreColor)
                        .monospacedDigit()
                    Text("\(scoredCorrectCount)/\(scoredTotal)")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Colors.mutedForeground)
                        .monospacedDigit()
                }
            }
            .onAppear {
                withAnimation(.easeOut(duration: 0.8).delay(0.2)) {
                    ringProgress = CGFloat(percentage) / 100
                }
            }

            Text(scoreMessage)
                .font(Theme.Typography.subheading)
                .foregroundStyle(Theme.Colors.mutedForeground)

            if isSaving {
                HStack(spacing: Theme.Spacing.sm) {
                    ProgressView()
                        .tint(Theme.Colors.sage)
                        .scaleEffect(0.8)
                    Text("Saving...")
                        .font(Theme.Typography.caption)
                        .foregroundStyle(Theme.Colors.dimForeground)
                }
            }

            Spacer()

            Button(action: { dismiss() }) {
                Text("Done")
                    .font(Theme.Typography.captionBold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Theme.Colors.accent)
                    .clipShape(Capsule())
            }
            .padding(.horizontal, Theme.Spacing.lg)
            .padding(.bottom, Theme.Spacing.xxl)
        }
    }

    // MARK: - Colors

    private func labelColor(isSelected: Bool, isCorrect: Bool, revealed: Bool) -> Color {
        if revealed && isCorrect { return Theme.Colors.olive }
        if revealed && isSelected && !isCorrect { return Theme.Colors.coral }
        if isSelected { return Theme.Colors.foreground }
        return Theme.Colors.dimForeground
    }

    private func optionBG(isSelected: Bool, isCorrect: Bool, revealed: Bool) -> Color {
        if revealed && isCorrect { return Theme.Colors.olive.opacity(0.1) }
        if revealed && isSelected && !isCorrect { return Theme.Colors.coral.opacity(0.1) }
        if isSelected { return Theme.Colors.cardElevated }
        return Theme.Colors.card
    }

    private func optionStroke(isSelected: Bool, isCorrect: Bool, revealed: Bool) -> Color {
        if revealed && isCorrect { return Theme.Colors.olive.opacity(0.3) }
        if revealed && isSelected && !isCorrect { return Theme.Colors.coral.opacity(0.3) }
        if isSelected { return Theme.Colors.sage.opacity(0.3) }
        return Theme.Colors.borderSubtle
    }

    private var scoreColor: Color {
        if percentage >= 70 { return Theme.Colors.olive }
        if percentage >= 50 { return Theme.Colors.sage }
        return Theme.Colors.coral
    }

    private var percentage: Int {
        guard scoredTotal > 0 else { return 0 }
        return Int(round(Double(scoredCorrectCount) / Double(scoredTotal) * 100))
    }

    private var scoreMessage: String {
        if percentage >= 80 { return "Excellent work" }
        if percentage >= 70 { return "Good job" }
        if percentage >= 50 { return "Keep practicing" }
        return "Review this material"
    }

    private static let labels = ["A", "B", "C", "D", "E", "F"]

    /// Strip leading letter prefix like "A. " to avoid doubling
    /// when the renderer already adds its own letter labels.
    private static func stripPrefix(_ text: String) -> String {
        text.replacingOccurrences(of: "^[A-Ha-h]\\.\\s*", with: "", options: .regularExpression)
    }

    // MARK: - Logic

    private func selectAnswer(_ answer: String, question: QuizzerQuestion) {
        selectedAnswer = answer
        let isCorrect = answer == question.correctAnswer
        let isScored = question.isScored ?? true

        if isCorrect { correctCount += 1 }
        if isScored {
            scoredTotal += 1
            if isCorrect { scoredCorrectCount += 1 }
        }

        let timeSpent = Date.now.timeIntervalSince(questionStartTime)
        answers.append(QuizAnswer(
            questionId: "\(question.id)",
            question: question.question,
            options: question.options,
            selectedAnswer: answer,
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect,
            isScored: isScored,
            relatedSections: question.relatedSections,
            timeSpentMs: Int(timeSpent * 1000)
        ))

        withAnimation(.easeInOut(duration: 0.2)) {
            showExplanation = true
        }
    }

    private func advanceToNext() {
        if currentIndex < questions.count - 1 {
            currentIndex += 1
            selectedAnswer = nil
            showExplanation = false
            questionStartTime = .now
        } else {
            isComplete = true
            Task { await saveResults() }
        }
    }

    // MARK: - API

    private func loadQuestions() async {
        isLoading = true
        errorMessage = nil

        do {
            guard let url = URL(string: "\(Self.baseURL)/api/quizzer") else {
                throw QuizError.badURL
            }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 30

            let body: [String: String] = [
                "topic": topicName,
                "domain": domainId,
                "userId": authService.currentUserId ?? "",
            ]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)

            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw QuizError.serverError
            }

            let decoded = try JSONDecoder().decode(QuizzerResponse.self, from: data)
            guard !decoded.questions.isEmpty else {
                throw QuizError.noQuestions
            }

            questions = decoded.questions
            questionStartTime = .now
            isLoading = false
        } catch QuizError.noQuestions {
            errorMessage = "No questions available for this topic yet."
            isLoading = false
        } catch {
            errorMessage = "Couldn't load quiz. Check your connection."
            isLoading = false
        }
    }

    private func saveResults() async {
        guard let userId = authService.currentUserId else { return }
        isSaving = true
        defer { isSaving = false }

        let durationSeconds = Int(Date.now.timeIntervalSince(quizStartTime))

        // 1. Detailed results -> /api/save-quiz-results
        await saveDetailedResults(userId: userId, durationSeconds: durationSeconds)

        // 2. Progress row -> Supabase quiz_results (drives progress bars)
        await saveProgressRow(userId: userId)

        // 3. Refresh so StudyView shows updated progress
        await quizProgress.refresh()
    }

    private func saveDetailedResults(userId: String, durationSeconds: Int) async {
        do {
            let token = try await authService.getAccessToken()
            guard let url = URL(string: "\(Self.baseURL)/api/save-quiz-results") else { return }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

            let payload = SaveQuizPayload(
                userId: userId,
                topic: topicName,
                domain: domainId,
                score: scoredCorrectCount,
                totalQuestions: questions.count,
                correctQuestions: correctCount,
                durationSeconds: durationSeconds,
                questionAttempts: answers.map { $0.asPayload() }
            )
            request.httpBody = try JSONEncoder().encode(payload)

            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, http.statusCode != 200 {
                print("[NativeQuiz] save-quiz-results failed: \(http.statusCode)")
            }
        } catch {
            print("[NativeQuiz] save-quiz-results error: \(error)")
        }
    }

    private func saveProgressRow(userId: String) async {
        do {
            let token = try await authService.getAccessToken()
            guard let url = URL(string: "\(Constants.supabaseURL)/rest/v1/quiz_results") else { return }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue(Constants.supabaseAnonKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let wrongArr: [[String: Any]] = answers.filter { !$0.isCorrect }.map { a in
                [
                    "questionId": a.questionId as Any,
                    "question": a.question as Any,
                    "selectedAnswer": a.selectedAnswer as Any,
                    "correctAnswer": a.correctAnswer as Any,
                    "relatedSections": (a.relatedSections ?? []) as Any,
                ] as [String: Any]
            }
            let correctArr: [[String: Any]] = answers.filter { $0.isCorrect }.map { a in
                [
                    "questionId": a.questionId as Any,
                    "question": a.question as Any,
                    "correctAnswer": a.correctAnswer as Any,
                    "relatedSections": (a.relatedSections ?? []) as Any,
                ] as [String: Any]
            }

            let row: [String: Any] = [
                "user_id": userId,
                "topic_name": topicName,
                "domain_id": domainId,
                "score": correctCount,
                "total_questions": questions.count,
                "wrong_answers": wrongArr,
                "correct_answers": correctArr,
                "source": "ios",
                "completed_at": ISO8601DateFormatter().string(from: .now),
            ]
            request.httpBody = try JSONSerialization.data(withJSONObject: row)

            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, http.statusCode >= 300 {
                print("[NativeQuiz] quiz_results insert failed: \(http.statusCode)")
            }
        } catch {
            print("[NativeQuiz] quiz_results error: \(error)")
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

// MARK: - Private models

private struct QuizzerQuestion: Codable, Identifiable {
    let id: Int
    let question: String
    let options: [String]
    let correctAnswer: String
    let explanation: String
    let relatedSections: [String]?
    let isScored: Bool?
}

private struct QuizzerResponse: Codable {
    let questions: [QuizzerQuestion]
    let domainId: String?
}

private struct QuizAnswer {
    let questionId: String
    let question: String
    let options: [String]
    let selectedAnswer: String
    let correctAnswer: String
    let isCorrect: Bool
    let isScored: Bool
    let relatedSections: [String]?
    let timeSpentMs: Int

    func asPayload() -> SaveQuizPayload.Attempt {
        .init(
            questionId: questionId,
            question: question,
            options: options,
            selectedAnswer: selectedAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            isScored: isScored,
            relatedSections: relatedSections,
            timeSpentMs: timeSpentMs
        )
    }
}

private struct SaveQuizPayload: Encodable {
    let userId: String
    let topic: String
    let domain: String
    let score: Int
    let totalQuestions: Int
    let correctQuestions: Int
    let durationSeconds: Int
    let questionAttempts: [Attempt]

    struct Attempt: Encodable {
        let questionId: String
        let question: String
        let options: [String]
        let selectedAnswer: String
        let correctAnswer: String
        let isCorrect: Bool
        let isScored: Bool
        let relatedSections: [String]?
        let timeSpentMs: Int
    }
}

private enum QuizError: Error {
    case badURL
    case serverError
    case noQuestions
}
