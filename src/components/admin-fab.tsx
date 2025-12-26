'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

function getAdminAllowlist(): string[] {
  const configured = process.env.NEXT_PUBLIC_RECOVER_ADMIN_EMAILS
  if (configured && configured.trim().length > 0) {
    return configured
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  }

  return ['chanders0@yahoo.com']
}

export function AdminFab() {
  const { user } = useAuth()

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase()
    if (!email) return false
    return getAdminAllowlist().includes(email)
  }, [user?.email])

  if (!isAdmin) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button asChild variant="minimal" size="sm" className="text-xs opacity-60 hover:opacity-100">
        <Link href="/admin/recover">Admin</Link>
      </Button>
    </div>
  )
}

