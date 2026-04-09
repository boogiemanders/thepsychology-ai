import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getAllTopicContentEntries, getPlainTextExcerpt, getTopicContentMarkdown } from "@/lib/seo/topic-content.server"

type PageProps = {
  params: Promise<{ domain: string; slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getAllTopicContentEntries().map((topic) => ({
    domain: topic.domainDir,
    slug: topic.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain, slug } = await params
  const topic = getTopicContentMarkdown(domain, slug)
  if (!topic) {
    return {
      title: "Resources",
      alternates: { canonical: "/resources" },
    }
  }

  const description = getPlainTextExcerpt(topic.content, 175)

  return {
    title: `${topic.entry.topicName}`,
    description,
    alternates: {
      canonical: `/resources/topics/${topic.entry.domainDir}/${topic.entry.slug}`,
    },
  }
}

export default async function ResourceTopicPage({ params }: PageProps) {
  const { domain, slug } = await params
  const topic = getTopicContentMarkdown(domain, slug)
  if (!topic) notFound()

  const { entry, content } = topic

  const learningResourceJsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: entry.topicName,
    description: getPlainTextExcerpt(content, 175),
    url: `https://www.thepsychology.ai/resources/topics/${entry.domainDir}/${entry.slug}`,
    educationalLevel: "Postdoctoral",
    learningResourceType: "Study Guide",
    about: {
      "@type": "Thing",
      name: entry.domainLabel,
    },
    provider: {
      "@type": "EducationalOrganization",
      name: "thePsychology.ai",
      url: "https://www.thepsychology.ai",
    },
    isPartOf: {
      "@type": "Course",
      name: "EPPP Exam Prep",
      provider: {
        "@type": "EducationalOrganization",
        name: "thePsychology.ai",
      },
    },
    inLanguage: "en",
    isAccessibleForFree: true,
  }

  return (
    <main className="w-full px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learningResourceJsonLd) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/resources" className="underline underline-offset-4">
              Resources
            </Link>{" "}
            /{" "}
            <Link href={`/resources/topics/${entry.domainDir}`} className="underline underline-offset-4">
              {entry.domainLabel}
            </Link>{" "}
            / <span className="text-foreground">{entry.topicName}</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{entry.topicName}</h1>
          <p className="text-muted-foreground">{entry.domainLabel}</p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            Ready to practice?{" "}
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

