/**
 * One-time script: Send emails to users who were downgraded from Pro to Free.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/send-downgrade-emails.ts [--dry-run]
 *
 * Requires: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FROM_EMAIL = process.env.NOTIFY_EMAIL_FROM || 'DrChan@thepsychology.ai'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thepsychology.ai'

const isDryRun = process.argv.includes('--dry-run')

const SKIP_EMAILS = new Set([
  'support@prepjet.net',
  'sergioescobedo1992@gmail.co',
  'israhibrahim23@gmai.com',
])

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars: RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  // Find downgraded users (free tier with trial_ends_at set = they had a trial)
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, trial_ends_at, subscription_started_at')
    .eq('subscription_tier', 'free')
    .not('trial_ends_at', 'is', null)
    .is('stripe_customer_id', null)

  if (error) {
    console.error('Failed to fetch users:', error)
    process.exit(1)
  }

  console.log(`Found ${users?.length || 0} downgraded users`)

  if (!users || users.length === 0) {
    console.log('No users to email.')
    return
  }

  let sent = 0
  let failed = 0

  for (const user of users) {
    if (!user.email) continue
    if (SKIP_EMAILS.has(user.email)) {
      console.log(`[SKIP] ${user.email}`)
      continue
    }

    const firstName = user.full_name?.split(' ')[0] || 'there'
    const subject = 'Your Pro access has changed'
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Hi ${firstName},</h2>

        <p style="color: #333; line-height: 1.6;">
          Thank you for being part of thePsychology.ai beta. We're transitioning to a new pricing model,
          and your account has been moved to our Free plan.
        </p>

        <p style="color: #333; line-height: 1.6;">
          <strong>What's changed:</strong> Your access to 80+ lessons, unlimited quizzes, exam simulation tools,
          and Recover sessions has moved to Pro.
        </p>

        <p style="color: #333; line-height: 1.6;">
          <strong>Your study progress is safe</strong> — everything you've completed is still there.
          You can continue studying with the Free plan (10 lessons, 3 quizzes/day).
        </p>

        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #92400e; margin: 0; font-weight: 600;">
            Pro is $20/mo exclusively for early members.
          </p>
          <p style="color: #92400e; margin: 4px 0 0 0; font-size: 14px;">
            This price won't be available for those who join in April.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/dashboard?upgrade=email"
             style="display: inline-block; background: #d97706; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Get Pro Back
          </a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          — Dr. Chan<br>
          thePsychology.ai
        </p>
      </div>
    `

    if (isDryRun) {
      console.log(`[DRY RUN] Would email: ${user.email}`)
      sent++
      continue
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user.email,
          subject,
          html,
        }),
      })

      if (res.ok) {
        sent++
        console.log(`Sent to: ${user.email}`)
      } else {
        failed++
        const err = await res.text()
        console.error(`Failed for ${user.email}: ${err}`)
      }

      // Rate limit: ~2 emails/sec
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      failed++
      console.error(`Error for ${user.email}:`, err)
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`)
}

main()
