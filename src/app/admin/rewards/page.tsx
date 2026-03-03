'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Check, X, Loader2, ExternalLink } from 'lucide-react'

function getAdminAllowlist(): string[] {
  const configured = process.env.NEXT_PUBLIC_RECOVER_ADMIN_EMAILS
  if (!configured || configured.trim().length === 0) return []
  return configured.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

interface AdminReward {
  id: string
  user_id: string
  reward_type: 'video' | 'testimonial' | 'referral'
  status: 'pending' | 'approved' | 'rejected'
  submission_data: Record<string, string>
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  user_email: string
}

export default function AdminRewardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rewards, setRewards] = useState<AdminReward[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase()
    if (!email) return false
    return getAdminAllowlist().includes(email)
  }, [user?.email])

  const fetchRewards = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    try {
      const res = await fetch(`/api/rewards/admin?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 403) {
        router.push('/dashboard')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setRewards(data.rewards)
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, router])

  useEffect(() => {
    if (isAdmin) {
      setLoading(true)
      fetchRewards()
    } else if (user) {
      router.push('/dashboard')
    }
  }, [isAdmin, user, fetchRewards, router])

  const handleAction = async (rewardId: string, action: 'approve' | 'reject') => {
    setActionLoading(rewardId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    try {
      const res = await fetch('/api/rewards/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rewardId, action }),
      })

      if (res.ok) {
        await fetchRewards()
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

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

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No {statusFilter} rewards.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Date</TableHead>
                  {statusFilter === 'pending' && <TableHead className="text-right">Actions</TableHead>}
                  {statusFilter !== 'pending' && <TableHead>Reviewed by</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="text-sm">{reward.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {reward.reward_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {reward.reward_type === 'video' ? (
                        <a
                          href={reward.submission_data.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          View video <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : reward.reward_type === 'testimonial' ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {reward.submission_data.text}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Referred: {reward.submission_data.referred_user_email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(reward.created_at).toLocaleDateString()}
                    </TableCell>
                    {statusFilter === 'pending' ? (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(reward.id, 'approve')}
                            disabled={actionLoading === reward.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {actionLoading === reward.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span className="ml-1">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(reward.id, 'reject')}
                            disabled={actionLoading === reward.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3" />
                            <span className="ml-1">Reject</span>
                          </Button>
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell className="text-sm text-muted-foreground">
                        {reward.reviewed_by ?? '—'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
