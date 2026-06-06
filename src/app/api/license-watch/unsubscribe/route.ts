import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function htmlPage(title: string, message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} - thePsychology.ai</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 64px 24px; color: #1a1a2e;">
    <h1 style="font-size: 22px;">${title}</h1>
    <p style="line-height: 1.55; color: #444;">${message}</p>
    <p style="margin-top: 32px;"><a href="https://www.thepsychology.ai" style="color: #d97706;">thePsychology.ai</a></p>
  </body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const id = req.nextUrl.searchParams.get('id') || ''
  if (!UUID_RE.test(id)) {
    return htmlPage('Invalid link', 'This unsubscribe link is missing or malformed. Please use the link from your email.')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data, error } = await supabase
    .from('license_watch_signups')
    .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('[license-watch] unsubscribe error:', error)
    return htmlPage('Something went wrong', 'We could not process your unsubscribe request. Please try again later.')
  }

  if (!data || data.length === 0) {
    return htmlPage('Not found', 'We could not find a license alert signup for this link. You may already be unsubscribed.')
  }

  return htmlPage('You are unsubscribed', 'You will no longer receive license alert emails from thePsychology.ai.')
}
