"use client";

import React, { forwardRef, useRef } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "border-border z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white dark:bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function SecondBentoAnimation({
  className,
}: {
  className?: string;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full items-center justify-center overflow-visible p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center gap-2">
          <Circle ref={div1Ref}>
            <Image
              src="/openai.svg"
              alt="OpenAI"
              width={40}
              height={40}
              className="size-10"
            />
          </Circle>
          <Circle ref={div2Ref}>
            <Image
              src="/claude.png"
              alt="Claude"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Circle>
          <Circle ref={div3Ref}>
            <Image
              src="/notebooklm.png"
              alt="NotebookLM"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div6Ref} className="size-16 bg-black dark:bg-black">
            <Image
              src="/images/logo.png"
              alt="Company Logo"
              width={48}
              height={48}
              className="size-10"
            />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div7Ref}>
            <UserIcon />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div6Ref}
        curvature={50}
        pathColor="#9ca3af"
        gradientStartColor="#a855f7"
        gradientStopColor="#a855f7"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div6Ref}
        curvature={50}
        pathColor="#9ca3af"
        gradientStartColor="#a855f7"
        gradientStopColor="#a855f7"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div6Ref}
        curvature={50}
        pathColor="#9ca3af"
        gradientStartColor="#a855f7"
        gradientStopColor="#a855f7"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div7Ref}
        pathColor="#9ca3af"
        gradientStartColor="#a855f7"
        gradientStopColor="#a855f7"
      />
    </div>
  );
}

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="#000000" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20c0-4 2.5-6 6-6s6 2 6 6" />
  </svg>
);
