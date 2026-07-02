import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'
import { EPPP_DOMAINS } from '@/lib/eppp-data'

// Notify the founder when a user submits an EPPP result (ExamResultForm). Fires on EVERY submission,
// not just testimonials (the /api/rewards/submit path only pings on pass+testimonial, so plain "did
// not pass" and "passed, no testimonial" rows used to land silently). Founder email carries the
// details (PII ok per policy); Slack ping is PII-free.
//
// The user is derived from their session token, so a caller can only notify for their own submission.

export const runtime = 'nodejs'

const domainName = (id: string) => EPPP_DOMAINS.find((d) => d.id === id)?.name || id

export async function POST(request: NextRequest) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  const { data: auth, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = auth.user.id

  // Read the user's most recent result row + their identity (service role bypasses RLS).
  const [{ data: result }, { data: profile }] = await Promise.all([
    supabase.from('eppp_exam_results').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('users').select('email, full_name').eq('id', userId).maybeSingle(),
  ])
  if (!result) return NextResponse.json({ error: 'No result found' }, { status: 404 })

  const who = profile?.full_name ? `${profile.full_name} (${profile.email})` : profile?.email || userId
  const outcome = result.passed ? 'PASSED' : 'DID NOT PASS'
  const score = result.scaled_score != null ? `scaled ${result.scaled_score}` : 'no score given'
  const weak = Array.isArray(result.weak_domains) && result.weak_domains.length ? result.weak_domains.map(domainName).join(', ') : 'none noted'

  // Slack: PII-free (no name/email), per notification policy.
  const slackMsg = `New EPPP result reported: ${outcome}, ${score}, attempt ${result.attempt_number ?? '?'}.` +
    (result.testimonial_interest ? ' Testimonial offered.' : '') +
    (result.passed && !result.testimonial_interest ? ' (passed, no testimonial — consider asking.)' : '')
  await sendSlackNotification(slackMsg, 'signups').catch(() => {})

  // Founder email: full detail (PII allowed).
  if (isNotificationEmailConfigured()) {
    const lines = [
      `${who} just reported an EPPP result.`,
      ``,
      `Outcome: ${outcome}`,
      `Score: ${score}`,
      `Attempt: ${result.attempt_number ?? '?'}`,
      `Exam date: ${result.exam_date || 'not given'}`,
      `Hardest domains: ${weak}`,
      `Testimonial: ${result.testimonial_interest ? 'YES — ' + (result.testimonial_text || '(interested, no text yet)') : 'no'}`,
      result.testimonial_display_name ? `Display name: ${result.testimonial_display_name}` : '',
      result.notes ? `Notes: ${result.notes}` : '',
      result.score_report_path ? `Score report uploaded: ${result.score_report_path}` : '',
      ``,
      result.passed && !result.testimonial_interest
        ? `They passed but did not offer a testimonial. Good candidate to reach out to for one.`
        : '',
    ].filter(Boolean)
    await sendNotificationEmail({
      subject: `EPPP result: ${outcome}${result.scaled_score != null ? ` (${result.scaled_score})` : ''} — ${profile?.email || userId}`,
      text: lines.join('\n'),
    }).catch((err) => console.error('[exam-result/notify] email failed:', err))
  }

  return NextResponse.json({ ok: true })
}
