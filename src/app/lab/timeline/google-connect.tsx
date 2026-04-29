'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ConnectedAccount {
  leader_initials: string
  google_email: string
  last_sync_at: string | null
}

interface GoogleConnectProps {
  activeUser: string | null
}

export function GoogleConnect({ activeUser }: GoogleConnectProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/google/status')
      .then(r => r.json())
      .then(d => setAccounts(d.accounts ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false))

    const params = new URLSearchParams(window.location.search)
    if (params.get('gconnected')) {
      setBanner(`Google connected for ${params.get('gconnected')}`)
      cleanUrl()
    } else if (params.get('gerror')) {
      setBanner(`Google connect failed: ${params.get('gerror')}`)
      cleanUrl()
    }
  }, [])

  if (!activeUser) return null

  const connected = accounts.find(a => a.leader_initials === activeUser)

  return (
    <div className="mt-3 flex items-center gap-2 text-[10px] font-mono">
      {banner && (
        <span className="rounded-full border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-zinc-500 dark:text-zinc-400">
          {banner}
        </span>
      )}
      {loading ? (
        <span className="text-zinc-400">Checking Google...</span>
      ) : connected ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-emerald-700 dark:text-emerald-300"
          title={`Connected: ${connected.google_email}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Google Calendar synced
        </span>
      ) : (
        <a
          href={`/api/auth/google/start?leader=${encodeURIComponent(activeUser)}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 px-2.5 py-1',
            'hover:border-zinc-500 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors',
          )}
        >
          Connect Google Calendar
        </a>
      )}
    </div>
  )
}

function cleanUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('gconnected')
  url.searchParams.delete('gerror')
  window.history.replaceState({}, '', url.toString())
}
