'use client'

import Link from "next/link"
import { Github, Linkedin, Mail, ExternalLink } from "lucide-react"
import { motion } from "motion/react"
import Image from "next/image"
import { ResumeCard } from "@/components/resume-card"

const BLUR_FADE_DELAY = 0.04

const BlurFadeText = ({ text, className, delay }: { text: string; className?: string; delay: number }) => (
  <motion.h1
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={className}
  >
    {text}
  </motion.h1>
)

const BlurFade = ({ children, delay }: { children: React.ReactNode; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    {children}
  </motion.div>
)

export default function PortfolioClient() {
  return (
    <main className="flex flex-col min-h-[100dvh] space-y-10 bg-background py-20">
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4">
        {/* Hero Section */}
        <section id="hero">
          <div className="gap-2 flex justify-between">
            <div className="flex-col flex flex-1 space-y-1.5">
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                text="Anders H. Chan, PsyD"
              />
              <BlurFadeText
                delay={BLUR_FADE_DELAY * 2}
                className="max-w-[600px] md:text-xl text-muted-foreground"
                text="Clinical Psychologist"
              />
            </div>
            <BlurFade delay={BLUR_FADE_DELAY * 3}>
              <div className="flex items-center justify-center size-28 rounded-full border-2 border-primary/20 flex-shrink-0 overflow-hidden">
                <Image
                  src="/images/profilepic.png"
                  alt="Anders H. Chan"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
            </BlurFade>
          </div>
        </section>

        {/* About Section */}
        <section id="about">
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <h2 className="text-xl font-bold">About</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <p className="text-pretty font-sans text-sm text-muted-foreground">
              Right after finishing my postdoc, I took my first EPPP diagnostic. I scored a 19%.
              <br />
              <br />
              Even with years of schooling and wide clinical experience, the traditional study model was not enough.
              <br />
              <br />
              A month later, I passed on my first try with a 588.
              <br />
              <br />
              Here's the brutal truth: The EPPP industry is built on friction. The "traditional" way of studying is designed to be miserable, and paid programs are often built on "misdirected calculations" that lead you to study the wrong material. They waste the money you don't have after paying the f*cking registration fee, and time between sessions and at home. That is a miserable scam. Life happens. People get sick, they transition, they experience loss. You don't have time for a broken system.
              <br />
              <br />
              I used LLMs to accelerate my learning. I built a blueprint that allowed me to pass in 30 days, live a full life outside of psychology, and still gain knowledge that makes me a better clinician because I didn't burn out.
              <br />
              <br />
              I give away this entire blueprint for free on TikTok. I built an AI to execute it even more efficiently. If I can go from 19% to a 588 in one month, I have a feeling that so can others.
            </p>
          </BlurFade>
        </section>

        {/* Work Experience Section */}
        <section id="work">
          <div className="flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * 6}>
              <h2 className="text-xl font-bold">Work Experience</h2>
            </BlurFade>

            {[
              {
                company: "David Geffen School of Medicine at UCLA",
                title: "Postdoctoral Fellow",
                period: "Sep 2024 - Sep 2025",
                location: "Los Angeles, California",
              },
              {
                company: "NYU Langone Health",
                title: "Psychology Intern",
                period: "Sep 2023 - Aug 2024",
                location: "Brooklyn, New York",
              },
              {
                company: "TherapyMyWay",
                title: "Psychotherapist",
                period: "Aug 2022 - Jul 2023",
                location: "Remote",
              },
              {
                company: "Brooklyn Center for Psychotherapy",
                title: "Psychotherapist",
                period: "Sep 2021 - Jul 2023",
                location: "Brooklyn, New York",
              },
              {
                company: "Montefiore Einstein - Supporting Healthy Relationships",
                title: "Psychology Extern",
                period: "Jul 2020 - Jun 2021",
                location: "Bronx, New York",
              },
              {
                company: "Long Island University",
                title: "Graduate Research Assistant & Therapist",
                period: "Sep 2018 - Sep 2020",
                location: "Brooklyn, New York",
              },
            ].map((work, idx) => (
              <BlurFade key={work.company} delay={BLUR_FADE_DELAY * 7 + idx * 0.05}>
                <ResumeCard
                  title={work.company}
                  subtitle={work.title}
                  period={work.period}
                  description={work.location}
                />
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Education Section */}
        <section id="education">
          <div className="flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * 13}>
              <h2 className="text-xl font-bold">Education</h2>
            </BlurFade>

            {[
              {
                school: "Long Island University",
                degree: "Psy.D. (Doctor of Psychology)",
                period: "2018 - 2024",
                description: "Dissertation: Acceptability and Cultural Considerations of DBT-A for Chinese Mental Health Professionals",
              },
            ].map((edu, idx) => (
              <BlurFade key={edu.school} delay={BLUR_FADE_DELAY * 14 + idx * 0.05}>
                <ResumeCard
                  title={edu.school}
                  subtitle={edu.degree}
                  period={edu.period}
                  description={edu.description}
                />
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Publications Section */}
        <section id="publications">
          <div className="flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * 15}>
              <h2 className="text-xl font-bold">Publications</h2>
            </BlurFade>

            {[
              {
                title: "Visual attentional differences in psychology students with and without disabilities: a pilot study assessing the flanker task for prescriptive visual accommodative technologies",
                venue: "Frontiers in Psychology",
                year: "2025",
                href: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1484536/full",
              },
            ].map((pub, idx) => (
              <BlurFade key={pub.title} delay={BLUR_FADE_DELAY * 16 + idx * 0.05}>
                <Link
                  href={pub.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-4 rounded-lg border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300 p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {pub.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{pub.venue}</p>
                    <p className="text-sm text-muted-foreground">{pub.year}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </Link>
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact">
          <div className="grid items-center justify-center gap-4 text-center w-full py-12">
            <BlurFade delay={BLUR_FADE_DELAY * 21}>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter">Get in Touch</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground">
                  Interested in collaborating on educational technology, clinical innovation, or the EPPP platform? I'd love to connect.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={BLUR_FADE_DELAY * 22}>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="https://www.linkedin.com/in/anders-h-chan/"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Link>
                <Link
                  href="mailto:contact@example.com"
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Link>
              </div>
            </BlurFade>
          </div>
        </section>
      </div>
    </main>
  )
}
