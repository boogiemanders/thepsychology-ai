import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  hoverText?: string
  inverted?: boolean
  dotClassName?: string
  hoverTextClassName?: string
  size?: 'default' | 'sm'
  fillHover?: boolean
  fillHoverOffsetClass?: string
}

export function InteractiveHoverButton({
  text = "Get Started",
  hoverText = "Start",
  inverted = false,
  dotClassName,
  hoverTextClassName,
  size = "default",
  className,
  children,
  fillHover = false,
  fillHoverOffsetClass = "left-8",
  ...props
}: InteractiveHoverButtonProps) {
  const sizeClasses = size === "sm" ? "px-3 py-0.5 text-xs" : "px-6 py-2"

  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border text-center font-semibold transition-colors duration-300",
        sizeClasses,
        inverted
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground",
        fillHover && "transition-colors duration-300",
        className
      )}
      {...props}
    >
      {fillHover && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 z-0 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-transform duration-500 group-hover:scale-[200]",
            fillHoverOffsetClass
          )}
        />
      )}
      <div className="relative flex items-center gap-2 z-10">
        <div className={cn(
          "h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]",
          inverted ? "bg-primary-foreground" : "bg-primary",
          dotClassName,
          fillHover && "opacity-0"
        )}></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children || text}
        </span>
      </div>
      <div
        className={cn(
          "absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100",
          inverted ? "text-primary" : "text-primary-foreground",
          hoverTextClassName
        )}
      >
        <span>{hoverText}</span>
        <ArrowRight />
      </div>
    </button>
  )
}
