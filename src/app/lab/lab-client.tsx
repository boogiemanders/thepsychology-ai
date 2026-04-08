'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { cn } from '@/lib/utils'

const GLSLHills = dynamic(
  () => import('@/components/ui/glsl-hills').then(mod => ({ default: mod.GLSLHills })),
  { ssr: false }
)

export interface Project {
  id: number
  title: string
  description: string
  category: string
  categoryLabel: string
  href?: string
  status: 'live' | 'beta' | 'dev' | 'soon'
  tags: string[]
}

const statusConfig = {
  live: { label: 'Live', dot: 'bg-emerald-600 dark:bg-emerald-500' },
  beta: { label: 'Beta', dot: 'bg-zinc-400' },
  dev: { label: 'Building', dot: 'bg-zinc-400 dark:bg-zinc-600' },
  soon: { label: 'Coming Soon', dot: 'bg-zinc-200 dark:bg-zinc-700' },
} as const

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'getting-licensed': 'You passed the EPPP. Now you wait. These tools make the wait shorter.',
  'clinical-practice': 'You became a psychologist to help people. Not to copy-paste intake forms.',
  'creative': 'Language, art, culture. No clinical utility. Just interesting.',
  'dental': 'For dental students. Textbook figures, pulled out and organized so you can study the pictures, not the page numbers.',
}

// Shared status pill. `dev` gets an animated amber ping to signal active work.
function StatusBadge({ status }: { status: Project['status'] }) {
  const s = statusConfig[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} />
      <span
        className={cn(
          'text-[10px] font-mono uppercase tracking-[0.14em]',
          status === 'live' ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        {s.label}
      </span>
    </span>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const isClickable = !!project.href && project.status !== 'soon'

  const inner = (
    <div className="group relative border-b border-zinc-200 dark:border-zinc-800 py-5 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 px-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-medium tracking-tight">{project.title}</h3>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {isClickable && (
          <span className="text-zinc-300 dark:text-zinc-600 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 mt-1 shrink-0">
            &rarr;
          </span>
        )}
      </div>
    </div>
  )

  if (isClickable && project.href) {
    return <Link href={project.href} className="block cursor-pointer">{inner}</Link>
  }
  return inner
}

// Group projects by category for mobile list
function MobileProjectList({ projects }: { projects: Project[] }) {
  const categories = projects.reduce<Record<string, { label: string; description: string; projects: Project[] }>>((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { label: p.categoryLabel, description: '', projects: [] }
    }
    acc[p.category].projects.push(p)
    return acc
  }, {})

  return (
    <div className="space-y-12 px-4 max-w-2xl mx-auto">
      {Object.entries(categories).map(([key, cat]) => (
        <section key={key}>
          <div className="mb-1">
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-1">
              {cat.label}
            </h2>
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              {CATEGORY_DESCRIPTIONS[key] || ''}
            </p>
          </div>
          <div>
            {cat.projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function LabClient({ projects }: { projects: Project[] }) {
  const orbitalTimelineRef = useRef<HTMLDivElement | null>(null)

  // Map projects to orbital nodes with simple number icons
  const orbitalProjects = projects.map(p => ({
    ...p,
    icon: <span className="text-[10px] font-mono">{String(p.id).padStart(2, '0')}</span>,
  }))

  const scrollToOrbitalTimeline = () => {
    orbitalTimelineRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <div className="relative">
      {/* Fixed full-viewport GLSL hills background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <GLSLHills />
      </div>

      {/* Hero text */}
      <section role="banner" className="relative w-full h-[70vh] min-h-[480px] flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <div className="flex flex-col items-center">
          <p className="italic font-thin text-4xl sm:text-5xl tracking-tight text-zinc-700 dark:text-zinc-200 mb-2">
            thePsychology.ai
          </p>
          <h1 className="font-bold text-6xl sm:text-7xl tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
            Laboratory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Clinical tools, creative experiments, and side projects.
          </p>
        </div>

        {/* Scroll hint — clean chevron, sits above the hills valley */}
        <button
          type="button"
          onClick={scrollToOrbitalTimeline}
          className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-[32%] animate-bounce pointer-events-auto cursor-pointer text-zinc-400/70 dark:text-zinc-500/70 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40 rounded-sm"
          aria-label="Scroll to lab projects"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="12"
            viewBox="0 0 22 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block"
            aria-hidden="true"
          >
            <path d="M1 1l10 10L21 1" />
          </svg>
        </button>
      </section>

      {/* Desktop: Orbital timeline */}
      <div id="projects" ref={orbitalTimelineRef} className="hidden md:block">
        <RadialOrbitalTimeline projects={orbitalProjects} />
      </div>

      {/* Desktop: category captions */}
      <section className="hidden md:block max-w-4xl mx-auto px-8 pb-20 pt-4">
        <div className="grid grid-cols-2 gap-x-16 gap-y-10">
          {Object.entries(CATEGORY_DESCRIPTIONS).map(([key, desc]) => {
            const label = projects.find(p => p.category === key)?.categoryLabel
            if (!label) return null
            return (
              <div key={key} className="border-l border-zinc-300 dark:border-zinc-700/60 pl-5">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-300 mb-2">
                  {label}
                </p>
                <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Mobile: Clean list */}
      <div className="block md:hidden py-12">
        <MobileProjectList projects={projects} />
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 mt-8 pb-16 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <p className="peer text-[12px] text-zinc-400 dark:text-zinc-500 leading-tight order-2">
            Built by Anders
            <br />
            <a
              href="mailto:DrChan@thepsychology.ai"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
            >
              DrChan@thepsychology.ai
            </a>
          </p>
          <div
            className={cn(
              'order-1 relative size-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0',
              'opacity-0 -translate-x-2 scale-95',
              'transition-all duration-300 ease-out',
              'peer-hover:opacity-100 peer-hover:translate-x-0 peer-hover:scale-100',
            )}
          >
            <Image
              src="/images/anders-chan.png"
              alt="Anders Chan"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}
