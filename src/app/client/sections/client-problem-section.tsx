import { SectionHeader } from "@/components/section-header"

export function ClientProblemSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Finding a therapist shouldn&apos;t feel like a second full-time job.
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-5 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          You filled out the Psychology Today form. Wrote something personal.
          Waited. Nobody replied.
        </p>
        <p>
          Sent 10 more messages. Got 2 responses. One doesn&apos;t take your
          insurance. The other has a 6-week waitlist.
        </p>
        <p>
          Maybe you tried BetterHelp. Matched in 48 hours with someone who
          reads from a script and doesn&apos;t remember last week.
        </p>
        <p>
          Or Headway said your copay was $30. Four sessions later, a $450 bill.
        </p>
        <p className="text-foreground font-medium">
          56.4% of Americans with a mental illness don&apos;t get treatment. Not
          because they don&apos;t want help. Because finding it is nearly
          impossible.
        </p>
      </div>
    </section>
  )
}
