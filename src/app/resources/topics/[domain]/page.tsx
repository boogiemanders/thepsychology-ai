import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllTopicContentEntries } from "@/lib/seo/topic-content.server"

type PageProps = {
  params: { domain: string }
}

export const dynamicParams = false

export function generateStaticParams() {
  const topics = getAllTopicContentEntries()
  const domainDirs = Array.from(new Set(topics.map((t) => t.domainDir))).sort((a, b) => a.localeCompare(b))
  return domainDirs.map((domain) => ({ domain }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = params
  const topics = getAllTopicContentEntries().filter((t) => t.domainDir === domain)
  const domainLabel = topics[0]?.domainLabel

  if (!domainLabel) {
    return {
      title: "Resources",
      alternates: { canonical: "/resources" },
    }
  }

  return {
    title: `${domainLabel} Study Guides`,
    description: `EPPP study guides and high-yield explanations for ${domainLabel}.`,
    alternates: {
      canonical: `/resources/topics/${domain}`,
    },
  }
}

export default async function ResourceDomainPage({ params }: PageProps) {
  const { domain } = params

  const topics = getAllTopicContentEntries()
    .filter((t) => t.domainDir === domain)
    .sort((a, b) => a.topicName.localeCompare(b.topicName))

  if (topics.length === 0) notFound()

  const domainLabel = topics[0]?.domainLabel ?? domain

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/resources" className="underline underline-offset-4">
              Resources
            </Link>{" "}
            / <span className="text-foreground">{domainLabel}</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{domainLabel}</h1>
          <p className="text-muted-foreground">
            Browse study guides aligned to this EPPP domain. Each topic links back into the app when you’re ready to practice.
          </p>
        </header>

        <section className="grid gap-3">
          {topics.map((topic) => (
            <Link
              key={`${topic.domainDir}:${topic.slug}`}
              href={`/resources/topics/${topic.domainDir}/${topic.slug}`}
              className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-primary">{topic.topicName}</p>
                  <p className="text-sm text-muted-foreground">View study guide</p>
                </div>
                <span className="text-sm text-muted-foreground">→</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            Prefer questions?{" "}
            <Link href="/resources/practice-questions" className="text-primary underline underline-offset-4">
              Browse sample practice questions
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
