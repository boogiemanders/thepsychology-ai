'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type RewardStatus = 'pending' | 'approved' | 'rejected'

type AdminReward = {
  id: string
  user_id: string
  reward_type: 'video' | 'testimonial' | 'referral'
  status: RewardStatus
  submission_data: Record<string, string>
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  user_email: string
}

type AdminRewardsPanelProps = {
  embedded?: boolean
}

export function AdminRewardsPanel({ embedded = false }: AdminRewardsPanelProps) {
  const router = useRouter()
  const [rewards, setRewards] = useState<AdminReward[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<RewardStatus>('pending')

  const fetchRewards = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/rewards/admin?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/dashboard')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch rewards')
      }

      const data = await res.json()
      setRewards(data.rewards || [])
    } catch (err) {
      console.error('Failed to fetch rewards:', err)
    } finally {
      setLoading(false)
    }
  }, [router, statusFilter])

  useEffect(() => {
    setLoading(true)
    void fetchRewards()
  }, [fetchRewards])

  const handleAction = async (rewardId: string, action: 'approve' | 'reject') => {
    setActionLoading(rewardId)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.push('/login')
      return
    }

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

  return (
    <div className={embedded ? 'p-6 space-y-6' : 'space-y-6'}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pro Rewards</h2>
          <p className="text-sm text-muted-foreground">Review pending video, testimonial, and referral submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RewardStatus)}>
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : rewards.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No {statusFilter} rewards.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>Date</TableHead>
                {statusFilter === 'pending' ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : (
                  <TableHead>Reviewed by</TableHead>
                )}
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
  )
}
