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
      "flex cursor-pointer break-inside-avoid flex-col items-start justify-between gap-3 rounded-xl p-3",
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
      <img
        src={img}
        alt={name}
        className={cn(
          "size-7 rounded-full flex-shrink-0",
          img?.includes("user-icon") && "dark:invert"
        )}
      />

      <div>
        <p className="font-medium text-primary/90 text-xs">{name}</p>
        <p className="text-xs font-normal text-primary/50">{role}</p>
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

export function SocialProofTestimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <div className="w-full">
      <div className="relative overflow-hidden py-8">
        <Marquee className="[--duration:60s]">
          {testimonials.map((card, idx) => {
            const isMenon = card.name.toLowerCase().includes("menon")
            const widthClass = isMenon ? "w-[460px]" : "w-[380px]"
            const cardClassName = cn(
              "h-full w-full break-words",
              isMenon ? "max-w-[420px] mx-auto" : "max-w-full"
            )
            return (
              <div
                key={idx}
                className={`${widthClass} h-[180px] px-1 flex justify-center`}
              >
                <TestimonialCard {...card} className={cardClassName} />
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
