'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ---------- Types ----------

export interface TimelineStep {
  text: string
  done: boolean
  start_at?: number
  due_at?: number
  done_by?: string
  done_at?: string
}

export interface TimelinePhase {
  kind: 'build' | 'test' | 'rollout' | 'live' | 'wait'
  start: number
  end: number
  label?: string
  description?: string
}

export interface TimelineMilestone {
  at: number
  label: string
}

export interface TimelineProject {
  id: string
  timeline_key: string
  num: string
  name: string
  one_liner: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'live' | 'building' | 'blocked' | 'idea' | 'done'
  stage_line: string | null
  contributors: string[]
  phases: TimelinePhase[]
  milestone: TimelineMilestone | null
  steps: TimelineStep[]
  support: string | null
  href: string | null
  sort_order: number
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface TimelineCollaborator {
  initials: string
  name: string
  hue: number
  neutral?: boolean
}

const TIMELINE_KEY = 'anders-personal'

// ---------- Hook ----------

export function useTimeline(
  initialProjects: TimelineProject[],
  initialCollaborators: TimelineCollaborator[]
) {
  const [projects, setProjects] = useState<TimelineProject[]>(initialProjects)
  const [collaborators] = useState<TimelineCollaborator[]>(initialCollaborators)
  const [activeUser, setActiveUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('timeline-personal-user')
    if (stored) setActiveUser(stored)
  }, [])

  useEffect(() => {
    if (!activeUser) return
    const key = `timeline-personal-checkoff-poll-${activeUser}`
    const last = Number(sessionStorage.getItem(key) || '0')
    const now = Date.now()
    if (now - last < 30_000) return
    sessionStorage.setItem(key, String(now))
    fetch('/api/timeline/sync-checkoffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leader: activeUser }),
    }).catch(() => undefined)
  }, [activeUser])

  const pickUser = useCallback((initials: string | null) => {
    setActiveUser(initials)
    if (initials) {
      localStorage.setItem('timeline-personal-user', initials)
    } else {
      localStorage.removeItem('timeline-personal-user')
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('timeline-realtime-personal')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_projects',
          filter: `timeline_key=eq.${TIMELINE_KEY}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProject = payload.new as TimelineProject
            setProjects(prev => {
              if (prev.some(p => p.id === newProject.id)) return prev
              return [...prev, newProject].sort((a, b) => a.sort_order - b.sort_order)
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as TimelineProject
            setProjects(prev =>
              prev.map(p => (p.id === updated.id ? updated : p))
            )
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id
            setProjects(prev => prev.filter(p => p.id !== id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // ---------- Mutations ----------

  const apiFetch = useCallback(async (path: string, options: RequestInit) => {
    const res = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `API ${res.status}`)
    }
    return res.json()
  }, [])

  const toggleStep = useCallback(async (projectId: string, stepIndex: number) => {
    if (!activeUser) return

    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p
        const steps = [...p.steps]
        const step = { ...steps[stepIndex] }
        step.done = !step.done
        step.done_by = step.done ? activeUser : undefined
        step.done_at = step.done ? new Date().toISOString() : undefined
        steps[stepIndex] = step
        return { ...p, steps, updated_by: activeUser, updated_at: new Date().toISOString() }
      })
    )

    const project = projects.find(p => p.id === projectId)
    if (!project) return
    const steps = [...project.steps]
    const step = { ...steps[stepIndex] }
    step.done = !step.done
    step.done_by = step.done ? activeUser : undefined
    step.done_at = step.done ? new Date().toISOString() : undefined
    steps[stepIndex] = step

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ steps, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] toggleStep error:', err)
      refreshProjects()
    }
  }, [activeUser, projects, apiFetch])

  const updatePhases = useCallback(async (projectId: string, phases: TimelinePhase[]) => {
    if (!activeUser) return

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, phases, updated_by: activeUser, updated_at: new Date().toISOString() } : p))
    )

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ phases, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] updatePhases error:', err)
      refreshProjects()
    }
  }, [activeUser, apiFetch])

  const updateMilestone = useCallback(async (projectId: string, milestone: TimelineMilestone | null) => {
    if (!activeUser) return

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, milestone, updated_by: activeUser, updated_at: new Date().toISOString() } : p))
    )

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ milestone, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] updateMilestone error:', err)
      refreshProjects()
    }
  }, [activeUser, apiFetch])

  const updateStep = useCallback(async (projectId: string, stepIndex: number, patch: Partial<TimelineStep>) => {
    if (!activeUser) return

    const project = projects.find(p => p.id === projectId)
    if (!project) return
    const steps = [...project.steps]
    steps[stepIndex] = { ...steps[stepIndex], ...patch }

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, steps, updated_by: activeUser, updated_at: new Date().toISOString() } : p))
    )

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ steps, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] updateStep error:', err)
      refreshProjects()
    }
  }, [activeUser, projects, apiFetch])

  const updatePriority = useCallback(async (projectId: string, priority: TimelineProject['priority']) => {
    if (!activeUser) return

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, priority, updated_by: activeUser, updated_at: new Date().toISOString() } : p))
    )

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] updatePriority error:', err)
      refreshProjects()
    }
  }, [activeUser, apiFetch])

  const updateContributors = useCallback(async (projectId: string, contributors: string[]) => {
    if (!activeUser) return

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, contributors, updated_by: activeUser, updated_at: new Date().toISOString() } : p))
    )

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ contributors, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] updateContributors error:', err)
      refreshProjects()
    }
  }, [activeUser, apiFetch])

  const updateStatus = useCallback(async (projectId: string, status: TimelineProject['status']) => {
    if (!activeUser) return

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, status, updated_by: activeUser, updated_at: new Date().toISOString() } : p))
    )

    try {
      await apiFetch(`/api/timeline/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] updateStatus error:', err)
      refreshProjects()
    }
  }, [activeUser, apiFetch])

  const addProject = useCallback(async (data: {
    name: string
    one_liner: string
    priority: string
    status: string
    contributors: string[]
    phases: TimelinePhase[]
    steps: { text: string; done: boolean; due_at?: number; start_at?: number }[]
    support?: string
  }) => {
    if (!activeUser) return
    setLoading(true)

    try {
      await apiFetch('/api/timeline', {
        method: 'POST',
        body: JSON.stringify({ ...data, contributor: activeUser, key: TIMELINE_KEY }),
      })
    } catch (err) {
      console.error('[timeline] addProject error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeUser, apiFetch])

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeline?key=${encodeURIComponent(TIMELINE_KEY)}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects ?? [])
      }
    } catch {
      // silent
    }
  }, [])

  return {
    projects,
    collaborators,
    activeUser,
    pickUser,
    loading,
    toggleStep,
    updateStep,
    updatePhases,
    updateMilestone,
    updatePriority,
    updateStatus,
    updateContributors,
    addProject,
    refreshProjects,
  }
}
