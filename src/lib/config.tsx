import type React from "react"
import { cn } from "@/lib/utils"
import { FirstBentoAnimation } from "@/components/first-bento-animation"
import { SecondBentoAnimation } from "@/components/second-bento-animation"
import { ThirdBentoAnimation } from "@/components/third-bento-animation"

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <span className={cn("p-1 py-0.5 font-medium dark:font-semibold text-secondary", className)}>{children}</span>
}

export const BLUR_FADE_DELAY = 0.15

export const siteConfig = {
  name: "thePsychology.ai",
  description: "Master the EPPP Quickly",
  cta: "Get Started",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: ["EPPP", "Psychology", "Exam Prep", "AI Learning"],
  links: {
    email: "support@thepsychology.ai",
    twitter: "https://twitter.com/thepsychologyai",
    discord: "https://discord.gg/thepsychologyai",
    github: "https://github.com/thepsychologyai",
    instagram: "https://instagram.com/thepsychologyai",
  },
  nav: {
    links: [
      { id: 1, name: "Home", href: "#hero" },
      { id: 2, name: "How it Works", href: "#bento" },
      { id: 4, name: "Pricing", href: "#pricing" },
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
    badge: "Keep your time, money, and sanity",
    title: "Master the EPPP Quickly",
    description: "Built by the psychologist who went from 19% to 588 in 30 days.",
    cta: {
      primary: { text: "Start free", href: "#join" },
      secondary: { text: "Login", href: "#features" },
    },
  },
  companyShowcase: {
    title: "Practitioner-built. Proven in clinics, classrooms, and real exams",
    companyLogos: [
      { id: 1, name: "UCLA Health", src: "/ucla.png" },
      { id: 2, name: "NYU Langone Health", src: "/nyu.png" },
      { id: 3, name: "Montefiore Einstein", src: "/monte.png" },
      { id: 4, name: "Pratt Institute", src: "/pratt.png" },
      { id: 5, name: "LIU Post", src: "/liu.png" },
      { id: 6, name: "Brooklyn Center for Psychotherapy", src: "/bcp.png" },
      { id: 7, name: "NotebookLM", src: "/notebook.png" },
      { id: 8, name: "OpenAI", src: "/openai.png" },
    ],
  },
  bentoSection: {
    title: "How it Works",
    description: "Study less. Score higher. Here’s how.",
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
        content: <SecondBentoAnimation />,
        title: "Replenish",
        description:
          "Improve focus and reduce burnout while learning relevant EPPP topics (ACT, MI, and CBT-I).",
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
    description: "Comprehensive tools and resources designed specifically for EPPP success",
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
    quote:
      "I poured $1k and a month into studying and passed on my first try. This is the program that gives you everything I did and wish I had for a fraction of the time, cost, and stress.",
    author: {
      name: "Anders H. Chan, Psy.D.",
      role: "Founder - thePsychology.ai",
      image:
        "https://scontent-bos5-1.xx.fbcdn.net/v/t39.30808-6/468960776_10169814148370440_5031711526513575898_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=RwLXdRHpqQsQ7kNvwHLV2Sz&_nc_oc=AdlRejHiEYDIxZOtTELYLdqCBBZ_wRWPzYBVKrb3gKyqeJI_Ho0sJnAucafM9oodQE857lsPArZcUV8i9TY8jFdq&_nc_zt=23&_nc_ht=scontent-bos5-1.xx&_nc_gid=3_RZfnwtAadLI-Wq1T4bTw&oh=00_AfcE78yyG0-WHNmH2FGsUeIGV_w3TJBjXtUujDOnt43r5g&oe=68F39267",
    },
  },
  pricing: {
    title: "Waitlist",
    description: "Select all that interest you",
    pricingItems: [
      {
        name: "7-Day Free Trial",
        href: "#join",
        price: "$0",
        period: "week",
        yearlyPrice: "n/a",
        features: ["Prioritizing Focus", "Custom Simple Study", "Recovery"],
        featuresLabel: "Everything in Pro:",
        description: "Try the program for a week. Full access.",
        buttonText: "Select",
        buttonColor: "bg-black text-white",
        isPopular: true,
      },
      {
        name: "Pro",
        href: "#join",
        price: "$20",
        period: "month",
        yearlyPrice: "$200",
        features: ["Mobile-use", "Gamification of Progress", "Video summaries"],
        featuresLabel: "Future features include:",
        description: "Everything in Pro:.",
        buttonText: "Select",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: false,
      },
      {
        name: "Pro + Coaching",
        href: "#join",
        price: "$200",
        period: "month",
        yearlyPrice: "$2000",
        features: ["2× 45-min calls/month", "Personal study plan", "Priority support"],
        featuresLabel: "Everything in Pro:",
        description: "Everything in Pro + 2 calls per month with Dr. Anders Chan.",
        buttonText: "Select",
        buttonColor: "bg-white text-black border",
        isPopular: false,
      },
    ],
  },
  testimonials: [
    {
      id: "1",
      name: "Dr. Sarah Mitchell",
      role: "Clinical Psychologist",
      img: "https://randomuser.me/api/portraits/women/44.jpg",
      description: (
        <p>
          The <Highlight>adaptive quizzes</Highlight> were a game-changer for me. They identified my weak areas and
          helped me focus my study time effectively. Passed on my first attempt!
        </p>
      ),
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "Psychology Graduate",
      img: "https://randomuser.me/api/portraits/men/32.jpg",
      description: (
        <p>
          I loved the <Highlight>multimodal learning approach</Highlight>. Being able to switch between text, audio, and
          video kept me engaged and helped me retain information better.
        </p>
      ),
    },
    {
      id: "3",
      name: "Dr. Emily Rodriguez",
      role: "School Psychologist",
      img: "https://randomuser.me/api/portraits/women/68.jpg",
      description: (
        <p>
          The <Highlight>coaching sessions with Dr. Chan</Highlight> were invaluable. His insights and study strategies
          made all the difference in my preparation.
        </p>
      ),
    },
    {
      id: "4",
      name: "Anders Chan",
      role: "Founder of thePsychology.ai",
      img: "https://scontent-bos5-1.xx.fbcdn.net/v/t39.30808-6/468960776_10169814148370440_5031711526513575898_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=RwLXdRHpqQsQ7kNvwHLV2Sz&_nc_oc=AdlRejHiEYDIxZOtTELYLdqCBBZ_wRWPzYBVKrb3gKyqeJI_Ho0sJnAucafM9oodQE857lsPArZcUV8i9TY8jFdq&_nc_zt=23&_nc_ht=scontent-bos5-1.xx&_nc_gid=3_RZfnwtAadLI-Wq1T4bTw&oh=00_AfcE78yyG0-WHNmH2FGsUeIGV_w3TJBjXtUujDOnt43r5g&oe=68F39267",
      description: (
        <p>
          I scored a 19% on my first practice diagnostic exam. Poured $1,000 and a month of intense studying, and{" "}
          <Highlight>I got a 588 on my first try.</Highlight> This program is what I wish I had for a fraction of the
          time, cost, and stress.
        </p>
      ),
    },
    {
      id: "5",
      name: "Jessica Thompson",
      role: "Counseling Psychologist",
      img: "https://randomuser.me/api/portraits/women/90.jpg",
      description: (
        <p>
          The <Highlight>mobile-friendly platform</Highlight> allowed me to study during my commute and lunch breaks.
          Made the most of every spare moment!
        </p>
      ),
    },
  ],
  faqSection: {
    title: "Questions People Actually Ask",
    description:
      "FAQs",
    faQitems: [
      {
        id: 1,
        question: "What is ThePsychology.ai?",
        answer:
          "A study coach powered by OpenAI's API that is helping psychologists increase their chances of passing the EPPP quickly (designed for 1 month) — with less stress, zero data leaks, and minimal screen time",
      },
      {
        id: 2,
        question: "How is it different from other EPPP tools?",
        answer:
          "We don’t just dump info — we prioritize what matters. No filler. No guessing. No burnout. This program helps you study smarter, not longer. This is built by psychologists, not corporations. If we as psychologists are to practice what we preach, we must also bring psychological principles in our learning. ",
      },
      {
        id: 3,
        question: "What about the environment?",
        answer:
          "We are committed to awareness of consumption and consequently eco-efficiency with AI use (e.g., running smaller models locally where possible). One month on our system uses 96% less energy than six months of traditional prep. That’s about 50 kg of CO₂ saved per person.",
      },
      {
        id: 4,
        question: "What happens to my data?",
        answer: "Your data’s yours. Export it. Delete it. Done. It trains your plan, not our pockets.",
      },
      {
        id: 5,
        question: "Is there a free trial available?",
        answer:
          "Yes, we offer a 7-day free trial that gives you full access to all features. No credit card is required to start your trial.",
      },
      {
        id: 6,
        question: "What’s the mission?",
        answer: "To help you flourish: professionally, personally, and sustainably."
      },
    ],
  },
  ctaSection: {
    id: "cta",
    title: "Study quickly and affordably",
    backgroundImage: "/agent-cta-background.png",
    button: { text: "Start Your 7-Day Free Trial Today", href: "#" },
    subtext: "Cancel anytime, no questions asked",
  },
  footerLinks: [
    {
      title: "Company",
      links: [
        { id: 1, title: "About", url: "#" },
        { id: 2, title: "Contact", url: "#" },
        { id: 3, title: "Blog", url: "#" },
        { id: 4, title: "Story", url: "#" },
      ],
    },
    {
      title: "Products",
      links: [
        { id: 5, title: "Company", url: "#" },
        { id: 6, title: "Product", url: "#" },
        { id: 7, title: "Press", url: "#" },
        { id: 8, title: "More", url: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { id: 9, title: "Press", url: "#" },
        { id: 10, title: "Careers", url: "#" },
        { id: 11, title: "Newsletters", url: "#" },
        { id: 12, title: "More", url: "#" },
      ],
    },
  ],
}

export type SiteConfig = typeof siteConfig
