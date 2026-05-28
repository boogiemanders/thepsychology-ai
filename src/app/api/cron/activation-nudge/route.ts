import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail } from '@/lib/notify-email'

const CRON_SECRET = process.env.CRON_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepsychology.ai'

type NudgeUser = {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

const firstName = (u: NudgeUser): string => {
  const raw = (u.full_name || '').trim().split(/\s+/)[0]
  return raw || 'there'
}

const day1Url = `${SITE_URL}/exam-generator?utm_source=onboarding&utm_medium=email&utm_campaign=day1_first_exam`
const day2Url = `${SITE_URL}/exam-generator?utm_source=onboarding&utm_medium=email&utm_campaign=day2_fomo`
const day3Url = `${SITE_URL}/exam-generator?utm_source=onboarding&utm_medium=email&utm_campaign=day3_stakes`

const buttonHtml = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;margin:12px 0;">${label}</a>`

function renderDay1(u: NudgeUser) {
  const name = firstName(u)
  const subject = 'Your first practice exam is waiting'
  const text = [
    `Hi ${name},`,
    '',
    'Welcome to thepsychology.ai. You signed up recently but haven\'t started your first practice exam yet.',
    '',
    'Most students start with a 20 question diagnostic. It takes about 15 minutes and shows you which EPPP domains you already know well and which ones need more attention.',
    '',
    'When you\'re ready, your first exam is one click away:',
    day1Url,
    '',
    'If you have any questions before diving in, just reply to this email.',
    '',
    'Good luck with your prep,',
    'The thepsychology.ai team',
  ].join('\n')
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#111;max-width:560px;">
      <p>Hi ${name},</p>
      <p>Welcome to thepsychology.ai. You signed up recently but haven\'t started your first practice exam yet.</p>
      <p>Most students start with a 20 question diagnostic. It takes about 15 minutes and shows you which EPPP domains you already know well and which ones need more attention.</p>
      <p>When you\'re ready, your first exam is one click away:</p>
      <p>${buttonHtml(day1Url, 'Start your first practice exam')}</p>
      <p>If you have any questions before diving in, just reply to this email.</p>
      <p>Good luck with your prep,<br/>The thepsychology.ai team</p>
    </div>`
  return { subject, text, html }
}

function renderDay2(u: NudgeUser, studentsThisWeek: number) {
  const name = firstName(u)
  const peers = Math.max(studentsThisWeek, 5)
  const subject = `${peers} students took their first practice exam this week`
  const text = [
    `Hi ${name},`,
    '',
    `Quick note: ${peers} students took their first EPPP practice exam this week on thepsychology.ai. Your account is still waiting on your first one.`,
    '',
    '15 minutes is all it takes to see your weakest domain. You\'ll know exactly where to focus your prep.',
    '',
    `See where you stand: ${day2Url}`,
    '',
    'No pressure if you\'ve changed your mind. But if you\'re still planning to take the EPPP, the sooner you know your baseline, the better.',
    '',
    'Good luck,',
    'The thepsychology.ai team',
  ].join('\n')
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#111;max-width:560px;">
      <p>Hi ${name},</p>
      <p><strong>${peers} students</strong> took their first EPPP practice exam this week on thepsychology.ai. Your account is still waiting on your first one.</p>
      <p>15 minutes is all it takes to see your weakest domain. You\'ll know exactly where to focus your prep.</p>
      <p>${buttonHtml(day2Url, 'See where you stand')}</p>
      <p>No pressure if you\'ve changed your mind. But if you\'re still planning to take the EPPP, the sooner you know your baseline, the better.</p>
      <p>Good luck,<br/>The thepsychology.ai team</p>
    </div>`
  return { subject, text, html }
}

function renderDay3(u: NudgeUser) {
  const name = firstName(u)
  const subject = 'The EPPP is too expensive to walk into blind'
  const text = [
    `Hi ${name},`,
    '',
    'Between the exam fee and your state\'s licensing fee, sitting for the EPPP runs close to four figures. A retake doubles that.',
    '',
    'The students who pass on the first try know one thing before they study: where they actually stand. Not where they think they stand.',
    '',
    'Fifteen minutes with a practice exam shows you that today:',
    day3Url,
    '',
    'Better to find out now than on test day.',
    '',
    'The thepsychology.ai team',
  ].join('\n')
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#111;max-width:560px;">
      <p>Hi ${name},</p>
      <p>Between the exam fee and your state\'s licensing fee, sitting for the EPPP runs close to four figures. A retake doubles that.</p>
      <p>The students who pass on the first try know one thing before they study: where they actually stand. Not where they think they stand.</p>
      <p>Fifteen minutes with a practice exam shows you that today:</p>
      <p>${buttonHtml(day3Url, 'See where you actually stand')}</p>
      <p>Better to find out now than on test day.</p>
      <p>The thepsychology.ai team</p>
    </div>`
  return { subject, text, html }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const isCron = authHeader === `Bearer ${CRON_SECRET}`
  const isDry = req.nextUrl.searchParams.get('dry') === '1'
  if (!isCron && !isDry) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Social proof number: distinct users who answered at least one exam question in the last 7 days.
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
  const { data: weekActive } = await supabase
    .from('exam_question_attempts')
    .select('user_id', { count: 'exact', head: false })
    .gte('created_at', sevenDaysAgo)
  const studentsThisWeek = new Set((weekActive || []).map((r: { user_id: string }) => r.user_id)).size

  // Pull free users from the last 30 days. Filter in JS so we can join against
  // exam_question_attempts without a complex Postgres view.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString()
  const { data: freeUsers, error: usersErr } = await supabase
    .from('users')
    .select('id, email, full_name, created_at, onboarding_day1_sent_at, onboarding_day2_sent_at, onboarding_day3_sent_at')
    .eq('subscription_tier', 'free')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 })
  }

  const candidateIds = (freeUsers || []).map((u) => u.id)
  const { data: starters } = await supabase
    .from('exam_question_attempts')
    .select('user_id')
    .in('user_id', candidateIds.length ? candidateIds : ['00000000-0000-0000-0000-000000000000'])
  const startedIds = new Set((starters || []).map((r: { user_id: string }) => r.user_id))

  const eligible = (freeUsers || []).filter((u) => u.email && !startedIds.has(u.id))

  const now = Date.now()
  const day1Targets: NudgeUser[] = []
  const day2Targets: NudgeUser[] = []
  const day3Targets: NudgeUser[] = []

  for (const u of eligible) {
    const ageMs = now - new Date(u.created_at).getTime()
    const ageHr = ageMs / 3_600_000

    // Day 1: at least 18 hours old, never received day 1.
    if (!u.onboarding_day1_sent_at && ageHr >= 18) {
      day1Targets.push(u)
      continue
    }

    // Day 2: already got day 1 at least 24 hours ago, never received day 2.
    if (u.onboarding_day1_sent_at && !u.onboarding_day2_sent_at) {
      const day1AgeHr = (now - new Date(u.onboarding_day1_sent_at).getTime()) / 3_600_000
      if (day1AgeHr >= 24) day2Targets.push(u)
      continue
    }

    // Day 3: already got day 2 at least 24 hours ago, never received day 3.
    if (u.onboarding_day2_sent_at && !u.onboarding_day3_sent_at) {
      const day2AgeHr = (now - new Date(u.onboarding_day2_sent_at).getTime()) / 3_600_000
      if (day2AgeHr >= 24) day3Targets.push(u)
    }
  }

  const results: { day: 1 | 2 | 3; email: string; ok: boolean; error?: string }[] = []

  for (const u of day1Targets) {
    const { subject, text, html } = renderDay1(u)
    try {
      if (!isDry) {
        await sendNotificationEmail({ subject, text, html, to: u.email })
        await supabase.from('users').update({ onboarding_day1_sent_at: new Date().toISOString() }).eq('id', u.id)
      }
      results.push({ day: 1, email: u.email, ok: true })
    } catch (e) {
      results.push({ day: 1, email: u.email, ok: false, error: (e as Error).message })
    }
  }

  for (const u of day2Targets) {
    const { subject, text, html } = renderDay2(u, studentsThisWeek)
    try {
      if (!isDry) {
        await sendNotificationEmail({ subject, text, html, to: u.email })
        await supabase.from('users').update({ onboarding_day2_sent_at: new Date().toISOString() }).eq('id', u.id)
      }
      results.push({ day: 2, email: u.email, ok: true })
    } catch (e) {
      results.push({ day: 2, email: u.email, ok: false, error: (e as Error).message })
    }
  }

  for (const u of day3Targets) {
    const { subject, text, html } = renderDay3(u)
    try {
      if (!isDry) {
        await sendNotificationEmail({ subject, text, html, to: u.email })
        await supabase.from('users').update({ onboarding_day3_sent_at: new Date().toISOString() }).eq('id', u.id)
      }
      results.push({ day: 3, email: u.email, ok: true })
    } catch (e) {
      results.push({ day: 3, email: u.email, ok: false, error: (e as Error).message })
    }
  }

  return NextResponse.json({
    dryRun: isDry,
    studentsThisWeek,
    day1Sent: results.filter((r) => r.day === 1 && r.ok).length,
    day2Sent: results.filter((r) => r.day === 2 && r.ok).length,
    day3Sent: results.filter((r) => r.day === 3 && r.ok).length,
    failures: results.filter((r) => !r.ok),
    details: isDry ? results : undefined,
  })
}
