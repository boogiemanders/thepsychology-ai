'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/auth-context'

const COPY_ALLOWED_EMAIL = 'chanders0@yahoo.com'

const isEditableElement = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return true
  if (el.isContentEditable) return true
  return false
}

export function CopyProtection() {
  const { user, userProfile } = useAuth()
  const normalizedEmail = (userProfile?.email ?? user?.email ?? '').trim().toLowerCase()
  const allowCopy = normalizedEmail === COPY_ALLOWED_EMAIL

  useEffect(() => {
    if (allowCopy) return

    const listenerOptions: AddEventListenerOptions = { capture: true }

    const blockClipboard = (event: ClipboardEvent) => {
      if (isEditableElement(event.target)) return
      event.preventDefault()
      if (event.clipboardData) {
        event.clipboardData.clearData()
      }
    }

    const blockCopyKeys = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (isEditableElement(document.activeElement)) return
      const key = event.key.toLowerCase()
      if (key === 'c' || key === 'x') {
        event.preventDefault()
      }
    }

    const blockDragStart = (event: DragEvent) => {
      if (isEditableElement(event.target)) return
      event.preventDefault()
    }

    document.addEventListener('copy', blockClipboard, listenerOptions)
    document.addEventListener('cut', blockClipboard, listenerOptions)
    document.addEventListener('keydown', blockCopyKeys, listenerOptions)
    document.addEventListener('dragstart', blockDragStart, listenerOptions)

    return () => {
      document.removeEventListener('copy', blockClipboard, listenerOptions)
      document.removeEventListener('cut', blockClipboard, listenerOptions)
      document.removeEventListener('keydown', blockCopyKeys, listenerOptions)
      document.removeEventListener('dragstart', blockDragStart, listenerOptions)
    }
  }, [allowCopy])

  return null
}
