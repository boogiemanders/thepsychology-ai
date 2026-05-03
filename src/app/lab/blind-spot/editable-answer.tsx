'use client'

import { useEffect, useRef } from 'react'
import { useBlindSpotEdits } from './edits-provider'

export function EditableArea({
  id,
  children,
  className,
  as: Tag = 'div',
}: {
  id: string
  children: React.ReactNode
  className?: string
  as?: 'div' | 'h1' | 'h3' | 'p'
}) {
  const ref = useRef<HTMLElement>(null)
  const focusedRef = useRef(false)
  const { getInitial, save, subscribe, canEdit } = useBlindSpotEdits()

  // Apply initial server-loaded value
  useEffect(() => {
    const initial = getInitial(id)
    if (initial != null && ref.current && ref.current.innerHTML !== initial) {
      ref.current.innerHTML = initial
    }
  }, [id, getInitial])

  // Realtime updates from collaborators
  useEffect(() => {
    return subscribe((changedId, content) => {
      if (changedId !== id && changedId !== '__all__') return
      if (!ref.current) return
      if (focusedRef.current) return // don't clobber while user types
      if (changedId === '__all__') {
        // Reset to children: we can't easily re-render React children imperatively,
        // so reload the page when reset happens.
        location.reload()
        return
      }
      if (ref.current.innerHTML !== content) {
        ref.current.innerHTML = content
      }
    })
  }, [id, subscribe])

  const handleBlur = () => {
    focusedRef.current = false
    if (!ref.current) return
    save(id, ref.current.innerHTML)
  }
  const handleFocus = () => {
    focusedRef.current = true
  }

  const props = {
    ref: ref as React.MutableRefObject<HTMLElement>,
    contentEditable: canEdit,
    suppressContentEditableWarning: true,
    onBlur: handleBlur,
    onFocus: handleFocus,
    className,
    spellCheck: true,
  }

  return <Tag {...(props as React.HTMLAttributes<HTMLElement>)}>{children}</Tag>
}

export function ResetEditsButton() {
  const { canEdit, resetAll } = useBlindSpotEdits()
  if (!canEdit) return null
  const handleClick = async () => {
    if (typeof window === 'undefined') return
    if (!confirm('Reset every edit? Wipes saved changes for everyone.')) return
    const res = await resetAll()
    if (!res.ok) {
      alert('Reset failed: ' + (res.error ?? 'unknown'))
      return
    }
    location.reload()
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
    >
      Reset edits
    </button>
  )
}

export function EditingStatusBanner() {
  const { canEdit, isAuthed, status, lastEditor } = useBlindSpotEdits()

  let label = ''
  if (!isAuthed) {
    label = 'Read only · sign in to edit'
  } else if (!canEdit) {
    label = 'Read only · ask Anders to add you'
  } else {
    if (status === 'saving') label = 'Saving…'
    else if (status === 'saved') label = 'Saved'
    else if (status === 'error') label = 'Save failed'
    else label = 'Live editing'
  }

  return (
    <div className="flex items-center gap-x-3 font-mono text-[10px] uppercase tracking-[0.22em]">
      <span
        className={
          'h-1.5 w-1.5 rounded-full ' +
          (status === 'error'
            ? 'bg-red-500'
            : canEdit
            ? 'bg-emerald-500'
            : 'bg-zinc-400 dark:bg-zinc-600')
        }
      />
      <span className="text-zinc-500 dark:text-zinc-500">{label}</span>
      {lastEditor ? (
        <span className="text-zinc-400 dark:text-zinc-600">· last by {lastEditor}</span>
      ) : null}
    </div>
  )
}

export function SignInPrompt() {
  const { isAuthed } = useBlindSpotEdits()
  if (isAuthed) return null
  return (
    <a
      href="/login?redirect=/lab/blind-spot"
      className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-50 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-900 dark:hover:decoration-zinc-50 transition-colors"
    >
      Sign in to edit
    </a>
  )
}
