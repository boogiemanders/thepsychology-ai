'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ProjectNode {
  id: number
  title: string
  description: string
  category: string
  categoryLabel: string
  href?: string
  status: 'live' | 'beta' | 'dev' | 'soon'
  tags: string[]
  icon: React.ReactNode
}

interface RadialOrbitalTimelineProps {
  projects: ProjectNode[]
}

const statusConfig = {
  live: { label: 'Live', dot: 'bg-zinc-900 dark:bg-zinc-100' },
  beta: { label: 'Beta', dot: 'bg-zinc-400' },
  dev: { label: 'Building', dot: 'bg-amber-500' },
  soon: { label: 'Coming Soon', dot: 'bg-zinc-200 dark:bg-zinc-700' },
} as const

function StatusDot({ status }: { status: ProjectNode['status'] }) {
  if (status === 'dev') {
    return (
      <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
        <span className="relative inline-block h-full w-full rounded-full bg-amber-500" />
      </span>
    )
  }
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig[status].dot} shrink-0`} />
}

function statusLabelClass(status: ProjectNode['status']) {
  return status === 'dev'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-zinc-400 dark:text-zinc-500'
}

function formatClusterChildLabel(position: number, childIndex: number) {
  return `${position}${String.fromCharCode(97 + childIndex)}`
}

// Derive 3 orbital entries from the flat project list:
// a license leaf, a psychologist-tools cluster, and a creative leaf.
type OrbitalEntry =
  | { kind: 'leaf'; id: string; label: string; project: ProjectNode }
  | { kind: 'cluster'; id: string; label: string; children: ProjectNode[] }

function buildEntries(projects: ProjectNode[]): OrbitalEntry[] {
  const license = projects.find(p => p.category === 'getting-licensed')
  const practice = projects.filter(p => p.category === 'clinical-practice')
  const creative = projects.find(p => p.category === 'creative')
  const dental = projects.find(p => p.category === 'dental')

  const entries: OrbitalEntry[] = []
  if (license) entries.push({ kind: 'leaf', id: 'license', label: license.title, project: license })
  if (practice.length)
    entries.push({ kind: 'cluster', id: 'practice', label: 'Psychologist Tools', children: practice })
  if (creative) entries.push({ kind: 'leaf', id: 'creative', label: creative.title, project: creative })
  if (dental) entries.push({ kind: 'leaf', id: 'dental', label: dental.title, project: dental })
  return entries
}

export default function RadialOrbitalTimeline({ projects }: RadialOrbitalTimelineProps) {
  const entries = buildEntries(projects)

  const [activeLeafId, setActiveLeafId] = useState<string | null>(null)
  const [openClusterId, setOpenClusterId] = useState<string | null>(null)
  const [activeChildId, setActiveChildId] = useState<number | null>(null)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return
    const timer = setInterval(() => {
      setRotationAngle(prev => (prev + 0.2) % 360)
    }, 50)
    return () => clearInterval(timer)
  }, [autoRotate])

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [])

  // Scroll-linked fade in as the ring enters the viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when container top is at bottom of viewport, 1 when top reaches ~40% of viewport
      const start = vh
      const end = vh * 0.4
      const raw = (start - rect.top) / (start - end)
      const clamped = Math.max(0, Math.min(1, raw))
      setScrollProgress(clamped)
    }
    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [])

  const rotateEntryToTop = (entryId: string) => {
    const idx = entries.findIndex(e => e.id === entryId)
    if (idx < 0) return
    const targetAngle = (idx / entries.length) * 360
    setRotationAngle(270 - targetAngle)
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.orbit) {
      setActiveLeafId(null)
      setOpenClusterId(null)
      setActiveChildId(null)
      setAutoRotate(true)
    }
  }

  const handleLeafClick = (id: string) => {
    if (activeLeafId === id) {
      setActiveLeafId(null)
      setAutoRotate(true)
    } else {
      setActiveLeafId(id)
      setOpenClusterId(null)
      setActiveChildId(null)
      setAutoRotate(false)
      rotateEntryToTop(id)
    }
  }

  const handleChildClick = (clusterId: string, childId: number) => {
    setOpenClusterId(clusterId)
    setActiveLeafId(null)
    setActiveChildId(prev => (prev === childId ? null : childId))
    setAutoRotate(false)
    rotateEntryToTop(clusterId)
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
  }

  const openCluster = (id: string) => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
    setOpenClusterId(id)
    setActiveLeafId(null)
    setAutoRotate(false)
  }

  const scheduleClusterCollapse = () => {
    if (activeChildId !== null) return
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    collapseTimerRef.current = setTimeout(() => {
      setOpenClusterId(null)
      setAutoRotate(true)
    }, 500)
  }

  const toggleClusterTap = (id: string) => {
    if (openClusterId === id) {
      setOpenClusterId(null)
      setAutoRotate(true)
    } else {
      openCluster(id)
    }
  }

  const getNodePosition = (index: number) => {
    const angle = ((index / entries.length) * 360 + rotationAngle) % 360
    const radius = 180
    const radian = (angle * Math.PI) / 180
    // Round to integers / fixed precision so server and client serialize
    // style values identically and React doesn't flag a hydration mismatch.
    const x = Math.round(radius * Math.cos(radian))
    const y = Math.round(radius * Math.sin(radian))
    const zIndex = Math.round(100 + 50 * Math.cos(radian))
    const rawOpacity = Math.max(0.5, Math.min(1, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2)))
    const opacity = Math.round(rawOpacity * 100) / 100
    return { x, y, angle, radian, zIndex, opacity }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full flex items-center justify-center py-16"
      style={{
        minHeight: '720px',
        opacity: scrollProgress,
        transform: `translateY(${(1 - scrollProgress) * 60}px)`,
        willChange: 'opacity, transform',
      }}
      onClick={handleBackgroundClick}
    >
      {/* Orbit ring */}
      <div
        data-orbit="true"
        className="absolute w-[360px] h-[360px] rounded-full border border-zinc-200 dark:border-zinc-800"
      />

      {/* Center hub with pulsing rings */}
      <div className="absolute z-10 flex items-center justify-center pointer-events-none">
        <div className="absolute w-24 h-24 rounded-full border border-zinc-400/30 dark:border-zinc-500/30 animate-ping opacity-70" />
        <div
          className="absolute w-28 h-28 rounded-full border border-zinc-400/20 dark:border-zinc-500/20 animate-ping opacity-50"
          style={{ animationDelay: '0.5s' }}
        />
        <div className="relative w-16 h-16 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center animate-pulse">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white dark:text-zinc-900">Lab</span>
        </div>
      </div>

      {/* Entries */}
      {entries.map((entry, index) => {
        const pos = getNodePosition(index)
        const isLeafActive = entry.kind === 'leaf' && activeLeafId === entry.id
        const isClusterOpen = entry.kind === 'cluster' && openClusterId === entry.id

        return (
          <div
            key={entry.id}
            className="absolute transition-all duration-700"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isLeafActive || isClusterOpen ? 200 : pos.zIndex,
              opacity: isLeafActive || isClusterOpen ? 1 : pos.opacity,
            }}
            onMouseEnter={entry.kind === 'cluster' ? () => openCluster(entry.id) : undefined}
            onMouseLeave={entry.kind === 'cluster' ? scheduleClusterCollapse : undefined}
          >
            {entry.kind === 'leaf' ? (
              <LeafNode
                entry={entry}
                position={index + 1}
                isActive={isLeafActive}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLeafClick(entry.id)
                }}
              />
            ) : (
              <ClusterNode
                entry={entry}
                position={index + 1}
                isOpen={isClusterOpen}
                activeChildId={activeChildId}
                onTap={(e) => {
                  e.stopPropagation()
                  toggleClusterTap(entry.id)
                }}
                onChildClick={(childId) => handleChildClick(entry.id, childId)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LeafNode({
  entry,
  position,
  isActive,
  onClick,
}: {
  entry: Extract<OrbitalEntry, { kind: 'leaf' }>
  position: number
  isActive: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const project = entry.project
  const s = statusConfig[project.status]
  const isClickable = !!project.href && project.status !== 'soon'

  return (
    <div className="cursor-pointer" onClick={onClick}>
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300',
          isActive
            ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 scale-125'
            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400',
        )}
      >
        <span className={cn('text-[10px] font-mono', isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400')}>
          {String(position).padStart(2, '0')}
        </span>
      </div>

      <div
        className={cn(
          'absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300',
          'text-[13px] font-medium tracking-wide',
          isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        {project.title}
      </div>

      {isActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-50">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5">
                <StatusDot status={project.status} />
                <span className={cn('text-[10px] font-mono uppercase tracking-[0.14em]', statusLabelClass(project.status))}>
                  {s.label}
                </span>
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{project.categoryLabel}</span>
            </div>
            <h3 className="text-base font-medium tracking-tight mb-2">{project.title}</h3>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-block rounded px-2 py-0.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60"
                >
                  {tag}
                </span>
              ))}
            </div>
            {isClickable && project.href && (
              <Link
                href={project.href}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                Open
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ClusterNode({
  entry,
  position,
  isOpen,
  activeChildId,
  onTap,
  onChildClick,
}: {
  entry: Extract<OrbitalEntry, { kind: 'cluster' }>
  position: number
  isOpen: boolean
  activeChildId: number | null
  onTap: (e: React.MouseEvent) => void
  onChildClick: (childId: number) => void
}) {
  return (
    <>
      {/* Cluster parent node */}
      <div className="cursor-pointer" onClick={onTap}>
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300',
            isOpen
              ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 scale-110'
              : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400',
          )}
        >
          <span className={cn('text-[10px] font-mono', isOpen ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400')}>
            {String(position).padStart(2, '0')}
          </span>
        </div>

        <div
          className={cn(
            'absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300',
            'text-[13px] font-medium tracking-wide',
            isOpen ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500',
          )}
        >
          {entry.label}
        </div>
      </div>

      {/* Dropdown menu panel */}
      <div
        className={cn(
          'absolute top-20 left-1/2 w-80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md',
          'border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-50',
          'transition-all duration-300 origin-top',
          isOpen
            ? 'opacity-100 scale-100 -translate-x-1/2 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-x-1/2 -translate-y-2 pointer-events-none',
        )}
      >
        {/* Connector tick */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-px bg-zinc-900 dark:bg-zinc-100" />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Psychologist Tools
          </p>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {entry.children.map((child, childIndex) => {
            const s = statusConfig[child.status]
            const isClickable = !!child.href && child.status !== 'soon'
            const isActive = activeChildId === child.id

            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChildClick(child.id)
                  }}
                  className={cn(
                    'group w-full text-left flex items-start gap-3 px-5 py-4 transition-colors duration-150',
                    isActive
                      ? 'bg-zinc-50 dark:bg-zinc-900/80'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
                  )}
                >
                  <span className="mt-[3px] font-mono text-[12px] text-zinc-400 dark:text-zinc-600 shrink-0">
                    {formatClusterChildLabel(position, childIndex)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-[15px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                        {child.title}
                      </h4>
                      <StatusDot status={child.status} />
                      <span className={cn('text-[10px] font-mono uppercase tracking-[0.14em]', statusLabelClass(child.status))}>
                        {s.label}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed',
                        isActive ? '' : 'line-clamp-2',
                      )}
                    >
                      {child.description}
                    </p>
                    {isActive && (
                      <>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {child.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-block rounded px-2 py-0.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {isClickable && child.href && (
                          <Link
                            href={child.href}
                            className="inline-flex items-center gap-1 mt-3 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open
                            <span>&rarr;</span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                  {isClickable && !isActive && (
                    <span className="text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors mt-0.5 shrink-0">
                      &rarr;
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
