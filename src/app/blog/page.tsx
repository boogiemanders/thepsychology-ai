import type { Metadata } from "next"
import Link from "next/link"
import { getAllBlogPosts } from "@/lib/seo/blog-content.server"

export const metadata: Metadata = {
  title: "Blog — EPPP Prep Guides & Study Tips",
  description: "EPPP study guides, exam tips, and prep program comparisons from Dr. Anders Chan and the thePsychology.ai team.",
  alternates: {
    canonical: "/blog",
  },
}

export default function BlogPage() {
  const posts = getAllBlogPosts()

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">
            EPPP study guides, exam tips, and honest prep program comparisons.
          </p>
        </header>

        {posts.length === 0 ? (
          <section className="rounded-xl border border-border bg-accent/40 p-5">
            <p className="text-sm text-muted-foreground">
              Posts coming soon. In the meantime, start here:{" "}
              <Link href="/resources" className="text-primary underline underline-offset-4">
                EPPP resources
              </Link>
              .
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const publishedDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : null

              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-xl border border-border bg-accent/40 p-5 space-y-2 transition-colors hover:bg-accent/70"
                >
                  <h2 className="text-lg font-semibold tracking-tight">{post.title}</h2>
                  {post.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    {publishedDate && (
                      <>
                        <span aria-hidden="true">|</span>
                        <time dateTime={post.publishedAt}>{publishedDate}</time>
                      </>
                    )}
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
