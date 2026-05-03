'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'

type Listener = (id: string, content: string) => void
type Status = 'idle' | 'saving' | 'saved' | 'error'

interface EditsContextValue {
  getInitial: (id: string) => string | null
  save: (id: string, html: string) => void
  subscribe: (listener: Listener) => () => void
  resetAll: () => Promise<{ ok: boolean; error?: string }>
  canEdit: boolean
  isAuthed: boolean
  status: Status
  lastEditor: string | null
}

const EditsContext = createContext<EditsContextValue | null>(null)

export function BlindSpotEditsProvider({
  initialEdits,
  initialLastEditor,
  children,
}: {
  initialEdits: Record<string, string>
  initialLastEditor?: string | null
  children: ReactNode
}) {
  const { user } = useAuth()
  const editsRef = useRef<Map<string, string>>(new Map(Object.entries(initialEdits)))
  const listenersRef = useRef<Set<Listener>>(new Set())
  const [status, setStatus] = useState<Status>('idle')
  const [lastEditor, setLastEditor] = useState<string | null>(initialLastEditor ?? null)
  const [allowed, setAllowed] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check allowlist for current user (RLS-backed)
  useEffect(() => {
    let cancelled = false
    if (!user?.email) {
      setAllowed(false)
      return
    }
    supabase
      .from('blindspot_editors')
      .select('email')
      .ilike('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAllowed(!!data)
      })
    return () => {
      cancelled = true
    }
  }, [user?.email])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('blindspot_edits_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blindspot_edits' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { field_id?: string }
            if (!oldRow?.field_id) {
              editsRef.current.clear()
              listenersRef.current.forEach((l) => l('__all__', ''))
              return
            }
            editsRef.current.delete(oldRow.field_id)
            listenersRef.current.forEach((l) => l(oldRow.field_id!, ''))
            return
          }
          const row = payload.new as {
            field_id: string
            content: string
            updated_by_email?: string | null
          }
          if (!row?.field_id) return
          editsRef.current.set(row.field_id, row.content)
          listenersRef.current.forEach((l) => l(row.field_id, row.content))
          if (row.updated_by_email) setLastEditor(row.updated_by_email)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getInitial = useCallback((id: string) => editsRef.current.get(id) ?? null, [])

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const save = useCallback(
    async (id: string, html: string) => {
      if (!allowed || !user) return
      // skip if unchanged
      if (editsRef.current.get(id) === html) return
      setStatus('saving')
      const { error } = await supabase.from('blindspot_edits').upsert(
        {
          field_id: id,
          content: html,
          updated_by: user.id,
          updated_by_email: user.email,
        },
        { onConflict: 'field_id' }
      )
      if (error) {
        console.error('[blindspot] save failed', error)
        setStatus('error')
        return
      }
      editsRef.current.set(id, html)
      setLastEditor(user.email ?? null)
      setStatus('saved')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setStatus('idle'), 1500)
    },
    [allowed, user]
  )

  const resetAll = useCallback(async () => {
    if (!allowed) return { ok: false, error: 'Not authorized' }
    const { error } = await supabase
      .from('blindspot_edits')
      .delete()
      .not('field_id', 'is', null)
    if (error) return { ok: false, error: error.message }
    editsRef.current.clear()
    listenersRef.current.forEach((l) => l('__all__', ''))
    return { ok: true }
  }, [allowed])

  const value = useMemo<EditsContextValue>(
    () => ({
      getInitial,
      save,
      subscribe,
      resetAll,
      canEdit: allowed,
      isAuthed: !!user,
      status,
      lastEditor,
    }),
    [getInitial, save, subscribe, resetAll, allowed, user, status, lastEditor]
  )

  return <EditsContext.Provider value={value}>{children}</EditsContext.Provider>
}

export function useBlindSpotEdits() {
  const ctx = useContext(EditsContext)
  if (!ctx) throw new Error('useBlindSpotEdits must be inside BlindSpotEditsProvider')
  return ctx
}
