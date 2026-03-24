import { SectionHeader } from "@/components/section-header"

export function ProviderPipelineSection() {
  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          You trained here. Your next clients will find you here.
        </h2>
      </SectionHeader>

      <div className="max-w-2xl mx-auto px-6 pb-12 space-y-5 text-[0.95rem] leading-[1.9] md:text-base md:leading-relaxed text-muted-foreground">
        <p>
          153+ postdocs use thePsychology.ai to pass the EPPP. They graduate.
          Get licensed. Need a place to practice.
        </p>

        <p>
          Meanwhile, thousands of people search for a therapist who gets their
          situation. Not a random profile on page 6 of a directory. A real match.
        </p>

        <p className="text-foreground font-medium">
          We connect both sides. No directory, no VC-backed platform, and no
          Google ad can replicate that pipeline.
        </p>
      </div>

      {/* Flywheel visual */}
      <div className="w-full max-w-3xl mx-auto px-6 pb-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {[
            { step: "1", label: "Students study here" },
            { step: "2", label: "Pass EPPP, get licensed" },
            { step: "3", label: "Clients find them through matching" },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {item.step}
                </div>
                <span className="text-sm text-muted-foreground max-w-[140px]">
                  {item.label}
                </span>
              </div>
              {i < 2 && (
                <div className="hidden md:block w-16 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
