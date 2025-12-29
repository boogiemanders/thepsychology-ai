import type { Metadata } from "next"
import Link from "next/link"
import { getAllTopicContentEntries } from "@/lib/seo/topic-content.server"

export const metadata: Metadata = {
  title: "Resources",
  description: "EPPP study guides, practice questions, and sample exams.",
  alternates: {
    canonical: "/resources",
  },
}

export default function ResourcesPage() {
  const topics = getAllTopicContentEntries()

  const domains = Array.from(
    topics.reduce((acc, topic) => {
      const current = acc.get(topic.domainDir) ?? {
        domainDir: topic.domainDir,
        domainLabel: topic.domainLabel,
        topicCount: 0,
      }
      current.topicCount += 1
      acc.set(topic.domainDir, current)
      return acc
    }, new Map<string, { domainDir: string; domainLabel: string; topicCount: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => a.domainDir.localeCompare(b.domainDir))

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">EPPP Resources</h1>
          <p className="text-muted-foreground">
            Browse EPPP-aligned study guides by domain, plus sample practice questions and sample exams.
          </p>
        </header>

        <section className="grid gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Study Guides by Domain</h2>
          <div className="grid gap-3">
            {domains.map((domain) => (
              <Link
                key={domain.domainDir}
                href={`/resources/topics/${domain.domainDir}`}
                className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-primary">{domain.domainLabel}</p>
                    <p className="text-sm text-muted-foreground">{domain.topicCount} topics</p>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Practice</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/resources/practice-questions"
              className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
            >
              <p className="text-base font-semibold text-primary">Practice Questions</p>
              <p className="mt-1 text-sm text-muted-foreground">A small sample across domains.</p>
            </Link>
            <Link
              href="/resources/sample-exams"
              className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
            >
              <p className="text-base font-semibold text-primary">Sample Exams</p>
              <p className="mt-1 text-sm text-muted-foreground">A small sample from diagnostic + practice.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            Want the full experience? Start on the main page:{" "}
            <Link href="/#get-started" className="text-primary underline underline-offset-4">
              Get started
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
