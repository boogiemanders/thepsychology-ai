import { FirstBentoAnimation } from "@/components/first-bento-animation";
import { FourthBentoAnimation } from "@/components/fourth-bento-animation";
import { SecondBentoAnimation } from "@/components/second-bento-animation";
import { ThirdBentoAnimation } from "@/components/third-bento-animation";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type AnimationConfig = {
  title: string;
  render: () => ReactNode;
};

const animationMap: Record<string, AnimationConfig> = {
  "first-bento": {
    title: "First Bento Animation",
    render: () => <FirstBentoAnimation />,
  },
  "third-bento": {
    title: "Third Bento Animation",
    render: () => <ThirdBentoAnimation />,
  },
  "fourth-bento": {
    title: "Fourth Bento Animation",
    render: () => <FourthBentoAnimation />,
  },
  "second-bento": {
    title: "Second Bento Animation",
    render: () => <SecondBentoAnimation className="h-full w-full p-16" />,
  },
  molecule: {
    title: "Molecule Animation",
    render: () => <SecondBentoAnimation className="h-full w-full p-16" />,
  },
};

type PageParams = {
  animation: string;
};

export default async function ExportAnimationPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { animation } = await params;
  const animationConfig = animationMap[animation];

  if (!animationConfig) {
    notFound();
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-0">
      <div
        data-export-canvas
        className="relative w-[1280px] h-[720px] bg-background overflow-hidden flex items-center justify-center"
      >
        <div className="relative w-[980px] h-[580px] border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
          {animationConfig.render()}
        </div>

        <div className="absolute left-6 bottom-4 text-xs text-muted-foreground tracking-wide">
          {animationConfig.title}
        </div>
      </div>
    </div>
  );
}
