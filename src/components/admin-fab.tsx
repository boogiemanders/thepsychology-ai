'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronUp, Users, GraduationCap } from 'lucide-react'

function getAdminAllowlist(): string[] {
  // Require explicit configuration - no hardcoded fallback for security
  const configured = process.env.NEXT_PUBLIC_RECOVER_ADMIN_EMAILS
  if (!configured || configured.trim().length === 0) {
    return []
  }

  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="minimal" size="sm" className="text-xs opacity-60 hover:opacity-100">
            Admin
            <ChevronUp className="w-3 h-3 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-48 p-1">
          <Link
            href="/admin/recover"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Users className="w-4 h-4" />
            Users & Recover
          </Link>
          <Link
            href="/admin/programs"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Graduate Programs
          </Link>
        </PopoverContent>
      </Popover>
    </div>
  )
}

