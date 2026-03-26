import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "EPPP Passing Score: What Score Do You Need? | thePsychology.ai",
  description: "How EPPP scoring works, what passing score you need by state, and how scaled scores are calculated.",
  alternates: { canonical: "/eppp-passing-score" },
  openGraph: {
    title: "EPPP Passing Score: What Score Do You Need? | thePsychology.ai",
    description: "How EPPP scoring works, what passing score you need by state, and how scaled scores are calculated.",
  },
}

export default function EpppPassingScorePage() {
  const passingScoreFaq = siteConfig.faqSection.faQitems.find((item) =>
    item.question.toLowerCase().includes("passing score")
  )

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">EPPP Passing Score</h1>
          <p className="text-muted-foreground">
            Passing requirements vary by jurisdiction. Use your licensing board’s requirements as the source of truth.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Quick Answer</h2>
          <div className="rounded-xl border border-border bg-accent/40 p-5">
            <p className="text-sm text-muted-foreground">
              {passingScoreFaq?.answer ??
                "EPPP scores are scaled, and the required passing score is set by your licensing jurisdiction."}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Related:{" "}
            <Link href="/eppp-sections" className="text-primary underline underline-offset-4">
              EPPP sections (domains)
            </Link>
            .
          </p>
        </section>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            Want a focused plan that targets your weak domains?{" "}
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

