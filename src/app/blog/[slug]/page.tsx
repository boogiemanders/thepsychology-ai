import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllBlogPosts, getBlogPostMarkdown, getPlainTextExcerpt } from "@/lib/seo/blog-content.server"
import { BlogArticleWithAudio } from "@/components/blog/blog-article-with-audio"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostMarkdown(slug)
  if (!post) {
    return {
      title: "Blog",
      alternates: { canonical: "/blog" },
    }
  }

  const description = post.entry.description || getPlainTextExcerpt(post.content, 155)

  return {
    title: post.entry.title,
    description,
    alternates: {
      canonical: `/blog/${post.entry.slug}`,
    },
    openGraph: {
      title: post.entry.title,
      description,
      type: "article",
      publishedTime: post.entry.publishedAt,
      modifiedTime: post.entry.updatedAt,
      authors: [post.entry.author],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPostMarkdown(slug)
  if (!post) notFound()

  const { entry, content } = post

  const publishedDate = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/blog" className="underline underline-offset-4">
              Blog
            </Link>{" "}
            / <span className="text-foreground">{entry.title}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{entry.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{entry.author}</span>
            {publishedDate && (
              <>
                <span aria-hidden="true">|</span>
                <time dateTime={entry.publishedAt}>{publishedDate}</time>
              </>
            )}
          </div>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <article>
          <BlogArticleWithAudio content={content} slug={slug} />
        </article>

        <section className="rounded-xl border border-border bg-accent/40 p-5 space-y-2">
          <p className="text-sm font-medium">Preparing for the EPPP?</p>
          <p className="text-sm text-muted-foreground">
            thePsychology.ai offers AI-adaptive prep with 80+ lessons, practice exams, and personalized study plans.{" "}
            <Link href={`/#get-started?utm_source=blog&utm_medium=cta&utm_campaign=${slug}`} className="text-primary underline underline-offset-4">
              Try it free
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
