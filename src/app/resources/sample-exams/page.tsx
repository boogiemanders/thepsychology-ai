import type { Metadata } from "next"
import Link from "next/link"
import { getSampleExams } from "@/lib/seo/exams.server"

export const metadata: Metadata = {
  title: "EPPP Sample Exams",
  description: "A small sample of questions from a diagnostic and a practice exam.",
  alternates: {
    canonical: "/resources/sample-exams",
  },
}

export default function SampleExamsPage() {
  const exams = getSampleExams(6)

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/resources" className="underline underline-offset-4">
              Resources
            </Link>{" "}
            / <span className="text-foreground">Sample Exams</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Sample Exams</h1>
          <p className="text-muted-foreground">
            A small sample of questions from a diagnostic and a practice exam (not a full exam).
          </p>
        </header>

        <div className="space-y-10">
          {exams.map((exam) => (
            <section key={exam.examId} className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                {exam.examType === "diagnostic" ? "Diagnostic" : "Practice"}: {exam.examId}
              </h2>
              <ol className="space-y-6">
                {exam.questions.map((q) => (
                  <li key={String(q.id)} className="rounded-xl border border-border bg-accent/40 p-5">
                    <p className="font-medium text-foreground">{q.question}</p>
                    {q.options.length ? (
                      <ul className="mt-4 grid gap-2">
                        {q.options.map((opt, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {opt}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-primary">
                        Show answer
                      </summary>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {q.correctAnswer ? (
                          <p>
                            <span className="font-semibold text-foreground">Answer:</span> {q.correctAnswer}
                          </p>
                        ) : null}
                        {q.explanation ? (
                          <p>
                            <span className="font-semibold text-foreground">Explanation:</span> {q.explanation}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            Prefer targeted study plans instead of random sets?{" "}
            <Link href="/#get-started" className="text-primary underline underline-offset-4">
              Get started in the app
            </Link>
            .
          </p>
        </section>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            Want applied, EPPP-style vignettes? Try our branching case vignette (free sample):{" "}
            <Link href="/case-bank?id=ethics-duty-to-warn" className="text-primary underline underline-offset-4">
              Start the case
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
