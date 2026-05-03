'use client'

import { useEffect, useRef } from 'react'

const KEY_PREFIX = 'blindspot-edit-'

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

  useEffect(() => {
    const saved = typeof window === 'undefined' ? null : localStorage.getItem(`${KEY_PREFIX}${id}`)
    if (saved && ref.current) {
      ref.current.innerHTML = saved
    }
  }, [id])

  const handleBlur = () => {
    if (ref.current) {
      localStorage.setItem(`${KEY_PREFIX}${id}`, ref.current.innerHTML)
    }
  }

  const props = {
    ref: ref as React.MutableRefObject<HTMLElement>,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: handleBlur,
    className,
    spellCheck: true,
  }

  // Tag is constrained, so this is safe.
  return <Tag {...(props as React.HTMLAttributes<HTMLElement>)}>{children}</Tag>
}

export function ResetEditsButton() {
  const handleClick = () => {
    if (typeof window === 'undefined') return
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
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
