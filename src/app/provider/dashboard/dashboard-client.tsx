'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { ProviderProfile } from '@/types/matching'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_review: { label: 'Pending Review', variant: 'outline' },
  active: { label: 'Active', variant: 'default' },
  suspended: { label: 'Suspended', variant: 'destructive' },
  inactive: { label: 'Inactive', variant: 'secondary' },
}

export function ProviderDashboardClient() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.access_token) return

      const res = await fetch('/api/provider/profile', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile || null)
      }
      setLoadingProfile(false)
    }
    if (!loading) fetchProfile()
  }, [user, loading])

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Please sign in to access your dashboard.</p>
      </div>
    )
  }

  const status = profile?.status ? STATUS_LABELS[profile.status] : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Provider Dashboard</h1>
          {status && <Badge variant={status.variant} className="mt-2">{status.label}</Badge>}
        </div>
      </div>

      {!profile || profile.status === 'draft' ? (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your provider profile is incomplete. Complete it to start getting matched with clients.
            </p>
            <Link href="/provider/onboard">
              <Button>Continue Onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      ) : profile.status === 'pending_review' ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your profile has been submitted and is under review. We&apos;ll notify you once it&apos;s approved.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Clients Matched</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-medium">0</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming Sessions</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-medium">0</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Profile Views</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-medium">0</p></CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
