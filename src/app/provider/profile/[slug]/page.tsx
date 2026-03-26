import type { Metadata } from 'next'
import { getSupabaseClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return { title: 'Provider | thepsychology.ai' }

  const { data } = await supabase
    .from('provider_profiles')
    .select('bio_text, user_id')
    .eq('id', slug)
    .eq('status', 'active')
    .single()

  if (!data) return { title: 'Provider | thepsychology.ai' }

  const { data: user } = await supabase.from('users').select('full_name').eq('id', data.user_id).single()

  return {
    title: `${user?.full_name ?? 'Provider'} | thepsychology.ai`,
    description: data.bio_text?.slice(0, 160) ?? 'View this provider\'s profile',
  }
}

export default async function ProviderProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) notFound()

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', slug)
    .eq('status', 'active')
    .single()

  if (!profile) notFound()

  const { data: user } = await supabase.from('users').select('full_name').eq('id', profile.user_id).single()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight">{user?.full_name ?? 'Provider'}</h1>
        <p className="text-muted-foreground mt-1">
          {profile.license_type} — {profile.license_state}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-relaxed">{profile.bio_text}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Therapeutic Approach</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-relaxed">{profile.approach_text}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Specializations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Modalities</p>
              <div className="flex flex-wrap gap-1">
                {(profile.modalities ?? []).map((m: string) => <Badge key={m} variant="secondary">{m}</Badge>)}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Conditions Treated</p>
              <div className="flex flex-wrap gap-1">
                {(profile.conditions_treated ?? []).map((c: string) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Populations</p>
              <div className="flex flex-wrap gap-1">
                {(profile.populations_served ?? []).map((p: string) => <Badge key={p} variant="secondary">{p}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Languages:</span> {(profile.languages_spoken ?? []).join(', ')}</p>
            {profile.lgbtq_affirming && <Badge variant="outline">LGBTQ+ Affirming</Badge>}
            {profile.faith_integrated && <Badge variant="outline">Faith-Integrated</Badge>}
            <Separator />
            <p><span className="text-muted-foreground">Insurance:</span> {(profile.insurance_networks ?? []).length > 0 ? (profile.insurance_networks ?? []).join(', ') : 'Not listed'}</p>
            {profile.accepts_self_pay && profile.self_pay_rate_cents && (
              <p><span className="text-muted-foreground">Self-Pay Rate:</span> ${(profile.self_pay_rate_cents / 100).toFixed(0)}/session</p>
            )}
            {profile.sliding_scale_available && (
              <p><span className="text-muted-foreground">Sliding Scale:</span> Available{profile.sliding_scale_min_cents ? ` (from $${(profile.sliding_scale_min_cents / 100).toFixed(0)})` : ''}</p>
            )}
            <p><span className="text-muted-foreground">Telehealth:</span> {(profile.telehealth_states ?? []).join(', ')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
