import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Dr. Anders Chan, Psy.D. — Founder of thePsychology.ai",
  description:
    "Anders H. Chan, Psy.D. is a licensed psychologist and the founder of thePsychology.ai. He passed the EPPP on his first attempt with a score of 588 and built an AI-adaptive prep platform to help other candidates do the same.",
  alternates: { canonical: "/about/dr-anders-chan" },
  openGraph: {
    title: "Dr. Anders Chan, Psy.D. — Founder of thePsychology.ai",
    description:
      "Licensed psychologist. EPPP first-time passer (588). Founder of thePsychology.ai.",
    images: [{ url: "/images/anders-chan.png", width: 400, height: 400 }],
  },
}

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Anders H. Chan, Psy.D.",
  alternateName: "Dr. Anders Chan",
  url: "https://www.thepsychology.ai/about/dr-anders-chan",
  image: "https://www.thepsychology.ai/images/anders-chan.png",
  jobTitle: "Licensed Psychologist",
  worksFor: {
    "@type": "Organization",
    name: "thePsychology.ai",
    url: "https://www.thepsychology.ai",
  },
  alumniOf: [
    {
      "@type": "EducationalOrganization",
      name: "Long Island University Post",
    },
    {
      "@type": "EducationalOrganization",
      name: "Albert Einstein College of Medicine",
    },
    {
      "@type": "EducationalOrganization",
      name: "UCLA David Geffen School of Medicine",
    },
    {
      "@type": "EducationalOrganization",
      name: "NYU Langone Health",
    },
    {
      "@type": "EducationalOrganization",
      name: "Montefiore Einstein",
    },
  ],
  knowsAbout: [
    "EPPP exam preparation",
    "Clinical psychology",
    "Neuropsychology",
    "Psychopharmacology",
    "AI-adaptive learning",
  ],
  sameAs: [
    "https://x.com/thepsychologyai",
    "https://www.tiktok.com/@thepsychology.ai",
    "https://instagram.com/thepsychologyai",
  ],
}

export default function DrAndersChanPage() {
  return (
    <main className="w-full px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <div className="mx-auto w-full max-w-3xl space-y-10">
        {/* Header with photo */}
        <header className="flex flex-col sm:flex-row gap-6 items-start">
          <Image
            src="/images/anders-chan.png"
            alt="Dr. Anders H. Chan, Psy.D."
            width={120}
            height={120}
            className="rounded-full border border-border"
          />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Anders H. Chan, Psy.D.
            </h1>
            <p className="text-muted-foreground">
              Licensed Psychologist &middot; Founder of thePsychology.ai
            </p>
            <p className="text-sm text-muted-foreground">
              <a
                href="mailto:drchan@thepsychology.ai"
                className="text-primary underline underline-offset-4"
              >
                drchan@thepsychology.ai
              </a>
            </p>
          </div>
        </header>

        {/* Bio */}
        <section className="space-y-4">
          <p className="text-muted-foreground">
            Dr. Anders Chan is a licensed psychologist and the founder of
            thePsychology.ai, an AI-adaptive EPPP exam prep platform. He passed
            the EPPP on his first attempt with a scaled score of 588 after 30
            days of focused preparation — starting from a 19% diagnostic score.
          </p>
          <p className="text-muted-foreground">
            He built thePsychology.ai because the existing prep market was
            broken: programs charging $849-$1,799 for dense, outdated materials
            that didn&apos;t match how the real exam words its questions. His
            approach centers on active recall, practice testing, and
            domain-specific study plans — the methods that learning science
            research consistently shows work best.
          </p>
        </section>

        {/* Training */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Training &amp; Education
          </h2>
          <p className="text-muted-foreground">
            Dr. Chan completed his doctoral training in clinical psychology with
            specialized experience across multiple major academic medical
            centers:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Psy.D. in Clinical Psychology</strong> — Long Island
              University Post
            </li>
            <li>
              <strong>Albert Einstein College of Medicine</strong> —
              Clinical training
            </li>
            <li>
              <strong>UCLA David Geffen School of Medicine</strong> —
              Clinical training
            </li>
            <li>
              <strong>NYU Langone Health</strong> — Clinical training
            </li>
            <li>
              <strong>Montefiore Einstein</strong> — Clinical training
            </li>
          </ul>
        </section>

        {/* EPPP story */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            The EPPP Story
          </h2>
          <p className="text-muted-foreground">
            On his first diagnostic practice exam, Dr. Chan scored 19%. Rather
            than panic, he studied the research on how people actually learn and
            retain information. He shifted from passive reading to a
            practice-question-first approach, targeting his weakest domains with
            the highest exam weights.
          </p>
          <p className="text-muted-foreground">
            30 days later, he passed the EPPP on his first attempt with a score
            of 588 — well above the 500 passing threshold. That experience
            became the foundation for thePsychology.ai: a platform that gives
            every candidate the same evidence-based study method, at a price
            early-career psychologists can actually afford.
          </p>
        </section>

        {/* What he writes about */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Areas of Expertise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "EPPP exam preparation",
              "Clinical psychology",
              "Neuropsychological assessment",
              "Psychopharmacology",
              "Evidence-based study methods",
              "AI-adaptive learning systems",
            ].map((area) => (
              <div
                key={area}
                className="rounded-xl border border-border bg-accent/40 px-4 py-3"
              >
                <p className="text-sm text-muted-foreground">{area}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Published content */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Published on thePsychology.ai
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/blog"
                className="text-primary underline underline-offset-4"
              >
                Blog Posts
              </Link>{" "}
              — EPPP study strategies, domain breakdowns, and exam tips
            </li>
            <li>
              <Link
                href="/eppp-passing-score"
                className="text-primary underline underline-offset-4"
              >
                EPPP Passing Score Guide
              </Link>{" "}
              — state-by-state cut scores and scoring explained
            </li>
            <li>
              <Link
                href="/eppp-sections"
                className="text-primary underline underline-offset-4"
              >
                EPPP Sections &amp; Domain Weights
              </Link>{" "}
              — what&apos;s on the exam and how much each section counts
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-accent/40 p-5 space-y-2">
          <p className="text-sm font-medium">Preparing for the EPPP?</p>
          <p className="text-sm text-muted-foreground">
            Dr. Chan built thePsychology.ai around the exact study method that
            took him from 19% to 588 in 30 days.{" "}
            <Link
              href="/#get-started?utm_source=author-bio&utm_medium=cta"
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
