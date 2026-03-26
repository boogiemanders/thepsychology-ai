import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "EPPP Passing Score: Cut Scores by State, Score Scale & FAQs (2025-2026)",
  description:
    "What EPPP passing score do you need? State-by-state cut scores, how the 200-800 scaled score works, and what happens if you fall short.",
  alternates: { canonical: "/eppp-passing-score" },
  openGraph: {
    title: "EPPP Passing Score: Cut Scores by State, Score Scale & FAQs",
    description:
      "What EPPP passing score do you need? State-by-state cut scores, how the 200-800 scaled score works, and what happens if you fall short.",
  },
}

const stateCutScores = [
  { state: "Alabama", cutScore: 500 },
  { state: "Alaska", cutScore: 500 },
  { state: "Arizona", cutScore: 500 },
  { state: "Arkansas", cutScore: 500 },
  { state: "California", cutScore: 500 },
  { state: "Colorado", cutScore: 500 },
  { state: "Connecticut", cutScore: 500 },
  { state: "Delaware", cutScore: 500 },
  { state: "District of Columbia", cutScore: 500 },
  { state: "Florida", cutScore: 500 },
  { state: "Georgia", cutScore: 500 },
  { state: "Hawaii", cutScore: 500 },
  { state: "Idaho", cutScore: 500 },
  { state: "Illinois", cutScore: 500 },
  { state: "Indiana", cutScore: 500 },
  { state: "Iowa", cutScore: 500 },
  { state: "Kansas", cutScore: 500 },
  { state: "Kentucky", cutScore: 500 },
  { state: "Louisiana", cutScore: 500 },
  { state: "Maine", cutScore: 500 },
  { state: "Maryland", cutScore: 500 },
  { state: "Massachusetts", cutScore: 500 },
  { state: "Michigan", cutScore: 500 },
  { state: "Minnesota", cutScore: 500 },
  { state: "Mississippi", cutScore: 500 },
  { state: "Missouri", cutScore: 500 },
  { state: "Montana", cutScore: 500 },
  { state: "Nebraska", cutScore: 500 },
  { state: "Nevada", cutScore: 500 },
  { state: "New Hampshire", cutScore: 500 },
  { state: "New Jersey", cutScore: 500 },
  { state: "New Mexico", cutScore: 500 },
  { state: "New York", cutScore: 500 },
  { state: "North Carolina", cutScore: 500 },
  { state: "North Dakota", cutScore: 500 },
  { state: "Ohio", cutScore: 500 },
  { state: "Oklahoma", cutScore: 500 },
  { state: "Oregon", cutScore: 500 },
  { state: "Pennsylvania", cutScore: 500 },
  { state: "Rhode Island", cutScore: 500 },
  { state: "South Carolina", cutScore: 500 },
  { state: "South Dakota", cutScore: 500 },
  { state: "Tennessee", cutScore: 500 },
  { state: "Texas", cutScore: 500 },
  { state: "Utah", cutScore: 500 },
  { state: "Vermont", cutScore: 500 },
  { state: "Virginia", cutScore: 500 },
  { state: "Washington", cutScore: 500 },
  { state: "West Virginia", cutScore: 500 },
  { state: "Wisconsin", cutScore: 500 },
  { state: "Wyoming", cutScore: 500 },
]

const faqs = [
  {
    question: "What is a passing score on the EPPP?",
    answer:
      "Most U.S. jurisdictions require a scaled score of 500 on the EPPP Part 1. Scores are reported on a 200-800 scale. The 500 cut score is recommended by ASPPB, though each state or provincial licensing board sets its own requirement.",
  },
  {
    question: "How is the EPPP scored?",
    answer:
      "The EPPP uses scaled scoring, not a simple percentage. Your raw score (number correct out of 175 scored items) is converted to a scaled score between 200 and 800 using statistical equating. This ensures fairness across different exam forms. Approximately 70% correct on scored items typically maps to a scaled score around 500, but this varies by form difficulty.",
  },
  {
    question: "What is the EPPP score range?",
    answer:
      "EPPP scores range from 200 to 800. A score of 500 is the most common passing threshold. Your score report shows your scaled score and whether you passed or failed based on your jurisdiction's cut score.",
  },
  {
    question: "Do all states require the same passing score?",
    answer:
      "Nearly all U.S. jurisdictions use the ASPPB-recommended cut score of 500. However, the passing standard is set by each individual licensing board. Always verify the current requirement with your specific state or provincial board before test day.",
  },
  {
    question: "What happens if I fail the EPPP?",
    answer:
      "If you don't reach the passing score, you can retake the exam. Most jurisdictions allow retakes after a waiting period (commonly 60-90 days). Some states limit the total number of attempts. Check your board's retake policy, and consider changing your study approach — switching from passive reading to active recall and practice testing often makes the difference on a retake.",
  },
  {
    question: "Can I transfer my EPPP score to another state?",
    answer:
      "Yes. ASPPB offers a score transfer service (formerly called the CPQ). Your score can be transferred to another jurisdiction, though the receiving board must accept it and you must meet their other licensure requirements. Fees and timelines vary.",
  },
  {
    question: "How many questions are on the EPPP?",
    answer:
      "The EPPP Part 1 contains 225 multiple-choice questions. Of these, 175 are scored and 50 are unscored pilot items being tested for future use. You won't know which questions are scored, so treat every question as if it counts.",
  },
  {
    question: "What percentage do I need to get right to pass the EPPP?",
    answer:
      "There is no fixed percentage because the EPPP uses scaled scoring that accounts for form difficulty. As a rough benchmark, getting approximately 70% of scored items correct typically puts you near a 500 scaled score, but this varies. Focus on consistent domain-level performance rather than a single percentage target.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EPPP Passing Score: Cut Scores by State, Score Scale & FAQs",
  description:
    "What EPPP passing score do you need? State-by-state cut scores, how the 200-800 scaled score works, and what happens if you fall short.",
  author: {
    "@type": "Person",
    name: "Anders H. Chan, Psy.D.",
    url: "https://www.thepsychology.ai/about/dr-anders-chan",
  },
  publisher: {
    "@type": "Organization",
    name: "thePsychology.ai",
    url: "https://www.thepsychology.ai",
  },
  url: "https://www.thepsychology.ai/eppp-passing-score",
  datePublished: "2025-01-15",
  dateModified: "2026-03-25",
}

export default function EpppPassingScorePage() {
  return (
    <main className="w-full px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            EPPP Passing Score: What Score Do You Need?
          </h1>
          <p className="text-muted-foreground">
            By{" "}
            <Link
              href="/about/dr-anders-chan"
              className="text-primary underline underline-offset-4"
            >
              Anders H. Chan, Psy.D.
            </Link>{" "}
            &middot; Updated March 2026
          </p>
        </header>

        {/* Quick answer box */}
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-accent/40 p-5 space-y-2">
            <p className="text-sm font-semibold">Quick answer</p>
            <p className="text-sm text-muted-foreground">
              Most jurisdictions require a <strong>scaled score of 500</strong>{" "}
              on the EPPP Part 1. Scores are reported on a{" "}
              <strong>200-800 scale</strong>. The 500 cut score is recommended
              by ASPPB, and nearly every U.S. state and Canadian province
              follows it.
            </p>
          </div>
        </section>

        {/* How scoring works */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            How EPPP Scoring Works
          </h2>
          <p className="text-muted-foreground">
            The EPPP does not use a simple percentage. Your raw score (the
            number of scored items you answer correctly out of 175) is converted
            to a <strong>scaled score between 200 and 800</strong> through a
            statistical process called equating. This accounts for slight
            differences in difficulty across exam forms, so a 500 on one form
            means the same thing as a 500 on another.
          </p>
          <p className="text-muted-foreground">
            Of the 225 total questions, <strong>175 are scored</strong> and{" "}
            <strong>50 are unscored pilot items</strong> being tested for future
            exams. You won&apos;t know which are which, so treat every question
            as if it counts.
          </p>
        </section>

        {/* What 500 means */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            What Does a 500 Actually Mean?
          </h2>
          <p className="text-muted-foreground">
            A scaled score of 500 roughly corresponds to answering{" "}
            <strong>about 70% of scored items correctly</strong>, though this
            varies by form. The exact conversion changes with each exam
            administration because equating adjusts for difficulty.
          </p>
          <p className="text-muted-foreground">
            This is why chasing a specific percentage during practice is less
            useful than building consistent performance across all eight content
            domains. A candidate who scores 75% in seven domains but 40% in one
            is at more risk than someone who scores a steady 72% everywhere.
          </p>
        </section>

        {/* State cut score table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            EPPP Cut Scores by State
          </h2>
          <p className="text-muted-foreground">
            The table below shows the EPPP passing score requirement for each
            U.S. jurisdiction. As of 2026, all listed jurisdictions use the
            ASPPB-recommended cut score of 500. Always confirm the current
            requirement with your specific licensing board before scheduling your
            exam.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/40">
                  <th className="px-4 py-3 text-left font-semibold">
                    Jurisdiction
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Required Scaled Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {stateCutScores.map((row, i) => (
                  <tr
                    key={row.state}
                    className={
                      i % 2 === 0 ? "bg-background" : "bg-accent/20"
                    }
                  >
                    <td className="px-4 py-2 text-muted-foreground">
                      {row.state}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {row.cutScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Source: ASPPB and individual state licensing board websites.
            Canadian provinces and territories also typically use a 500 cut
            score. Last verified March 2026. Requirements can change — always
            check with your board.
          </p>
        </section>

        {/* Retake info */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            What If You Don&apos;t Pass?
          </h2>
          <p className="text-muted-foreground">
            Most jurisdictions allow retakes after a waiting period, commonly
            60-90 days. Some states limit the total number of attempts (often
            between 3 and unlimited, depending on the board). Your score report
            will show your scaled score and a pass/fail determination.
          </p>
          <p className="text-muted-foreground">
            If you&apos;re retaking the EPPP, consider changing your study
            method rather than just studying more. Research consistently shows
            that{" "}
            <strong>
              practice testing and active recall outperform passive reading
            </strong>{" "}
            for long-term retention. If your first attempt was mostly
            reading-based, switching to a practice-question-first approach often
            makes the difference.
          </p>
        </section>

        {/* Score transfer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            EPPP Score Transfer
          </h2>
          <p className="text-muted-foreground">
            ASPPB offers a score transfer service that lets you send your EPPP
            results to another jurisdiction. This is useful if you relocate or
            want to be licensed in multiple states. The receiving board must
            accept transferred scores, and you still need to meet their other
            licensure requirements (supervised hours, jurisprudence exam, etc.).
          </p>
        </section>

        {/* FAQ section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-accent/40"
              >
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold list-none flex items-center justify-between">
                  {faq.question}
                  <span className="ml-2 text-muted-foreground transition-transform group-open:rotate-180">
                    &#9662;
                  </span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Related links */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Related Resources
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/eppp-sections"
                className="text-primary underline underline-offset-4"
              >
                EPPP Sections &amp; Domain Weights
              </Link>{" "}
              — what&apos;s on the exam and how much each domain counts
            </li>
            <li>
              <Link
                href="/eppp-practice-questions"
                className="text-primary underline underline-offset-4"
              >
                EPPP Practice Questions
              </Link>{" "}
              — free practice sets by domain
            </li>
            <li>
              <Link
                href="/blog"
                className="text-primary underline underline-offset-4"
              >
                EPPP Study Tips
              </Link>{" "}
              — evidence-based strategies from candidates who passed
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-accent/40 p-5 space-y-2">
          <p className="text-sm font-medium">Preparing for the EPPP?</p>
          <p className="text-sm text-muted-foreground">
            thePsychology.ai builds your study plan around the domains where
            you&apos;re weakest, so every session moves the needle.{" "}
            <Link
              href="/#get-started?utm_source=eppp-passing-score&utm_medium=cta"
              className="text-primary underline underline-offset-4"
            >
              Start your free trial
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
