import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

export interface TestimonialCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role: string;
  img?: string;
  description: React.ReactNode;
  className?: string;
}

export const TestimonialCard = ({
  description,
  name,
  img,
  role,
  className,
  ...props
}: TestimonialCardProps) => (
  <div
    className={cn(
      "flex break-inside-avoid flex-col items-start justify-between gap-3 rounded-xl p-3 overflow-hidden",
      // light styles
      "bg-accent",
      "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04),0px_8px_12px_-4px_rgba(15,12,12,0.08),0px_1px_2px_0px_rgba(15,12,12,0.10)] dark:shadow-[0px_0px_0px_1px_rgba(250,250,250,0.1),0px_0px_0px_1px_#18181B,0px_8px_12px_-4px_rgba(15,12,12,0.3),0px_1px_2px_0px_rgba(15,12,12,0.3)]",
      className,
    )}
    {...props}
  >
    <div className="select-none leading-snug font-normal text-primary/90 text-sm">
      {description}
    </div>

    <div className="flex w-full select-none items-center justify-start gap-2">
      <div className="size-7 rounded-full flex-shrink-0 overflow-hidden">
        <img
          src={img}
          alt={name}
          draggable={false}
          className={cn(
            "size-full object-cover",
            img?.includes("yael-dror") && "scale-150 object-top",
            img?.includes("user-icon") && "dark:invert"
          )}
        />
      </div>

      <div className="min-w-0 overflow-hidden">
        <p className="font-medium text-primary/90 text-xs truncate">{name}</p>
        <p className="text-xs font-normal text-primary/50 truncate">{role}</p>
      </div>
    </div>
  </div>
);

interface Testimonial {
  id: string;
  name: string;
  role: string;
  img: string;
  description: React.ReactNode;
}

function isAnonymousTestimonial(testimonial: Testimonial) {
  return testimonial.name.trim().toLowerCase() === "anonymous";
}

function buildAnonymousGapSizes(
  namedCount: number,
  anonymousCount: number
) {
  const gapSizes = Array.from({ length: namedCount }, () => 0);
  const separableGaps = Math.min(anonymousCount, namedCount - 1);

  for (let index = 0; index < separableGaps; index += 1) {
    gapSizes[index] = 1;
  }

  let remainingAnonymous = anonymousCount - separableGaps;

  while (remainingAnonymous > 0) {
    const smallestGap = Math.min(...gapSizes);

    for (let index = gapSizes.length - 1; index >= 0; index -= 1) {
      if (gapSizes[index] !== smallestGap) {
        continue;
      }

      gapSizes[index] += 1;
      remainingAnonymous -= 1;
      break;
    }
  }

  return gapSizes;
}

function spreadNamedTestimonials(testimonials: Testimonial[]) {
  const namedTestimonials = testimonials.filter(
    (testimonial) => !isAnonymousTestimonial(testimonial)
  );
  const anonymousTestimonials = testimonials.filter(isAnonymousTestimonial);

  if (namedTestimonials.length <= 1 || anonymousTestimonials.length === 0) {
    return testimonials;
  }

  const orderedTestimonials: Testimonial[] = [];
  const remainingAnonymous = [...anonymousTestimonials];
  const anonymousGapSizes = buildAnonymousGapSizes(
    namedTestimonials.length,
    anonymousTestimonials.length
  );

  // Spread named testimonials across the marquee loop and keep the opening
  // viewport as trust-heavy as possible.
  namedTestimonials.forEach((testimonial, index) => {
    orderedTestimonials.push(testimonial);

    for (let count = 0; count < anonymousGapSizes[index]; count += 1) {
      const anonymousTestimonial = remainingAnonymous.shift();

      if (!anonymousTestimonial) {
        break;
      }

      orderedTestimonials.push(anonymousTestimonial);
    }
  });

  return orderedTestimonials;
}

export function SocialProofTestimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const orderedTestimonials = spreadNamedTestimonials(testimonials);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden py-8">
        <Marquee className="[--duration:60s]" dragToScroll>
          {orderedTestimonials.map((card) => {
            return (
              <div
                key={card.id}
                className="w-[420px] min-h-[200px] flex justify-center"
              >
                <TestimonialCard {...card} className="w-full break-words" />
              </div>
            )
          })}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/12 bg-gradient-to-r from-background from-20%"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/12 bg-gradient-to-l from-background from-20%"></div>
      </div>
    </div>
  );
}
