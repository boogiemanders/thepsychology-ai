import SwiftUI

struct ExamSessionView: View {
    let exam: Exam

    @Environment(LocalStore.self) private var localStore
    @Environment(SyncEngine.self) private var syncEngine
    @Environment(ContentManager.self) private var contentManager
    @Environment(\.dismiss) private var dismiss

    @State private var session: ExamSession?
    @State private var showModeSelection = true
    @State private var questionStartTime = Date()
    @State private var timerSeconds = 0
    @State private var timer: Timer?
    @State private var showResults = false

    private var currentQuestion: Question? {
        guard let session, session.currentQuestionIndex < exam.questions.count else { return nil }
        return exam.questions[session.currentQuestionIndex]
    }

    var body: some View {
        Group {
            if showModeSelection {
                modeSelectionView
            } else if showResults, let session {
                ExamResultsView(result: buildResult(from: session))
            } else if let session, let question = currentQuestion {
                VStack(spacing: 0) {
                    // Timer bar for test mode
                    if session.mode == .test {
                        timerBar
                    }

                    QuestionView(
                        question: question,
                        questionNumber: session.currentQuestionIndex + 1,
                        totalQuestions: exam.questions.count,
                        mode: session.mode,
                        selectedChoiceId: session.answers.first(where: { $0.questionId == question.id })?.selectedChoiceId,
                        isFlagged: session.flaggedQuestionIds.contains(question.id),
                        onSelectChoice: { choiceId in
                            answerQuestion(choiceId: choiceId)
                        },
                        onToggleFlag: {
                            toggleFlag(questionId: question.id)
                        }
                    )

                    // Navigation
                    navigationBar
                }
            }
        }
        .navigationTitle(exam.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Mode Selection

    private var modeSelectionView: some View {
        VStack(spacing: 24) {
            Spacer()

            Text(exam.title)
                .font(.title2.bold())
                .foregroundStyle(.white)

            Text("\(exam.questionCount) questions")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()

            VStack(spacing: 12) {
                modeButton(
                    title: "Study Mode",
                    subtitle: "See answer after each question",
                    icon: "book",
                    mode: .study
                )

                modeButton(
                    title: "Test Mode",
                    subtitle: "Timed, see all results at end",
                    icon: "timer",
                    mode: .test
                )
            }
            .padding(.horizontal)
            .padding(.bottom, 32)
        }
    }

    private func modeButton(title: String, subtitle: String, icon: String, mode: ExamSession.ExamMode) -> some View {
        Button {
            startExam(mode: mode)
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3)
                    .frame(width: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .foregroundStyle(.white)
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Timer

    private var timerBar: some View {
        HStack {
            Image(systemName: "timer")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(formatTime(timerSeconds))
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)
            Spacer()
            if let session {
                let flagCount = session.flaggedQuestionIds.count
                if flagCount > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "flag.fill")
                            .foregroundStyle(.orange)
                        Text("\(flagCount)")
                            .foregroundStyle(.orange)
                    }
                    .font(.caption)
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }

    // MARK: - Navigation

    private var navigationBar: some View {
        HStack {
            Button {
                guard var session, session.currentQuestionIndex > 0 else { return }
                session.currentQuestionIndex -= 1
                self.session = session
                questionStartTime = Date()
            } label: {
                Image(systemName: "chevron.left")
                    .frame(width: 44, height: 44)
            }
            .disabled(session?.currentQuestionIndex == 0)

            Spacer()

            if let session {
                // Question dots
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 4) {
                        ForEach(0..<exam.questions.count, id: \.self) { index in
                            let answered = session.answers.contains { $0.questionId == exam.questions[index].id }
                            let isCurrent = index == session.currentQuestionIndex
                            Circle()
                                .fill(isCurrent ? Color.white : answered ? Color(.systemGray4) : Color(.systemGray6))
                                .frame(width: 8, height: 8)
                        }
                    }
                }
            }

            Spacer()

            if let session, session.currentQuestionIndex == exam.questions.count - 1 {
                Button("Finish") {
                    finishExam()
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .frame(height: 44)
            } else {
                Button {
                    advanceQuestion()
                } label: {
                    Image(systemName: "chevron.right")
                        .frame(width: 44, height: 44)
                }
            }
        }
        .foregroundStyle(.white)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6).opacity(0.5))
    }

    // MARK: - Logic

    private func startExam(mode: ExamSession.ExamMode) {
        session = ExamSession(
            id: UUID().uuidString,
            examId: exam.id,
            userId: "",
            mode: mode,
            startedAt: Date(),
            completedAt: nil,
            answers: [],
            flaggedQuestionIds: [],
            currentQuestionIndex: 0
        )
        showModeSelection = false
        questionStartTime = Date()

        if mode == .test {
            timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
                timerSeconds += 1
            }
        }
    }

    private func answerQuestion(choiceId: String) {
        guard var session, let question = currentQuestion else { return }
        let timeSpent = Int(Date().timeIntervalSince(questionStartTime))

        // Remove previous answer for this question if exists
        session.answers.removeAll { $0.questionId == question.id }

        let answer = ExamSession.Answer(
            questionId: question.id,
            selectedChoiceId: choiceId,
            isCorrect: choiceId == question.correctChoiceId,
            timeSpentSeconds: timeSpent,
            answeredAt: Date()
        )
        session.answers.append(answer)
        self.session = session
    }

    private func toggleFlag(questionId: String) {
        guard var session else { return }
        if session.flaggedQuestionIds.contains(questionId) {
            session.flaggedQuestionIds.remove(questionId)
        } else {
            session.flaggedQuestionIds.insert(questionId)
        }
        self.session = session
    }

    private func advanceQuestion() {
        guard var session, session.currentQuestionIndex < exam.questions.count - 1 else { return }
        session.currentQuestionIndex += 1
        self.session = session
        questionStartTime = Date()
    }

    private func finishExam() {
        guard var session else { return }
        session.completedAt = Date()
        self.session = session
        timer?.invalidate()

        let result = buildResult(from: session)
        localStore.saveExamResult(result)
        syncEngine.enqueueExamResult(result)

        // Run adaptive study path: priority engine + SRS + auto-downloads
        let studyPath = StudyPathManager(localStore: localStore, contentManager: contentManager)
        let capturedSession = session
        Task {
            await studyPath.processExamCompletion(
                session: capturedSession,
                exam: exam,
                result: result
            )
        }

        showResults = true
    }

    private func buildResult(from session: ExamSession) -> ExamResult {
        let answered = session.answers.filter { $0.selectedChoiceId != nil }
        let correct = answered.filter(\.isCorrect)

        // Compute domain scores
        var domainCorrect: [String: Int] = [:]
        var domainTotal: [String: Int] = [:]
        for question in exam.questions {
            domainTotal[question.domain, default: 0] += 1
            if let answer = session.answers.first(where: { $0.questionId == question.id }),
               answer.isCorrect {
                domainCorrect[question.domain, default: 0] += 1
            }
        }

        let domainScores = domainTotal.map { domain, total in
            ExamResult.DomainScore(
                domain: domain,
                correct: domainCorrect[domain] ?? 0,
                total: total
            )
        }

        let weakAreas = domainScores
            .filter { $0.percentage < 0.5 }
            .map(\.domain)

        // Get recommended lessons from priority engine
        let recommendations = PriorityEngine.buildRecommendations(
            session: session,
            exam: exam,
            manifest: contentManager.manifest
        )
        let recommendedLessons = recommendations.flatMap(\.recommendedLessonSlugs)

        return ExamResult(
            id: UUID().uuidString,
            examId: exam.id,
            sessionId: session.id,
            userId: session.userId,
            mode: session.mode,
            score: answered.isEmpty ? 0 : Double(correct.count) / Double(answered.count),
            correctCount: correct.count,
            totalQuestions: exam.questions.count,
            totalTimeSeconds: timerSeconds > 0 ? timerSeconds : Int(Date().timeIntervalSince(session.startedAt)),
            domainScores: domainScores,
            completedAt: Date(),
            weakAreas: weakAreas,
            recommendedLessons: recommendedLessons
        )
    }

    private func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}
