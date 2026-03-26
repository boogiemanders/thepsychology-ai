'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/components/wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function StepReview() {
  const { data, goToStep } = useWizard()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.access_token) throw new Error('Not authenticated')

      const res = await fetch('/api/provider/profile/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit profile')
      }

      router.push('/provider/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const d = data as Record<string, unknown>

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review your profile information before submitting for review.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Credentials</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => goToStep(0)}>Edit</Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">License:</span> {String(d.license_type ?? '')} — {String(d.license_number ?? '')} ({String(d.license_state ?? '')})</p>
          {d.npi_number ? <p><span className="text-muted-foreground">NPI:</span> {String(d.npi_number)}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Specializations</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>Edit</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Modalities</p>
            <div className="flex flex-wrap gap-1">
              {((d.modalities as string[]) ?? []).map((m) => <Badge key={m} variant="secondary">{m}</Badge>)}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Conditions</p>
            <div className="flex flex-wrap gap-1">
              {((d.conditions_treated as string[]) ?? []).map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Populations</p>
            <div className="flex flex-wrap gap-1">
              {((d.populations_served as string[]) ?? []).map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bio & Approach</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => goToStep(5)}>Edit</Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{String(d.bio_text ?? '').slice(0, 200)}{String(d.bio_text ?? '').length > 200 ? '...' : ''}</p>
          <Separator />
          <p>{String(d.approach_text ?? '').slice(0, 200)}{String(d.approach_text ?? '').length > 200 ? '...' : ''}</p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={() => goToStep(5)}>Back</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit for Review</>
          )}
        </Button>
      </div>
    </div>
  )
}
