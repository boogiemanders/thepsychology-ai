import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Branded short link for the win-back "share your story" CTA: thepsychology.ai/passed
// Redirects to the dashboard with ?share=passed (which auto-opens the result/testimonial modal),
// forwarding any utm_* / v params so variant attribution survives the hop.
export function GET(req: NextRequest) {
  const url = new URL('/dashboard', req.url)
  url.searchParams.set('share', 'passed')
  req.nextUrl.searchParams.forEach((val, key) => {
    if (key.startsWith('utm_') || key === 'v') url.searchParams.set(key, val)
  })
  return NextResponse.redirect(url, 307)
}
