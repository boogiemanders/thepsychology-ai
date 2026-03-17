'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AdminRewardsPanel } from '../recover/components/admin-rewards-panel'

function getAdminAllowlist(): string[] {
  const configured = process.env.NEXT_PUBLIC_RECOVER_ADMIN_EMAILS
  if (!configured || configured.trim().length === 0) return []
  return configured.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

export default function AdminRewardsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase()
    if (!email) return false
    return getAdminAllowlist().includes(email)
  }, [user?.email])

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-semibold">Pro Rewards</h1>
        </div>

        <AdminRewardsPanel />
      </div>
    </div>
  )
}
