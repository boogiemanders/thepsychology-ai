import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Branded short link for social posts: thepsychology.ai/go/<topic> 307-redirects with UTM
// params for Google Analytics. The visible link stays clean and on-brand; the campaign is the
// <topic> slug. Defaults: utm_source=linkedin, utm_medium=social. Override the source with ?s=
// (e.g. /go/eppp-cost?s=tiktok) when a post runs on another platform.
const BASE = 'https://www.thepsychology.ai/'

// Slugs that should land on a specific page instead of the homepage. Unmapped slugs keep the
// default homepage behavior; the slug still becomes utm_campaign either way.
const DESTINATIONS: Record<string, string> = {
  'practice-questions': 'https://www.thepsychology.ai/eppp-practice-questions',
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const campaign = (slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64) || 'social'
  const source = (req.nextUrl.searchParams.get('s') || 'linkedin').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'linkedin'

  const dest = new URL(DESTINATIONS[campaign] || BASE)
  dest.searchParams.set('utm_source', source)
  dest.searchParams.set('utm_medium', 'social')
  dest.searchParams.set('utm_campaign', campaign)
  return NextResponse.redirect(dest.toString(), 307)
}
