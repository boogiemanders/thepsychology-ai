'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Database } from 'lucide-react'

export function DemoDataButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function loadDemoData() {
    setLoading(true)
    try {
      const response = await fetch('/SENSE/api/demo-data', {
        method: 'POST',
      })
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to load demo data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={loadDemoData}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 tap-target"
    >
      <Database className="w-4 h-4" />
      {loading ? 'Loading...' : 'Load Demo Data'}
    </button>
  )
}
