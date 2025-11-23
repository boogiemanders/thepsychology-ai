'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Mail, User, MessageCircle, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'

interface FeedbackRow {
  id: string
  created_at: string
  user_id: string | null
  user_email: string | null
  message: string
  page_path: string | null
  screenshot_path: string | null
  is_anonymous: boolean
  status: string | null
}

export default function FeedbackInboxPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<FeedbackRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }

    const fetchFeedback = async () => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setItems((data || []) as FeedbackRow[])
      } catch (err) {
        console.error('Failed to load feedback inbox:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [loading, router, user])

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id)
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item)),
      )
    } catch (err) {
      console.error('Failed to update feedback status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (status === 'replied') {
      return (
        <Badge className="gap-1 bg-emerald-600/20 text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Replied
        </Badge>
      )
    }
    if (status === 'in_progress') {
      return (
        <Badge className="gap-1 bg-amber-500/20 text-amber-300">
          <Clock className="h-3 w-3" />
          In progress
        </Badge>
      )
    }
    return (
      <Badge className="gap-1 bg-slate-600/20 text-slate-200">
        <AlertCircle className="h-3 w-3" />
        New
      </Badge>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Feedback Inbox</h1>
          <p className="text-sm text-muted-foreground">
            All in-app messages and screenshots, including those from the trial-expired page.
          </p>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Messages</CardTitle>
              <CardDescription>
                Reply from your email client using the address shown, then mark each item as in progress or replied.
              </CardDescription>
            </div>
            {userProfile?.email && (
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>Replies from: {userProfile.email}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Loading inbox...
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <p>No feedback messages yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[520px]">
                <div className="divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(item.status)}
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.created_at)}
                            </span>
                            {item.page_path && (
                              <span className="text-xs text-muted-foreground/80">
                                from <span className="font-mono">{item.page_path}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.is_anonymous ? (
                                <span>Anonymous</span>
                              ) : item.user_email ? (
                                <span>{item.user_email}</span>
                              ) : (
                                <span>Unknown user</span>
                              )}
                            </div>
                            {item.user_id && (
                              <span className="font-mono text-[11px] text-muted-foreground/70">
                                id: {item.user_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                          >
                            Mark in progress
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, 'replied')}
                          >
                            Mark replied
                          </Button>
                        </div>
                      </div>

                      <Separator className="border-border/60" />

                      <p className="whitespace-pre-wrap text-sm text-foreground">
                        {item.message}
                      </p>

                      {item.screenshot_path && (
                        <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-[10px] font-semibold">
                              IMG
                            </span>
                            <span className="truncate max-w-[220px]">{item.screenshot_path}</span>
                          </span>
                          <span className="text-[11px]">
                            View in Supabase storage
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

