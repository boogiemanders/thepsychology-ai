import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "EPPP Practice Questions",
  description: "EPPP-style practice questions and explanations across domains, with targeted study by topic.",
  alternates: {
    canonical: "/eppp-practice-questions",
  },
}

export default function EpppPracticeQuestionsPage() {
  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">EPPP Practice Questions</h1>
          <p className="text-muted-foreground">
            Practice questions work best when they’re aligned to the EPPP blueprint and paired with clear explanations.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Start Here</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/resources/practice-questions"
              className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
            >
              <p className="text-base font-semibold text-primary">Sample Practice Questions</p>
              <p className="mt-1 text-sm text-muted-foreground">A small sample across domains.</p>
            </Link>
            <Link
              href="/resources"
              className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
            >
              <p className="text-base font-semibold text-primary">Study Guides</p>
              <p className="mt-1 text-sm text-muted-foreground">Browse topics by domain.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            For targeted practice, diagnostics, and a personalized plan:{" "}
            <Link href="/#get-started" className="text-primary underline underline-offset-4">
              get started in the app
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

