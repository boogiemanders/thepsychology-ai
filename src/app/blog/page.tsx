import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Blog",
  description: "Updates and guides for EPPP prep.",
  alternates: {
    canonical: "/blog",
  },
}

export default function BlogPage() {
  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Posts coming soon.</p>
        </header>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            In the meantime, start here:{" "}
            <Link href="/resources" className="text-primary underline underline-offset-4">
              EPPP resources
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

