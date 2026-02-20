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
        <article>
          <BlogArticleWithAudio
            content={content}
            slug={slug}
            title={entry.title}
            author={entry.author}
            publishedDate={publishedDate}
            tags={entry.tags}
          />
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
