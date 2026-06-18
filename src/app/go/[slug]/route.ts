import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Branded short link for social posts: thepsychology.ai/go/<topic> 307-redirects with UTM
// params for Google Analytics. The visible link stays clean and on-brand; the campaign is the
// <topic> slug. Defaults: utm_source=linkedin, utm_medium=social. Override the source with ?s=
// (e.g. /go/eppp-cost?s=tiktok) when a post runs on another platform. Add ?c=<tag> to set
// utm_content (e.g. a per-video key) so links that share one slug/page stay distinguishable in
// analytics. Unmapped slugs land on the homepage; slugs listed in DESTINATIONS land on that
// specific page (same UTM tracking).
const BASE = 'https://www.thepsychology.ai/'

// Slug -> on-site path. Add an entry to point a short /go/<slug> link at a specific page.
const DESTINATIONS: Record<string, string> = {
  'practice-questions': '/resources/practice-questions',
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const campaign = (slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64) || 'social'
  const source = (req.nextUrl.searchParams.get('s') || 'linkedin').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'linkedin'
  // Per-video tag: ?c=<videokey> -> utm_content. Sanitized like the source/slug. Only set when
  // present so links that omit it (most posts) keep a clean URL with no empty utm_content.
  const content = (req.nextUrl.searchParams.get('c') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64)

  const dest = new URL(DESTINATIONS[campaign] ?? '/', BASE)
  dest.searchParams.set('utm_source', source)
  dest.searchParams.set('utm_medium', 'social')
  dest.searchParams.set('utm_campaign', campaign)
  if (content) dest.searchParams.set('utm_content', content)
  return NextResponse.redirect(dest.toString(), 307)
}
