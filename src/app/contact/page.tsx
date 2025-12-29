import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact thePsychology.ai support.",
  alternates: {
    canonical: "/contact",
  },
}

export default function ContactPage() {
  const supportEmail = "DrChan@thepsychology.ai"

  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
          <p className="text-muted-foreground">
            Email is the fastest way to reach us.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-accent/40 p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Support:{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="text-primary underline underline-offset-4"
            >
              {supportEmail}
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Resources:{" "}
            <Link href="/resources" className="text-primary underline underline-offset-4">
              Browse EPPP study guides
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
