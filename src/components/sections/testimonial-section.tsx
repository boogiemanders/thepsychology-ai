/* eslint-disable @next/next/no-img-element */
import { SectionHeader } from "@/components/section-header";
import { SocialProofTestimonials } from "@/components/testimonial-scroll";
import { siteConfig } from "@/lib/config";

const FOUNDER_QUOTE =
  "I passed on my first try after exactly 30 days of grinding. This is the tool I used, plus the missing piece I had to learn the hard way: what to study, what to skip, and how to stay out of panic mode."

export function TestimonialSection() {
  const { testimonials, quoteSection } = siteConfig;

  return (
    <section
      id="testimonials"
      className="flex flex-col items-center justify-center w-full"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Real Psychologists. Real Results.
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Built by clinicians, powered by AI, proven by scores.
        </p>
      </SectionHeader>

      <div className="flex flex-col items-center justify-center gap-8 w-full p-14 bg-accent z-20">
        <blockquote className="max-w-3xl text-left px-4">
          <p className="text-xl md:text-2xl text-primary leading-relaxed tracking-tighter font-medium mb-6">
            {FOUNDER_QUOTE}
          </p>

          <div className="flex gap-4">
            <div className="size-10 rounded-full bg-primary border border-border">
              <img
                src={quoteSection.author.image}
                alt={quoteSection.author.name}
                className="size-full rounded-full object-contain"
              />
            </div>
            <div className="text-left">
              <cite className="text-lg font-medium text-primary not-italic">
                {quoteSection.author.name}
              </cite>
              <p className="text-sm text-primary">{quoteSection.author.role}</p>
            </div>
          </div>
        </blockquote>
      </div>

      <SocialProofTestimonials testimonials={testimonials} />
    </section>
  );

}
