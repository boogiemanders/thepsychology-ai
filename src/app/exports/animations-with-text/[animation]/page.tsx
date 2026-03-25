import { FirstBentoAnimation } from "@/components/first-bento-animation";
import { FourthBentoAnimation } from "@/components/fourth-bento-animation";
import { SecondBentoAnimation } from "@/components/second-bento-animation";
import { ThirdBentoAnimation } from "@/components/third-bento-animation";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type AnimationCardConfig = {
  title: string;
  description: string;
  render: () => ReactNode;
  scale: number;
  translateY: number;
  descriptionClassName?: string;
};

const animationCardMap: Record<string, AnimationCardConfig> = {
  "first-bento": {
    title: "Study What Matters",
    description:
      "We show you the highest-yield topics so every hour moves your score.",
    render: () => (
      <FirstBentoAnimation
        responseSpeed={100}
        revealDelayMs={0}
        showBottomFade={false}
      />
    ),
    scale: 1.92,
    translateY: -22,
    descriptionClassName: "text-[52px] leading-[1.2]",
  },
  "second-bento": {
    title: "Frictionless Studying",
    description: "Everything you need. Nothing you don't.",
    render: () => <SecondBentoAnimation className="h-full w-full p-16" />,
    scale: 1.28,
    translateY: -30,
    descriptionClassName: "text-[52px] leading-[1.2]",
  },
  "third-bento": {
    title: "Make It Stick",
    description: "Turns dense theory into customized and clear examples.",
    render: () => (
      <ThirdBentoAnimation
        responseSpeed={20}
        revealDelayMs={0}
        showBottomFade={false}
      />
    ),
    scale: 1.9,
    translateY: -22,
    descriptionClassName: "text-[52px] leading-[1.2]",
  },
  "fourth-bento": {
    title: "Recover",
    description:
      "Evidence-based resets for focus and burnout. Built on ACT, MI, and CBT-I techniques you'll use in practice.",
    render: () => (
      <FourthBentoAnimation
        responseSpeed={100}
        revealDelayMs={0}
        showBottomFade={false}
      />
    ),
    scale: 1.9,
    translateY: -22,
    descriptionClassName: "text-[46px] leading-[1.16]",
  },
};

type PageParams = {
  animation: string;
};

export default async function ExportAnimationWithTextPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { animation } = await params;
  const animationCard = animationCardMap[animation];

  if (!animationCard) {
    notFound();
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#edf0f2] flex items-center justify-center p-0">
      <div
        data-export-canvas
        className="relative w-[1080px] h-[1080px] bg-[#edf0f2] overflow-hidden border border-black/5"
      >
        <style>{`
          nextjs-portal,
          #__next-build-watcher,
          [data-nextjs-toast],
          [data-nextjs-dev-tools-button] {
            display: none !important;
            visibility: hidden !important;
          }
        `}</style>
        <div className="absolute inset-x-0 top-[-228px] h-[940px] flex items-start justify-center overflow-visible">
          <div className="relative w-[990px] h-[670px] mt-0 rounded-3xl overflow-visible">
            <div
              className="absolute inset-0"
              style={{
                transformOrigin: "top center",
                transform: `translateY(${animationCard.translateY}px) scale(${animationCard.scale})`,
              }}
            >
              {animationCard.render()}
            </div>
          </div>
        </div>

        <div className="absolute left-12 right-12 bottom-24">
          <h2 className="text-[56px] leading-[1.04] font-semibold tracking-[-0.02em] text-black">
            {animationCard.title}
          </h2>
          <p
            className={`mt-4 tracking-[-0.02em] text-black/55 ${
              animationCard.descriptionClassName ?? "text-[52px] leading-[1.2]"
            }`}
          >
            {animationCard.description}
          </p>
        </div>
      </div>
    </div>
  );
}
