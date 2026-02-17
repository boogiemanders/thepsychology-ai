import type React from "react"
import { cn } from "@/lib/utils"
import { FirstBentoAnimation } from "@/components/first-bento-animation"
import { SecondBentoAnimation } from "@/components/second-bento-animation"
import { ThirdBentoAnimation } from "@/components/third-bento-animation"
import { FourthBentoAnimation } from "@/components/fourth-bento-animation"

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <span
      className={cn(
        "p-1 py-0.5 font-medium dark:font-semibold text-brand-coral",
        className
      )}
    >
      {children}
    </span>
  )
}

export const BLUR_FADE_DELAY = 0.15

export const siteConfig = {
  name: "thePsychology.ai",
  description:
    "Free AI-adaptive EPPP exam prep — 80+ lessons, practice exams, and high-yield study materials built by psychologists who passed.",
  cta: "Get Started",
  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production" ? "https://thepsychology.ai" : "http://localhost:3000"),
  keywords: [
    "EPPP",
    "EPPP exam prep",
    "EPPP prep",
    "EPPP practice questions",
    "EPPP practice tests",
    "EPPP sample exam",
    "EPPP practice questions 2025-2026",
    "EPPP study materials",
    "EPPP study materials PDF",
    "EPPP study programs",
    "EPPP sections",
    "EPPP scoring",
    "EPPP score range",
    "EPPP score transfer",
    "EPPP sign up",
  ],
  links: {
    email: "drchan@thepsychology.ai",
    twitter: "https://twitter.com/thepsychologyai",
    discord: "https://discord.gg/thepsychologyai",
    github: "https://github.com/thepsychologyai",
    instagram: "https://instagram.com/thepsychologyai",
  },
  nav: {
    links: [
      { id: 1, name: "About", href: "/portfolio" },
      { id: 2, name: "How it Works", href: "#bento" },
      { id: 4, name: "Pricing", href: "#get-started" },
    ],
  },
  hero: {
    badgeIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dark:fill-white fill-[#364153]"
      >
        <path d="M7.62758 1.09876C7.74088 1.03404 7.8691 1 7.99958 1C8.13006 1 8.25828 1.03404 8.37158 1.09876L13.6216 4.09876C13.7363 4.16438 13.8316 4.25915 13.8979 4.37347C13.9642 4.48779 13.9992 4.6176 13.9992 4.74976C13.9992 4.88191 13.9642 5.01172 13.8979 5.12604C13.8316 5.24036 13.7363 5.33513 13.6216 5.40076L8.37158 8.40076C8.25828 8.46548 8.13006 8.49952 7.99958 8.49952C7.8691 8.49952 7.74088 8.46548 7.62758 8.40076L2.37758 5.40076C2.26287 5.33513 2.16753 5.24036 2.10123 5.12604C2.03492 5.01172 2 4.88191 2 4.74976C2 4.6176 2.03492 4.48779 2.10123 4.37347C2.16753 4.25915 2.26287 4.16438 2.37758 4.09876L7.62758 1.09876Z" />
        <path d="M2.56958 7.23928L2.37758 7.34928C2.26287 7.41491 2.16753 7.50968 2.10123 7.624C2.03492 7.73831 2 7.86813 2 8.00028C2 8.13244 2.03492 8.26225 2.10123 8.37657C2.16753 8.49089 2.26287 8.58566 2.37758 8.65128L7.62758 11.6513C7.74088 11.716 7.8691 11.75 7.99958 11.75C8.13006 11.75 8.25828 11.716 8.37158 11.6513L13.6216 8.65128C13.7365 8.58573 13.8321 8.49093 13.8986 8.3765C13.965 8.26208 14 8.13211 14 7.99978C14 7.86745 13.965 7.73748 13.8986 7.62306C13.8321 7.50864 13.7365 7.41384 13.6216 7.34828L13.4296 7.23828L9.11558 9.70328C8.77568 9.89744 8.39102 9.99956 7.99958 9.99956C7.60814 9.99956 7.22347 9.89744 6.88358 9.70328L2.56958 7.23928Z" />
        <path d="M2.37845 10.5993L2.57045 10.4893L6.88445 12.9533C7.22435 13.1474 7.60901 13.2496 8.00045 13.2496C8.39189 13.2496 8.77656 13.1474 9.11645 12.9533L13.4305 10.4883L13.6225 10.5983C13.7374 10.6638 13.833 10.7586 13.8994 10.8731C13.9659 10.9875 14.0009 11.1175 14.0009 11.2498C14.0009 11.3821 13.9659 11.5121 13.8994 11.6265C13.833 11.7409 13.7374 11.8357 13.6225 11.9013L8.37245 14.9013C8.25915 14.966 8.13093 15 8.00045 15C7.86997 15 7.74175 14.966 7.62845 14.9013L2.37845 11.9013C2.2635 11.8357 2.16795 11.7409 2.10148 11.6265C2.03501 11.5121 2 11.3821 2 11.2498C2 11.1175 2.03501 10.9875 2.10148 10.8731C2.16795 10.7586 2.2635 10.6638 2.37845 10.5983V10.5993Z" />
      </svg>
    ),
    badge: "",
    title: "Study Less. Score Higher.",
    description:
      "with",
    cta: {
      primary: { text: "Start Free", href: "/#get-started" },
      secondary: { text: "Login", href: "/login" },
    },
  },
  companyShowcase: {
    title: "Built by psychologists, neuroscientists & researchers from (not affiliated with):",
    subtitle: null,
    companyLogos: [
      { id: 1, name: "UCLA-David Geffen School of Medicine", src: "/dgsom.png", member: "anders", invert: true, width: 160 },
      { id: 2, name: "NYU Langone Health", src: "/nyu.png", member: "anders", invert: true },
      { id: 3, name: "Montefiore Einstein", src: "/monte.png", member: "anders", invert: true },
      { id: 4, name: "LIU Post", src: "/liu.png", member: "anders", invert: true },
      { id: 5, name: "Pratt Institute", src: "/pratt.png", member: "anders", invert: true },
      { id: 6, name: "Northwestern University", src: "/northwestern.png", member: "yael" },
      { id: 7, name: "The Chicago School", src: "/chicago-school.png", member: "yael" },
      { id: 8, name: "Albert Einstein College of Medicine", src: "/einstein.png", member: "anders", invert: true },
    ],
  },
  bentoSection: {
    title: "What You Get",
    description: "80+ lessons. Adaptive quizzes. Exam simulation. And one feature no other EPPP program offers.",
    items: [
      {
        id: 1,
        content: <FirstBentoAnimation />,
        title: "Study What Matters",
        description: "We show you the highest-yield topics so every hour moves your score.",
      },
      {
        id: 2,
        content: <ThirdBentoAnimation />,
        title: "Make It Stick",
        description:
          "Turns dense theory into customized and clear examples.",
      },
      {
        id: 3,
        content: <FourthBentoAnimation />,
        title: "Replenish",
        description:
          "Evidence-based resets for focus and burnout. Built on ACT, MI, and CBT-I — techniques you'll use in practice.",
      },
      {
        id: 4,
        content: <SecondBentoAnimation />,
        title: "Frictionless Studying",
        description: "Everything you need. Nothing you don’t",
      },
    ],
  },
  featureSection: {
    title: "Everything You Need to Pass",
    description: "Multimodal, adaptive, and available whenever you are.",
    items: [
      {
        id: 1,
        title: "Multimodal Learning",
        description: "Learn through text, audio, and video - choose what works best for you",
        icon: "📚",
      },
      {
        id: 2,
        title: "Adaptive Practice",
        description: "Smart quizzes that focus on your weak areas and track your progress",
        icon: "🎯",
      },
      {
        id: 3,
        title: "Mobile Friendly",
        description: "Study anywhere, anytime on any device with our responsive platform",
        icon: "📱",
      },
      {
        id: 4,
        title: "Expert Support",
        description: "Get personalized coaching from Dr. Anders Chan, who scored 588",
        icon: "👨‍⚕️",
      },
    ],
  },
  quoteSection: {
    quote: (
      <>
        I poured $1k and a month into studying and passed on my first try. This is the program that gives you everything I did and wish I had for a <Highlight>fraction of the time, cost, and stress</Highlight>.
      </>
    ),
    author: {
      name: "Anders H. Chan, Psy.D.",
      role: "Founder - thePsychology.ai",
      image: "/images/anders-chan.png",
    },
  },
  pricing: {
    title: "Claim Your Spot",
    description: "No credit card required. Start studying in 2 minutes.",
    pricingItems: [
      {
        name: "Pro",
        href: "/#get-started",
        price: "$0",
        period: "month",
        yearlyPrice: "n/a",
        features: ["Learn: 80+ text + audio lessons", "Practice: 10-min targeted quizzes", "Simulate: Real exam tools (highlight, flag, timer)", "Personalize: Custom metaphors + focus areas", "Recover: 5-min mental resets"],
        featuresLabel: "Everything includes:",
        description: "($100/mo value)",
        buttonText: "Claim Your Free Spot",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: true,
        displayPrice: "$0/month",
      },
      {
        name: "Pro + Coaching",
        href: "/#get-started",
        price: "$500",
        period: "month",
        yearlyPrice: "$5000",
        features: ["Includes: Everything in Pro", "Coach: 2× 45-min calls/month", "Plan: Custom study roadmap", "Support: Priority response", "Compare: $900 over 12 months → pass in 1"],
        featuresLabel: "Everything in Pro plus:",
        description: "2 calls/month with Dr. Chan.",
        buttonText: "Get Started",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: false,
        displayPrice: "$500/month",
      },
    ],
  },
  testimonials: [
    {
      id: "4",
      name: "Anders Chan",
      role: "Founder of thePsychology.ai",
      img: "/images/anders-chan.png",
      description: (
        <p>
          I scored a 19% on my first practice diagnostic exam. Poured $1,000 and a month of intense studying, and{" "}
          <Highlight className="text-brand-soft-blue dark:text-brand-coral">I passed on my first try.</Highlight> This program is what I wish I had for a fraction of the
          time, cost, and stress.
        </p>
      ),
    },
    {
      id: "6",
      name: "Dr. Menon",
      role: "Licensed Psychologist",
      img: "/images/user-icon.svg",
      description: (
        <p>
          thePsychology.ai is truly <Highlight className="text-brand-olive dark:text-brand-lavender-gray">one-of-a-kind</Highlight>. It's an <Highlight className="text-brand-olive dark:text-brand-lavender-gray">innovative, effective, and affordable</Highlight> tool for EPPP preparation. The platform makes dense material feel <Highlight className="text-brand-olive dark:text-brand-lavender-gray">engaging</Highlight> and <Highlight className="text-brand-olive dark:text-brand-lavender-gray">manageable</Highlight>, and it clearly reflects a design philosophy of being <Highlight className="text-brand-olive dark:text-brand-lavender-gray">'for the people, by the people'</Highlight>.
        </p>
      ),
    },
    {
      id: "8",
      name: "Anonymous",
      role: "Postdoc",
      img: "/images/user-icon.svg",
      description: (
        <p>
          thepsychology.ai is <Highlight className="text-brand-olive dark:text-brand-lavender-gray">insanely impressive work</Highlight>! I'm taking my EPPP next month and have been struggling to <Highlight className="text-brand-olive dark:text-brand-lavender-gray">find motivation</Highlight> to study. Thank you for the tips on how to <Highlight className="text-brand-olive dark:text-brand-lavender-gray">get creative with studying</Highlight>! Sending good vibes for this project, all the best!!
        </p>
      ),
    },
    {
      id: "7",
      name: "Lorin Singh, PsyD",
      role: "Psychologist",
      img: "/images/user-icon.svg",
      description: (
        <p>
          I used the program more so for the assessments and stats section. It was pretty <Highlight className="text-brand-soft-blue dark:text-brand-coral">helpful</Highlight> and had <Highlight className="text-brand-soft-blue dark:text-brand-coral">information that I didn't see in Psych Prep</Highlight>. I did like that I was able to <Highlight className="text-brand-soft-blue dark:text-brand-coral">ask questions directly</Highlight> underneath the chapter <Highlight className="text-brand-soft-blue dark:text-brand-coral">for explanations</Highlight>.
        </p>
      ),
    },
    {
      id: "9",
      name: "Anonymous",
      role: "User",
      img: "/images/user-icon.svg",
      description: (
        <p>
          I came here ready to <Highlight className="text-brand-soft-blue dark:text-brand-coral">recommend this program</Highlight> and I signed up for it myself. Out of all the programs I looked at, this one comes <Highlight className="text-brand-soft-blue dark:text-brand-coral">the closest to how the EPPP actually words its questions</Highlight>. My test didn't have any straight definition questions, it was all application based, and <Highlight className="text-brand-soft-blue dark:text-brand-coral">this program is set up the same way</Highlight>.
        </p>
      ),
    },
  ],
  faqSection: {
    title: "Questions People Actually Ask",
    description: "Straight answers. No sales pitch.",
    faQitems: [
      {
        id: 1,
        question: "What is thePsychology.ai?",
        answer:
          "An EPPP exam prep platform built by psychologists. Use it for targeted EPPP practice questions, a diagnostic-style baseline, and a study plan organized around high-yield EPPP sections.",
      },
      {
        id: 2,
        question: "How is it different from other EPPP exam prep programs?",
        answer:
          "We focus on prioritization: what to study next, why it matters, and how it shows up on the EPPP. Less filler, fewer random drills, more high-yield EPPP practice tests and targeted review.",
      },
      {
        id: 3,
        question: "Can I schedule my EPPP exam through an online portal?",
        answer:
          "In most jurisdictions, yes. After your licensing board authorizes you, scheduling is typically done online through the exam delivery vendor (commonly Pearson VUE). Requirements vary by jurisdiction, so confirm with your board and ASPPB.",
      },
      {
        id: 4,
        question: "How to register (EPPP sign up) for the EPPP exam online?",
        answer:
          "Most candidates apply through their state/provincial psychology board first. Once you’re approved/authorized, you’ll receive instructions to create an account and schedule the exam online with the testing vendor.",
      },
      {
        id: 5,
        question: "How long is the EPPP exam and what format does it follow?",
        answer:
          "ASPPB lists Part 1 as: Questions: 225 multiple-choice questions (175 scored, 50 pilot items). Time Allotment: 4 hours and 15 minutes. Administration: computer-based exam administered by Pearson VUE. Part 2 (Skills) uses applied scenarios/vignettes. Requirements can vary by jurisdiction, so always verify the current requirements before test day.",
      },
      {
        id: 6,
        question: "What is the average passing score required on the EPPP (and the EPPP score range)?",
        answer:
          "EPPP scores are reported on a scaled score range (commonly cited as 200–800). Many jurisdictions use a 500 cut score, but the required passing score is set by your licensing jurisdiction.",
      },
      {
        id: 7,
        question: "What are the EPPP sections (content domains) I should study?",
        answer:
          "The EPPP Part 1 blueprint is commonly organized into 8 domains (e.g., Biological Bases, Cognitive-Affective Bases, Social/Cultural Bases, Growth & Lifespan, Assessment/Diagnosis, Treatment/Intervention/Prevention, Research Methods/Statistics, Ethical/Legal/Professional Issues). Your best guide is the current ASPPB content outline.",
      },
      {
        id: 8,
        question: "How does EPPP scoring work?",
        answer:
          "EPPP scoring is scaled (not a simple percent correct), and forms can include unscored items used for testing. Your jurisdiction sets the passing standard, so focus on consistent performance across EPPP sections rather than chasing a single raw score target.",
      },
      {
        id: 9,
        question: "How does EPPP score transfer work?",
        answer:
          "EPPP score transfer is typically handled through ASPPB’s score transfer service. Fees, timelines, and eligibility depend on where you’re applying, so check both ASPPB and your destination board’s requirements.",
      },
      {
        id: 10,
        question: "What are the best study materials for preparing for the EPPP?",
        answer:
          "Use a mix of (1) the current exam content outline, (2) high-quality EPPP practice questions/practice tests with explanations, and (3) concise EPPP study materials (some programs include EPPP study materials PDF downloads). Prioritize active recall and timed sets over passive reading.",
      },
      {
        id: 11,
        question: "Where can I find affordable EPPP prep courses near me?",
        answer:
          "Start with your state/provincial psychological association, local university psychology departments, internship/postdoc networks, and study groups. If in-person options are limited, compare online EPPP prep programs by question bank quality, explanations, and update cadence. We built thePsychology.ai to be way more affordable than what’s on the market while still delivering higher-quality practice, explanations, and tools. Email us if you find a more affordable program.",
      },
      {
        id: 12,
        question: "What are the top-rated mobile apps for EPPP exam preparation?",
        answer:
          "Many candidates use top-rated study apps like Anki, Quizlet, or Brainscape for spaced repetition, then pair that with an EPPP question bank for timed practice. thePsychology.ai is mobile-friendly, so you can study on your phone like an app, and we'll be developing a dedicated mobile app.",
      },
      {
        id: 13,
        question: "Do you have EPPP practice questions, an EPPP sample exam, or EPPP practice questions 2025-2026?",
        answer:
          "If you’re searching for EPPP practice questions 2025-2026, focus on materials aligned with the current ASPPB blueprint and updated regularly. Our approach is to generate targeted practice questions by topic and reinforce them with clear, exam-style explanations and review.",
      },
    ],
  },
  ctaSection: {
    id: "cta",
    title: "Your license starts here",
    backgroundImage: "/agent-cta-background.png",
    button: { text: "Claim Your Free Spot", href: "/#get-started" },
    subtext: "First 100 spots are free",
  },
  footerLinks: [
    {
      title: "Company",
      links: [
        { id: 1, title: "About", url: "/portfolio" },
        { id: 2, title: "Contact", url: "/contact" },
        { id: 3, title: "Blog", url: "/blog" },
        { id: 4, title: "Resources", url: "/resources" },
      ],
    },
    {
      title: "Products",
      links: [
        { id: 5, title: "Pricing", url: "/#get-started" },
        { id: 6, title: "FAQ", url: "/#faq" },
        { id: 7, title: "Practice Questions", url: "/resources/practice-questions" },
        { id: 8, title: "Sample Exams", url: "/resources/sample-exams" },
      ],
    },
    {
      title: "Resources",
      links: [
        { id: 9, title: "EPPP Sections", url: "/eppp-sections" },
        { id: 10, title: "EPPP Practice Questions", url: "/eppp-practice-questions" },
        { id: 11, title: "EPPP Passing Score", url: "/eppp-passing-score" },
        { id: 12, title: "All Resources", url: "/resources" },
      ],
    },
  ],
}

export type SiteConfig = typeof siteConfig
