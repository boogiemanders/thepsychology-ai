export const QUIZ_PASS_PERCENT = 70

export function isQuizPass(score: number, totalQuestions: number): boolean {
  if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return false
  }
  return (score / totalQuestions) * 100 >= QUIZ_PASS_PERCENT
}
