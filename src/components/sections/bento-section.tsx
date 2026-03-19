"use client";

import { SectionHeader } from "@/components/section-header";
import { siteConfig } from "@/lib/config";
import { motion } from "motion/react";

export function BentoSection() {
  const { title, subtitle, items } = siteConfig.bentoSection;
  const descriptionLines = [
    "80+ focused lessons. Adaptive quizzes after each one.",
    "Full-length practice exams that simulate the real thing. And a recovery system for when the anxiety hits.",
  ]
  const normalizedItems = items.map((item) => ({
    ...item,
    title: item.title.replace(/\bReplenish\b/g, "Recover"),
    description: item.description.replace(/[ \t]*—[ \t]*/g, " "),
  }));

  return (
    <section
      id="bento"
      className="flex flex-col items-center justify-center w-full relative px-5 md:px-10"
    >
      <div className="border-x mx-5 md:mx-10 relative">
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>

        <SectionHeader>
          <div className="flex max-w-4xl flex-col items-center gap-4 pb-3">
            <h2 className="max-w-3xl text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance leading-[0.98]">
              {title}
            </h2>
            <p className="max-w-4xl text-base font-medium leading-relaxed text-muted-foreground text-center text-balance">
              {subtitle}
            </p>
          </div>
          <div className="max-w-4xl space-y-1.5 text-center text-base font-medium leading-relaxed text-muted-foreground">
            {descriptionLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </SectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {normalizedItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex flex-col items-start justify-end min-h-[600px] md:min-h-[500px] p-0.5 relative before:absolute before:-left-0.5 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-0.5 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] group cursor-pointer max-h-[400px] group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative flex size-full items-center justify-center h-full overflow-hidden">
                {item.content}
              </div>
              <div className="flex-1 flex-col gap-2 p-6">
                <h3 className="text-lg tracking-tighter font-semibold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
