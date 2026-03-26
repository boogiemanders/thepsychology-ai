import type { Metadata } from "next"
import Link from "next/link"
import { getAllTopicContentEntries } from "@/lib/seo/topic-content.server"

export const metadata: Metadata = {
  title: "EPPP Sections & Domain Weights: Complete 2025-2026 Breakdown",
  description:
    "All 8 EPPP content domains with official ASPPB weight percentages, key topics per domain, and study guides. Know exactly what to study and how much each section counts.",
  alternates: { canonical: "/eppp-sections" },
  openGraph: {
    title: "EPPP Sections & Domain Weights: Complete 2025-2026 Breakdown",
    description:
      "All 8 EPPP content domains with official ASPPB weight percentages, key topics per domain, and study guides.",
  },
}

const domainWeights = [
  {
    number: 1,
    name: "Biological Bases of Behavior",
    weight: "12%",
    approxQuestions: "21",
    keyTopics:
      "Neuroanatomy, neurotransmitters, psychopharmacology, neuroimaging, biological bases of psychopathology, behavioral genetics",
  },
  {
    number: 2,
    name: "Cognitive-Affective Bases of Behavior",
    weight: "13%",
    approxQuestions: "23",
    keyTopics:
      "Learning theory, memory, attention, language, emotion, motivation, perception, cognitive development",
  },
  {
    number: 3,
    name: "Social and Cultural Bases of Behavior",
    weight: "12%",
    approxQuestions: "21",
    keyTopics:
      "Social cognition, group dynamics, attitudes, prejudice, cultural factors, diversity, social influence, organizational behavior",
  },
  {
    number: 4,
    name: "Growth and Lifespan Development",
    weight: "12%",
    approxQuestions: "21",
    keyTopics:
      "Developmental theories, attachment, cognitive development stages, aging, developmental psychopathology, resilience",
  },
  {
    number: 5,
    name: "Assessment and Diagnosis",
    weight: "14%",
    approxQuestions: "25",
    keyTopics:
      "Psychometric theory, intelligence testing, personality assessment, neuropsychological assessment, DSM diagnostic criteria, clinical interviewing",
  },
  {
    number: 6,
    name: "Treatment, Intervention, and Prevention",
    weight: "14%",
    approxQuestions: "25",
    keyTopics:
      "Evidence-based treatments, CBT, psychodynamic therapy, humanistic approaches, group therapy, prevention models, crisis intervention, treatment planning",
  },
  {
    number: 7,
    name: "Research Methods and Statistics",
    weight: "8%",
    approxQuestions: "14",
    keyTopics:
      "Research design, statistical analysis, psychometrics, reliability, validity, meta-analysis, program evaluation, epidemiology",
  },
  {
    number: 8,
    name: "Ethical, Legal, and Professional Issues",
    weight: "15%",
    approxQuestions: "26",
    keyTopics:
      "APA Ethics Code, confidentiality, informed consent, dual relationships, competence, mandated reporting, forensic issues, professional standards",
  },
]

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "EPPP Sections & Domain Weights: Complete 2025-2026 Breakdown",
  description:
    "All 8 EPPP content domains with official ASPPB weight percentages, key topics per domain, and study guides.",
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
  url: "https://www.thepsychology.ai/eppp-sections",
  datePublished: "2025-01-15",
  dateModified: "2026-03-25",
}

export default function EpppSectionsPage() {
  const topics = getAllTopicContentEntries()
  const domains = Array.from(
    topics.reduce((acc, topic) => {
      const current = acc.get(topic.domainDir) ?? {
        domainDir: topic.domainDir,
        domainLabel: topic.domainLabel,
        topicCount: 0,
      }
      current.topicCount += 1
      acc.set(topic.domainDir, current)
      return acc
    }, new Map<string, { domainDir: string; domainLabel: string; topicCount: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => a.domainDir.localeCompare(b.domainDir))

  return (
    <main className="w-full px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            EPPP Sections &amp; Domain Weights
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

        {/* Intro */}
        <section className="space-y-4">
          <p className="text-muted-foreground">
            The EPPP Part 1 covers{" "}
            <strong>8 content domains</strong> defined by ASPPB. Each domain
            carries a different weight, meaning some sections contribute more
            questions to your exam than others. Understanding these weights
            helps you allocate study time where it counts most.
          </p>
          <div className="rounded-xl border border-border bg-accent/40 p-5 space-y-2">
            <p className="text-sm font-semibold">Key numbers</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>225 total questions (175 scored, 50 unscored pilot items)</li>
              <li>4 hours 15 minutes</li>
              <li>
                Passing score:{" "}
                <Link
                  href="/eppp-passing-score"
                  className="text-primary underline underline-offset-4"
                >
                  500 scaled score
                </Link>{" "}
                in most jurisdictions
              </li>
            </ul>
          </div>
        </section>

        {/* Domain weight table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            ASPPB Domain Weight Percentages
          </h2>
          <p className="text-muted-foreground">
            The approximate question counts below are based on 175 scored items.
            ASPPB publishes weight ranges, so exact counts vary slightly across
            exam forms.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/40">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Domain</th>
                  <th className="px-4 py-3 text-left font-semibold">Weight</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    ~Questions
                  </th>
                </tr>
              </thead>
              <tbody>
                {domainWeights.map((d, i) => (
                  <tr
                    key={d.number}
                    className={
                      i % 2 === 0 ? "bg-background" : "bg-accent/20"
                    }
                  >
                    <td className="px-4 py-2 text-muted-foreground">
                      {d.number}
                    </td>
                    <td className="px-4 py-2 font-medium">{d.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {d.weight}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {d.approxQuestions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Source: ASPPB Information for EPPP Candidates. Weights are
            approximate and may shift slightly between exam forms. Last verified
            March 2026.
          </p>
        </section>

        {/* What the weights mean for studying */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            What the Weights Mean for Your Study Plan
          </h2>
          <p className="text-muted-foreground">
            Ethics (15%), Assessment (14%), and Treatment (14%) together account
            for <strong>43% of your scored questions</strong>. These three
            domains should get the largest share of your study time — especially
            Ethics, which many candidates underestimate because they assume
            common sense will carry them.
          </p>
          <p className="text-muted-foreground">
            Research Methods (8%) is the smallest domain, but candidates who
            skip it entirely often regret it. A few focused study sessions on
            research design and basic statistics can secure those 14 questions
            without a massive time investment.
          </p>
          <p className="text-muted-foreground">
            The most effective strategy: diagnose your weak domains first, then
            allocate study time proportionally — spending more time where you
            score lowest <em>and</em> where the exam weight is highest.
          </p>
        </section>

        {/* Domain deep dive */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            What Each Domain Covers
          </h2>
          {domainWeights.map((d) => (
            <div
              key={d.number}
              className="rounded-xl border border-border bg-accent/40 p-5 space-y-2"
            >
              <h3 className="text-base font-semibold">
                Domain {d.number}: {d.name}{" "}
                <span className="text-muted-foreground font-normal">
                  ({d.weight})
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                <strong>Key topics:</strong> {d.keyTopics}
              </p>
            </div>
          ))}
        </section>

        {/* Study guides by domain */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Study Guides by Domain
          </h2>
          <div className="grid gap-3">
            {domains.map((domain) => (
              <Link
                key={domain.domainDir}
                href={`/resources/topics/${domain.domainDir}`}
                className="rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-primary">
                      {domain.domainLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {domain.topicCount} topics
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">&rarr;</span>
                </div>
              </Link>
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
                href="/eppp-passing-score"
                className="text-primary underline underline-offset-4"
              >
                EPPP Passing Score &amp; Cut Scores by State
              </Link>
            </li>
            <li>
              <Link
                href="/eppp-practice-questions"
                className="text-primary underline underline-offset-4"
              >
                EPPP Practice Questions
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-accent/40 p-5 space-y-2">
          <p className="text-sm font-medium">Know your weak domains?</p>
          <p className="text-sm text-muted-foreground">
            thePsychology.ai diagnoses your starting point and builds every
            study session around closing the gap.{" "}
            <Link
              href="/#get-started?utm_source=eppp-sections&utm_medium=cta"
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
