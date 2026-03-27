import Foundation

/// Ports review-queue.ts — SM-2 spaced repetition algorithm.
/// Manages on-device review scheduling for wrong answers.
enum ReviewScheduler {

    // MARK: - SM-2 Scheduling

    /// Compute next review schedule based on whether the answer was correct.
    /// Direct port of computeNextSchedule from review-queue.ts.
    static func computeNextSchedule(
        existing: ReviewItem?,
        wasCorrect: Bool,
        attemptedAt: Date
    ) -> (repetitions: Int, intervalDays: Int, easeFactor: Double, nextReviewAt: Date) {
        let existingReps = existing?.repetitions ?? 0
        let existingInterval = existing?.intervalDays ?? 0
        let existingEf = existing?.easeFactor ?? 2.5

        if !wasCorrect {
            // Wrong answer: reset repetitions, shrink ease factor, review tomorrow
            let easeFactor = clamp(existingEf - 0.2, min: 1.3, max: 2.7)
            let intervalDays = 1
            let nextReviewAt = attemptedAt.addingTimeInterval(Double(intervalDays) * 86400)
            return (0, intervalDays, easeFactor, nextReviewAt)
        }

        // Correct answer: advance repetitions, grow ease factor
        let nextRepetitions = existingReps + 1
        let easeFactor = clamp(existingEf + 0.1, min: 1.3, max: 2.7)

        let intervalDays: Int
        if nextRepetitions == 1 {
            intervalDays = 1
        } else if nextRepetitions == 2 {
            intervalDays = 6
        } else {
            intervalDays = max(Int((Double(max(existingInterval, 1)) * easeFactor).rounded()), 1)
        }

        let nextReviewAt = attemptedAt.addingTimeInterval(Double(intervalDays) * 86400)
        return (nextRepetitions, intervalDays, easeFactor, nextReviewAt)
    }

    // MARK: - Process Exam Answers

    /// Generate a stable question key from question text + choices + correct answer.
    /// Matches the web's computeQuestionKey logic for sync compatibility.
    static func computeQuestionKey(question: String, options: [String]?, correctAnswer: String?) -> String {
        var input = question.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if let options, !options.isEmpty {
            input += "|" + options.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.joined(separator: "|")
        }
        if let correctAnswer {
            input += "|" + correctAnswer.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        }

        // Simple hash — matches web's computeQuestionKey output format
        var hash: UInt64 = 5381
        for byte in input.utf8 {
            hash = ((hash &<< 5) &+ hash) &+ UInt64(byte)
        }
        return String(hash, radix: 36)
    }

    /// Process all answers from an exam session, creating/updating ReviewItems.
    /// Wrong answers create or reset items. Correct answers only update existing items.
    static func processExamAnswers(
        session: ExamSession,
        exam: Exam,
        localStore: LocalStore
    ) {
        let attemptedAt = session.completedAt ?? Date()

        for question in exam.questions {
            guard let answer = session.answers.first(where: { $0.questionId == question.id }) else {
                // Unanswered — treat as wrong
                processWrongAnswer(question: question, selectedAnswer: nil, exam: exam, attemptedAt: attemptedAt, localStore: localStore)
                continue
            }

            let questionKey = computeQuestionKey(
                question: question.stem,
                options: question.choices.map(\.text),
                correctAnswer: question.choices.first(where: { $0.id == question.correctChoiceId })?.text
            )

            let existing = localStore.getReviewItem(questionKey: questionKey)

            if answer.isCorrect {
                // Only update if item already exists in review queue
                guard var item = existing else { continue }

                let schedule = computeNextSchedule(existing: item, wasCorrect: true, attemptedAt: attemptedAt)
                item.lastWasCorrect = true
                item.lastAnswer = answer.selectedChoiceId
                item.lastAttempted = attemptedAt
                item.repetitions = schedule.repetitions
                item.intervalDays = schedule.intervalDays
                item.easeFactor = schedule.easeFactor
                item.nextReviewAt = schedule.nextReviewAt
                localStore.saveReviewItem(item)
            } else {
                processWrongAnswer(question: question, selectedAnswer: answer.selectedChoiceId, exam: exam, attemptedAt: attemptedAt, localStore: localStore)
            }
        }
    }

    private static func processWrongAnswer(
        question: Question,
        selectedAnswer: String?,
        exam: Exam,
        attemptedAt: Date,
        localStore: LocalStore
    ) {
        let correctText = question.choices.first(where: { $0.id == question.correctChoiceId })?.text
        let questionKey = computeQuestionKey(
            question: question.stem,
            options: question.choices.map(\.text),
            correctAnswer: correctText
        )

        let existing = localStore.getReviewItem(questionKey: questionKey)
        let schedule = computeNextSchedule(existing: existing, wasCorrect: false, attemptedAt: attemptedAt)

        if var item = existing {
            // Update existing item — reset schedule
            item.lastWasCorrect = false
            item.lastAnswer = selectedAnswer
            item.lastAttempted = attemptedAt
            item.repetitions = schedule.repetitions
            item.intervalDays = schedule.intervalDays
            item.easeFactor = schedule.easeFactor
            item.nextReviewAt = schedule.nextReviewAt
            localStore.saveReviewItem(item)
        } else {
            // Create new review item
            var item = ReviewItem(
                questionKey: questionKey,
                examType: .practice,
                domain: question.domain,
                topic: question.subdomain,
                question: question.stem,
                options: question.choices.map(\.text),
                correctAnswer: correctText,
                lastAnswer: selectedAnswer,
                lastWasCorrect: false,
                lastAttempted: attemptedAt
            )
            item.repetitions = schedule.repetitions
            item.intervalDays = schedule.intervalDays
            item.easeFactor = schedule.easeFactor
            item.nextReviewAt = schedule.nextReviewAt
            localStore.saveReviewItem(item)
        }
    }

    // MARK: - Query

    /// Get the next question due for review (for widget or quick study)
    static func getNextDueQuestion(localStore: LocalStore) -> ReviewItem? {
        localStore.getDueReviewItems(limit: 1).first
    }

    /// Get count of items due for review
    static func getDueCount(localStore: LocalStore) -> Int {
        localStore.getDueReviewItems(limit: 999).count
    }

    // MARK: - Helpers

    private static func clamp(_ value: Double, min: Double, max: Double) -> Double {
        Swift.min(max, Swift.max(min, value))
    }
}
