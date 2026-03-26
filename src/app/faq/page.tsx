import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: "EPPP FAQ: Common Questions About the EPPP Exam & Prep | thePsychology.ai",
  description:
    "Answers to frequently asked questions about the EPPP exam, scoring, study materials, and exam prep programs. From psychologists who passed.",
  alternates: {
    canonical: "/faq",
  },
}

export default function FaqPage() {
  const faqs = siteConfig.faqSection.faQitems

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <main className="w-full px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            EPPP Exam & Prep FAQ
          </h1>
          <p className="text-muted-foreground">
            Straight answers about the EPPP exam, scoring, study materials, and
            how thePsychology.ai works. No sales pitch.
          </p>
        </header>

        <section className="space-y-6">
          {faqs.map((item) => (
            <details
              key={item.id}
              className="group rounded-xl border border-border bg-accent/40 px-5 py-4"
            >
              <summary className="cursor-pointer text-base font-semibold text-primary list-none flex items-center justify-between gap-2">
                <span>{item.question}</span>
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-accent/40 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Still have questions?</h2>
          <p className="text-sm text-muted-foreground">
            Reach out directly — we respond to every message.
          </p>
          <div className="flex gap-3">
            <Link
              href="/contact"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Read Our Guides
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
