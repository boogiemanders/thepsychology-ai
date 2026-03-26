import { SectionHeader } from "@/components/section-header"

export function ProviderTrustSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          Why I want to build this next
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pb-12 space-y-5">
        <blockquote className="space-y-4 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground border-l-2 border-primary/30 pl-6">
          <p>
            I spent 7 years in training. Passed the EPPP. Got licensed. Then
            watched every platform try to take more from clinicians who already
            gave enough.
          </p>
          <p>
            Psychology Today charges you $360/year and sends you spam calls.
            Headway cuts your rates to make their investors more money.
            Alma&apos;s AI writes things about your clients that never happened.
          </p>
          <p>
            I want to build this next because I wanted the platform I wish
            existed when I started my practice. One that treats clinicians like
            professionals, not numbers.
          </p>
          <footer className="text-sm text-foreground font-medium pt-2">
            &mdash; Anders Chan, Psy.D.
          </footer>
        </blockquote>
      </div>
    </section>
  )
}
