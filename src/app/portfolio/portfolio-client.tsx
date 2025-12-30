'use client'

import Link from "next/link"
import { Linkedin, Mail, ExternalLink } from "lucide-react"
import { motion } from "motion/react"
import Image from "next/image"
import { ResumeCard } from "@/components/resume-card"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

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

interface TeamMember {
  id: string
  name: string
  title: string
  photo: string
  about: string
  workExperience: Array<{ company: string; title: string; period: string; location: string }>
  education: Array<{ school: string; degree: string; period: string; description?: string }>
  publications: Array<{ title: string; venue: string; year: string; href?: string }>
  contact: { linkedin?: string; email?: string }
}

const teamMembers: TeamMember[] = [
  {
    id: "anders",
    name: "Anders H. Chan, PsyD",
    title: "Clinical Psychologist",
    photo: "/images/profilepic.png",
    about: `Right after finishing my postdoc, I took my first EPPP diagnostic. I scored a 19%.

Even with years of schooling and wide clinical experience, the traditional study model was not enough.

A month later, I passed on my first try with a 588.

Here's the brutal truth: The EPPP industry is built on friction. The "traditional" way of studying is designed to be miserable, and paid programs are often built on "misdirected calculations" that lead you to study the wrong material. They waste the money you don't have after paying the f*cking registration fee, and time between sessions and at home. That is a miserable scam. Life happens. People get sick, they transition, they experience loss. You don't have time for a broken system.

I used LLMs to accelerate my learning. I built a blueprint that allowed me to pass in 30 days, live a full life outside of psychology, and still gain knowledge that makes me a better clinician because I didn't burn out.

I give away this entire blueprint for free on TikTok. I built an AI to execute it even more efficiently. If I can go from 19% to a 588 in one month, I have a feeling that so can others.`,
    workExperience: [
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
    ],
    education: [
      {
        school: "Long Island University",
        degree: "Psy.D. (Doctor of Psychology)",
        period: "2018 - 2024",
        description: "Dissertation: Acceptability and Cultural Considerations of DBT-A for Chinese Mental Health Professionals",
      },
    ],
    publications: [
      {
        title: "Visual attentional differences in psychology students with and without disabilities: a pilot study assessing the flanker task for prescriptive visual accommodative technologies",
        venue: "Frontiers in Psychology",
        year: "2025",
        href: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1484536/full",
      },
    ],
    contact: {
      linkedin: "https://www.linkedin.com/in/anders-h-chan/",
      email: "contact@thepsychology.ai",
    },
  },
  {
    id: "yael",
    name: "Yael Dror, PsyD",
    title: "Clinical Psychologist",
    photo: "/images/yael-dror.png",
    about: `I'm a clinical psychologist with extensive experience across outpatient therapy, psychological assessment, and crisis intervention. My training spans multiple settings including The Family Institute at Northwestern University, Advocate IL Masonic Medical Center, and specialized work with children, adolescents, and adults presenting with complex emotional and behavioral challenges.

I'm passionate about evidence-based practice and have contributed research on the intersection of social media and therapeutic processes. My clinical work has involved treating a wide range of presentations including depression, anxiety, trauma, OCD, and substance use disorders across diverse populations.

I graduated Magna Cum Laude from SUNY Albany and was inducted into Psi Chi, the International Honor Society in Psychology. I bring both rigorous academic training and hands-on clinical expertise to my work.`,
    workExperience: [
      {
        company: "The Family Institute at Northwestern University",
        title: "Postdoctoral Fellow",
        period: "Sep 2025 - Sep 2026",
        location: "Evanston, Illinois",
      },
      {
        company: "Advocate IL Masonic Medical Center",
        title: "Clinical Intern",
        period: "Sep 2024 - Aug 2025",
        location: "Chicago, Illinois",
      },
      {
        company: "Interaction Dynamics",
        title: "Clinical Advanced Extern",
        period: "Jul 2023 - Present",
        location: "Chicago, Illinois",
      },
      {
        company: "Advocate IL Masonic Medical Center",
        title: "Clinical Therapy Extern",
        period: "Jul 2022 - Jun 2023",
        location: "Chicago, Illinois",
      },
      {
        company: "The Sonia Shankman Orthogenic School",
        title: "Clinical Diagnostic Extern",
        period: "Aug 2021 - Jun 2022",
        location: "Chicago, Illinois",
      },
      {
        company: "CrisisTextLine",
        title: "Crisis Counselor",
        period: "Jan 2018 - May 2019",
        location: "Remote",
      },
    ],
    education: [
      {
        school: "The Chicago School of Professional Psychology",
        degree: "Psy.D. in Clinical Psychology",
        period: "2020 - 2025",
        description: "APA Accredited",
      },
      {
        school: "The Chicago School of Professional Psychology",
        degree: "M.A. in Clinical Psychology",
        period: "2020 - 2022",
        description: "APA Accredited",
      },
      {
        school: "University at Albany (SUNY)",
        degree: "B.A. in Psychology and Human Development",
        period: "2015 - 2019",
        description: "Magna Cum Laude, Psi Chi Honor Society",
      },
    ],
    publications: [
      {
        title: "The Relationship Between Therapists' Awareness of Social Media and Their Likeliness to Take Action in the Therapeutic Process",
        venue: "Midwestern Psychological Association",
        year: "2024",
      },
      {
        title: "The Association Between Instagram Use and Eating Disorder Pathology",
        venue: "University at Albany Undergraduate Conference",
        year: "2019",
      },
      {
        title: "Self-compassion moderates the association between compulsive exercise and eating pathology",
        venue: "Association for Behavioral and Cognitive Therapies",
        year: "2018",
      },
    ],
    contact: {
      linkedin: "https://www.linkedin.com/in/yaeldror",
    },
  },
]

export default function PortfolioClient() {
  const searchParams = useSearchParams()
  const memberParam = searchParams.get("member")

  const getInitialTab = () => {
    if (memberParam) {
      const idx = teamMembers.findIndex(m => m.id === memberParam)
      return idx >= 0 ? idx : 0
    }
    return 0
  }

  const [activeTab, setActiveTab] = useState(getInitialTab)
  const member = teamMembers[activeTab]

  // Update tab when URL param changes
  useEffect(() => {
    if (memberParam) {
      const idx = teamMembers.findIndex(m => m.id === memberParam)
      if (idx >= 0) setActiveTab(idx)
    }
  }, [memberParam])

  return (
    <main className="flex flex-col min-h-[100dvh] space-y-10 bg-background py-20">
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4">
        {/* Tab Navigation */}
        <div className="flex gap-8 border-b border-border">
          {teamMembers.map((tm, idx) => (
            <button
              key={tm.id}
              onClick={() => setActiveTab(idx)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === idx
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/80"
              }`}
            >
              {tm.name.split(",")[0]}
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Hero Section */}
        <section id="hero">
          <div className="gap-2 flex justify-between">
            <div className="flex-col flex flex-1 space-y-1.5">
              <BlurFadeText
                key={`name-${member.id}`}
                delay={BLUR_FADE_DELAY}
                className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                text={member.name}
              />
              <BlurFadeText
                key={`title-${member.id}`}
                delay={BLUR_FADE_DELAY * 2}
                className="max-w-[600px] md:text-xl text-muted-foreground"
                text={member.title}
              />
            </div>
            <BlurFade key={`photo-${member.id}`} delay={BLUR_FADE_DELAY * 3}>
              <div className="flex items-center justify-center size-28 rounded-full border-2 border-primary/20 flex-shrink-0 overflow-hidden">
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </BlurFade>
          </div>
        </section>

        {/* About Section */}
        <section id="about">
          <BlurFade key={`about-title-${member.id}`} delay={BLUR_FADE_DELAY * 4}>
            <h2 className="text-xl font-bold">About</h2>
          </BlurFade>
          <BlurFade key={`about-content-${member.id}`} delay={BLUR_FADE_DELAY * 5}>
            <p className="text-pretty font-sans text-sm text-muted-foreground whitespace-pre-line">
              {member.about}
            </p>
          </BlurFade>
        </section>

        {/* Work Experience Section */}
        <section id="work">
          <div className="flex min-h-0 flex-col gap-y-3">
            <BlurFade key={`work-title-${member.id}`} delay={BLUR_FADE_DELAY * 6}>
              <h2 className="text-xl font-bold">Work Experience</h2>
            </BlurFade>

            {member.workExperience.map((work, idx) => (
              <BlurFade key={`${member.id}-work-${idx}`} delay={BLUR_FADE_DELAY * 7 + idx * 0.05}>
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
            <BlurFade key={`edu-title-${member.id}`} delay={BLUR_FADE_DELAY * 13}>
              <h2 className="text-xl font-bold">Education</h2>
            </BlurFade>

            {member.education.map((edu, idx) => (
              <BlurFade key={`${member.id}-edu-${idx}`} delay={BLUR_FADE_DELAY * 14 + idx * 0.05}>
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
            <BlurFade key={`pub-title-${member.id}`} delay={BLUR_FADE_DELAY * 15}>
              <h2 className="text-xl font-bold">Publications</h2>
            </BlurFade>

            {member.publications.map((pub, idx) => (
              <BlurFade key={`${member.id}-pub-${idx}`} delay={BLUR_FADE_DELAY * 16 + idx * 0.05}>
                {pub.href ? (
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
                ) : (
                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/50 p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {pub.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{pub.venue}</p>
                      <p className="text-sm text-muted-foreground">{pub.year}</p>
                    </div>
                  </div>
                )}
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact">
          <div className="grid items-center justify-center gap-4 text-center w-full py-12">
            <BlurFade key={`contact-title-${member.id}`} delay={BLUR_FADE_DELAY * 21}>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter">Get in Touch</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground">
                  Interested in collaborating on educational technology, clinical innovation, or the EPPP platform? We'd love to connect.
                </p>
              </div>
            </BlurFade>

            <BlurFade key={`contact-buttons-${member.id}`} delay={BLUR_FADE_DELAY * 22}>
              <div className="flex gap-4 justify-center flex-wrap">
                {member.contact.linkedin && (
                  <Link
                    href={member.contact.linkedin}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Link>
                )}
                {member.contact.email && (
                  <Link
                    href={`mailto:${member.contact.email}`}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Link>
                )}
              </div>
            </BlurFade>
          </div>
        </section>
      </div>
    </main>
  )
}
