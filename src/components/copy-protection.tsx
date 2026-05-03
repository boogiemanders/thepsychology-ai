'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/auth-context'

const COPY_ALLOWED_EMAILS = ['chanders0@yahoo.com', 'dranders@drinzinna.com']

export function CopyProtection() {
  const { user, userProfile } = useAuth()
  const normalizedEmail = (userProfile?.email ?? user?.email ?? '').trim().toLowerCase()
  const allowClipboard = COPY_ALLOWED_EMAILS.includes(normalizedEmail)

  useEffect(() => {
    if (allowClipboard) return

    const listenerOptions: AddEventListenerOptions = { capture: true }

    const blockClipboard = (event: ClipboardEvent) => {
      event.preventDefault()
      if (event.clipboardData) {
        event.clipboardData.clearData()
      }
    }

    const blockCopyKeys = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === 'c' || key === 'x' || key === 'v') {
        event.preventDefault()
      }
    }

    const blockDragStart = (event: DragEvent) => event.preventDefault()

    document.addEventListener('copy', blockClipboard, listenerOptions)
    document.addEventListener('cut', blockClipboard, listenerOptions)
    document.addEventListener('paste', blockClipboard, listenerOptions)
    document.addEventListener('keydown', blockCopyKeys, listenerOptions)
    document.addEventListener('dragstart', blockDragStart, listenerOptions)

    return () => {
      document.removeEventListener('copy', blockClipboard, listenerOptions)
      document.removeEventListener('cut', blockClipboard, listenerOptions)
      document.removeEventListener('paste', blockClipboard, listenerOptions)
      document.removeEventListener('keydown', blockCopyKeys, listenerOptions)
      document.removeEventListener('dragstart', blockDragStart, listenerOptions)
    }
  }, [allowClipboard])

  return null
}
