'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'wais5-present-stim'

export default function WaisPresentPage() {
  const [stim, setStim] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  // Hydrate from localStorage on mount + subscribe to BroadcastChannel + storage events.
  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY)
      if (last) setStim(last)
    } catch {}

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('wais5-present') : null
    const onMsg = (e: MessageEvent) => {
      if (e.data && typeof e.data.stim === 'string') setStim(e.data.stim)
    }
    channel?.addEventListener('message', onMsg)

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setStim(e.newValue)
    }
    window.addEventListener('storage', onStorage)

    return () => {
      channel?.removeEventListener('message', onMsg)
      channel?.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Fetch a signed URL whenever the stim path changes.
  useEffect(() => {
    if (!stim) { setUrl(null); return }
    let cancelled = false
    supabase.storage
      .from('wais5-stim')
      .createSignedUrl(stim, 60 * 60)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) { setUrl(null); return }
        setUrl(data.signedUrl)
      })
    return () => { cancelled = true }
  }, [stim])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-screen max-w-screen object-contain" />
      ) : (
        <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-zinc-500">
          Waiting for examiner…
        </p>
      )}
    </div>
  )
}
