import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: '/SENSE/:path*',
}
