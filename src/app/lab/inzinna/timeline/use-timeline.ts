'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ---------- Types ----------

export interface TimelineStep {
  text: string
  done: boolean
  done_by?: string   // contributor initials
  done_at?: string   // ISO timestamp
}

export interface TimelinePhase {
  kind: 'build' | 'test' | 'rollout' | 'live' | 'wait'
  start: number
  end: number
  label?: string
}

export interface TimelineMilestone {
  at: number
  label: string
}

export interface TimelineProject {
  id: string  // UUID from Supabase
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

  // Load active user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('timeline-user')
    if (stored) setActiveUser(stored)
  }, [])

  // Persist active user
  const pickUser = useCallback((initials: string | null) => {
    setActiveUser(initials)
    if (initials) {
      localStorage.setItem('timeline-user', initials)
    } else {
      localStorage.removeItem('timeline-user')
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('timeline-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_projects',
          filter: `timeline_key=eq.inzinna-leadership`,
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

  /** Toggle a step's done state. Optimistic. */
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
      // Rollback: re-fetch
      refreshProjects()
    }
  }, [activeUser, projects, apiFetch])

  /** Update phases (optimistic + commit). */
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

  /** Update milestone (optimistic + commit). */
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

  /** Update project status. */
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

  /** Add a new project. */
  const addProject = useCallback(async (data: {
    name: string
    one_liner: string
    priority: string
    status: string
    contributors: string[]
    phases: TimelinePhase[]
    steps: { text: string; done: boolean }[]
    support?: string
  }) => {
    if (!activeUser) return
    setLoading(true)

    try {
      await apiFetch('/api/timeline', {
        method: 'POST',
        body: JSON.stringify({ ...data, contributor: activeUser }),
      })
    } catch (err) {
      console.error('[timeline] addProject error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeUser, apiFetch])

  /** Full refresh from server. */
  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/timeline')
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
    updatePhases,
    updateMilestone,
    updateStatus,
    addProject,
    refreshProjects,
  }
}
