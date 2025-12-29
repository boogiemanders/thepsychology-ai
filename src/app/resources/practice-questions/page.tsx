import type { Metadata } from "next"
import Link from "next/link"
import { getSampleQuestionsByDomain } from "@/lib/seo/questions.server"

export const metadata: Metadata = {
  title: "EPPP Practice Questions (Sample)",
  description: "A small sample of EPPP-style practice questions across domains.",
  alternates: {
    canonical: "/resources/practice-questions",
  },
}

export default function PracticeQuestionsPage() {
  const samples = getSampleQuestionsByDomain(3)

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/resources" className="underline underline-offset-4">
              Resources
            </Link>{" "}
            / <span className="text-foreground">Practice Questions</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Practice Questions (Sample)</h1>
          <p className="text-muted-foreground">
            A small sample of EPPP-style practice questions across domains. Answers are included under each question.
          </p>
        </header>

        <div className="space-y-10">
          {samples.map(({ domain, questions }) => (
            <section key={domain} className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">{domain}</h2>
              <ol className="space-y-6">
                {questions.map((q) => (
                  <li key={String(q.id)} className="rounded-xl border border-border bg-accent/40 p-5">
                    <p className="font-medium text-foreground">{q.question}</p>
                    {q.options.length ? (
                      <ul className="mt-4 grid gap-2">
                        {q.options.map((opt) => (
                          <li key={opt.label} className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{opt.label}.</span> {opt.text}
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
            Want targeted practice by topic?{" "}
            <Link href="/#get-started" className="text-primary underline underline-offset-4">
              Get started in the app
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

