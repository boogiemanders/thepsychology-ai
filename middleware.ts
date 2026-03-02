import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import {
  assignVariant,
  encodeOrderCookie,
  HP_VISITOR_COOKIE,
  HP_ORDER_COOKIE,
  type VisitorSignals,
} from '@/lib/hp-utils'

function detectDeviceType(ua: string | null): 'mobile' | 'desktop' | 'tablet' | null {
  if (!ua) return null
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

async function handleHomepage(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next()

  // Read or create visitor cookie
  let visitorId = request.cookies.get(HP_VISITOR_COOKIE)?.value
  if (!visitorId) {
    visitorId = nanoid(21)
    response.cookies.set(HP_VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
  }

  // If _tp_order cookie already exists, skip DB call (cached variant)
  const existingOrder = request.cookies.get(HP_ORDER_COOKIE)?.value
  if (existingOrder) {
    return response
  }

  // Capture visitor signals from headers
  const ua = request.headers.get('user-agent')
  const url = request.nextUrl
  const signals: VisitorSignals = {
    referrer: request.headers.get('referer'),
    country: request.headers.get('x-vercel-ip-country'),
    deviceType: detectDeviceType(ua),
    userAgent: ua ? ua.slice(0, 512) : null, // truncate to avoid huge values
    utmSource: url.searchParams.get('utm_source'),
    utmMedium: url.searchParams.get('utm_medium'),
    utmCampaign: url.searchParams.get('utm_campaign'),
    utmContent: url.searchParams.get('utm_content'),
    utmTerm: url.searchParams.get('utm_term'),
  }

  // Call RPC to assign variant
  const variant = await assignVariant(visitorId, signals)

  // Set order cookie (cached for subsequent visits)
  response.cookies.set(HP_ORDER_COOKIE, encodeOrderCookie(variant), {
    httpOnly: false, // readable by server component via cookies()
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Homepage personalization
  if (pathname === '/') {
    return handleHomepage(request)
  }

  // Rewrite /SENSE/* to SENSE_ORIGIN
  if (pathname.startsWith('/SENSE')) {
    const senseOrigin = process.env.SENSE_ORIGIN

    // If SENSE_ORIGIN is set, proxy to it
    if (senseOrigin) {
      const url = new URL(pathname, senseOrigin)
      url.search = request.nextUrl.search
      return NextResponse.rewrite(url)
    }

    // In development or if SENSE_ORIGIN is not set, return 404
    // (the SENSE app should be run separately on port 3001)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/SENSE/:path*'],
}
