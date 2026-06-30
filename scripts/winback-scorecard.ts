/**
 * Win-back A/B scorecard. Reads funnel_events to show which testimonial variant reconverts best.
 *
 *   npx tsx scripts/winback-scorecard.ts
 *
 * Sent      = funnel_events 'winback_sent' (one per user, written by send-downgrade-emails.ts),
 *             bucketed by metadata.variant (A/B/C).
 * Reconvert = a 'checkout_completed' for that same user dated AFTER their win-back send.
 *             (checkout_completed is the repo's purchase event in funnel_events.)
 *
 * GA cross-check: each variant carries its own utm_campaign (winback-a/b/c-*) on the CTA, so
 * GA4 acquisition-by-campaign should roughly agree with the reconvert counts here.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

type Sent = { user_id: string; variant: string; sentAt: number }

async function main() {
  const { data: sentRows, error: sentErr } = await supabase
    .from('funnel_events')
    .select('user_id, metadata, created_at')
    .eq('event_name', 'winback_sent')
    .order('created_at', { ascending: true })
  if (sentErr) {
    console.error('Failed to read winback_sent:', sentErr)
    process.exit(1)
  }

  // One send per user (earliest wins, defends against any accidental double-send).
  const sentByUser = new Map<string, Sent>()
  for (const r of sentRows || []) {
    if (sentByUser.has(r.user_id)) continue
    const variant = ((r.metadata as Record<string, unknown> | null)?.variant as string) || '?'
    sentByUser.set(r.user_id, { user_id: r.user_id, variant, sentAt: new Date(r.created_at).getTime() })
  }

  if (sentByUser.size === 0) {
    console.log('No winback_sent events yet. Run the sender (without --dry-run) first.')
    return
  }

  // Reconversions: checkout_completed dated after each recipient's send.
  const userIds = Array.from(sentByUser.keys())
  const { data: purchases, error: pErr } = await supabase
    .from('funnel_events')
    .select('user_id, created_at')
    .eq('event_name', 'checkout_completed')
    .in('user_id', userIds)
  if (pErr) {
    console.error('Failed to read checkout_completed:', pErr)
    process.exit(1)
  }

  const reconverted = new Set<string>()
  for (const p of purchases || []) {
    const s = sentByUser.get(p.user_id)
    if (s && new Date(p.created_at).getTime() > s.sentAt) reconverted.add(p.user_id)
  }

  // Aggregate per variant.
  const agg: Record<string, { sent: number; conv: number }> = {}
  for (const s of sentByUser.values()) {
    agg[s.variant] = agg[s.variant] || { sent: 0, conv: 0 }
    agg[s.variant].sent += 1
    if (reconverted.has(s.user_id)) agg[s.variant].conv += 1
  }

  console.log('\nWin-back A/B scorecard')
  console.log('======================')
  console.log('variant   sent   reconverted   rate')
  for (const key of Object.keys(agg).sort()) {
    const { sent, conv } = agg[key]
    const rate = sent ? ((conv / sent) * 100).toFixed(1) + '%' : '-'
    console.log(`  ${key.padEnd(6)} ${String(sent).padStart(5)} ${String(conv).padStart(13)}   ${rate}`)
  }
  const totalSent = sentByUser.size
  const totalConv = reconverted.size
  console.log('  ' + '-'.repeat(34))
  console.log(`  ${'TOTAL'.padEnd(6)} ${String(totalSent).padStart(5)} ${String(totalConv).padStart(13)}   ${totalSent ? ((totalConv / totalSent) * 100).toFixed(1) + '%' : '-'}`)
  console.log('\n(Reconvert = a checkout_completed after the win-back send. Cross-check with GA4 by utm_campaign winback-*.)')

  // ---- Share funnel: opened the share modal (/passed) -> left a testimonial, per variant ----
  const variantFromUtm = (utm: string | null | undefined): string => {
    const m = /^winback-([abc])/i.exec(utm || '')
    return m ? m[1].toUpperCase() : '?'
  }

  const { data: opens } = await supabase
    .from('funnel_events')
    .select('user_id, metadata')
    .eq('event_name', 'winback_share_opened')

  // One open per user. Attribute to the variant they were SENT (authoritative); fall back to the
  // link's utm if they somehow opened without a recorded send.
  const openByUser = new Map<string, string>()
  for (const o of opens || []) {
    if (openByUser.has(o.user_id)) continue
    const utm = (o.metadata as Record<string, unknown> | null)?.utm_campaign as string | undefined
    openByUser.set(o.user_id, sentByUser.get(o.user_id)?.variant || variantFromUtm(utm))
  }

  // Testimonials submitted via the "I passed" path (source=passed_eppp).
  const { data: stories } = await supabase
    .from('user_rewards')
    .select('user_id')
    .eq('reward_type', 'testimonial')
    .filter('submission_data->>source', 'eq', 'passed_eppp')
  const submitted = new Set((stories || []).map((r: { user_id: string }) => r.user_id))

  const shareAgg: Record<string, { opened: number; sub: number }> = {}
  for (const [uid, v] of openByUser) {
    shareAgg[v] = shareAgg[v] || { opened: 0, sub: 0 }
    shareAgg[v].opened += 1
    if (submitted.has(uid)) shareAgg[v].sub += 1
  }

  console.log('\nShare funnel (opened the share modal -> left a testimonial)')
  console.log('==========================================================')
  if (openByUser.size === 0) {
    console.log('  No winback_share_opened events yet.')
  } else {
    console.log('variant   opened   testimonials   rate')
    for (const key of Object.keys(shareAgg).sort()) {
      const { opened, sub } = shareAgg[key]
      const rate = opened ? ((sub / opened) * 100).toFixed(1) + '%' : '-'
      console.log(`  ${key.padEnd(6)} ${String(opened).padStart(6)} ${String(sub).padStart(14)}   ${rate}`)
    }
  }
  console.log(`  total testimonials via "I passed": ${submitted.size}`)
  console.log('\n(Share funnel is separate from the purchase funnel above; a user can do either, both, or neither.)')
}

main()
