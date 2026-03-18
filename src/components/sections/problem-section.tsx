import { SectionHeader } from "@/components/section-header"

export function ProblemSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          The EPPP prep industry is broken. You already know this.
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pb-12 space-y-5 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          AATBS charges $849 to $1,799. Add the exam fee, testing center, and
          you&apos;re spending $1,500+ before you sit down. Fail? Another $687.50
          per retake.
        </p>

        <p>
          The materials are &ldquo;cumbersome, intimidating, and overly
          detailed.&rdquo; Someone passed using 11-year-old PsychPrep content.
          Practice scores don&apos;t predict real scores. People hit 80&ndash;90%
          on practice and still fail the actual exam.
        </p>

        <p>
          The #1 predictor of EPPP success is practice testing. But most
          programs sell you 400 pages of reading as their core product.
        </p>

        <p className="text-foreground font-medium">
          We built this because we went through it. Not because we saw a
          market opportunity.
        </p>

        <p className="text-sm text-muted-foreground/70">
          Built by Anders Chan, Psy.D. Scored 19% on his diagnostic, passed
          first try in 30 days.
        </p>
      </div>
    </section>
  )
}
