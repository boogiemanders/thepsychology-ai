import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseClient } from '@/lib/supabase-server'

// Unsubscribe endpoint for cold-outreach emails. The link in each email is
// signed with UNSUBSCRIBE_SECRET so no one can forge a link to unsubscribe
// someone else. GET shows a confirm page (protects against email scanners that
// auto-fetch links); POST commits the suppression. The same URL also serves
// RFC 8058 one-click unsubscribe (mail clients POST here directly).

export const runtime = 'nodejs'

const SECRET = process.env.UNSUBSCRIBE_SECRET || ''

function expectedToken(email: string): string {
  return createHmac('sha256', SECRET).update(email.toLowerCase()).digest('base64url')
}

function tokenValid(email: string, token: string): boolean {
  if (!SECRET || !email || !token) return false
  const expected = expectedToken(email)
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

function decodeEmail(e: string): string {
  try {
    return Buffer.from(e, 'base64url').toString('utf8')
  } catch {
    return ''
  }
}

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background: #f7f7f8; color: #1a1a2e; margin: 0; padding: 0; }
  .card { max-width: 480px; margin: 12vh auto; background: #fff; border-radius: 14px;
          padding: 36px 32px; box-shadow: 0 2px 20px rgba(0,0,0,.06); text-align: center; }
  h1 { font-size: 20px; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.55; color: #444; margin: 0 0 20px; }
  button { font-size: 15px; font-weight: 600; color: #fff; background: #2b2b40; border: 0;
           border-radius: 10px; padding: 12px 22px; cursor: pointer; }
  .muted { font-size: 13px; color: #888; }
</style>
</head>
<body><div class="card">${body}</div></body>
</html>`
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(req: NextRequest) {
  const e = req.nextUrl.searchParams.get('e') || ''
  const t = req.nextUrl.searchParams.get('t') || ''
  const email = decodeEmail(e)

  if (!tokenValid(email, t)) {
    return page('Invalid link', `<h1>This link looks invalid</h1>
      <p>The unsubscribe link is expired or incomplete. If you want off the list,
      just reply to the email with "unsubscribe" and we'll remove you.</p>`, 400)
  }

  const action = `/api/dct-unsubscribe?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}`
  return page('Unsubscribe', `<h1>Unsubscribe from thePsychology.ai</h1>
    <p>Click below to stop receiving outreach emails at<br><strong>${email}</strong>.</p>
    <form method="post" action="${action}">
      <button type="submit">Confirm unsubscribe</button>
    </form>
    <p class="muted" style="margin-top:18px">You can close this page if you didn't mean to open it.</p>`)
}

export async function POST(req: NextRequest) {
  const e = req.nextUrl.searchParams.get('e') || ''
  const t = req.nextUrl.searchParams.get('t') || ''
  const email = decodeEmail(e)

  if (!tokenValid(email, t)) {
    return page('Invalid link', `<h1>This link looks invalid</h1>
      <p>The unsubscribe link is expired or incomplete.</p>`, 400)
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return page('Something went wrong', `<h1>Something went wrong</h1>
      <p>We couldn't process that just now. Please reply to the email with
      "unsubscribe" and we'll remove you by hand.</p>`, 500)
  }

  const { error } = await supabase
    .from('dct_suppressions')
    .upsert({ email: email.toLowerCase(), reason: 'user_unsubscribe', source: 'dct_outreach' },
            { onConflict: 'email' })

  if (error) {
    return page('Something went wrong', `<h1>Something went wrong</h1>
      <p>We couldn't process that just now. Please reply to the email with
      "unsubscribe" and we'll remove you by hand.</p>`, 500)
  }

  return page('Unsubscribed', `<h1>You're unsubscribed</h1>
    <p><strong>${email}</strong> won't receive any further emails from us.
    Thanks, and all the best.</p>`)
}
