import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const session = request.cookies.get('tgsession')?.value
  const secret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'

  if (session !== secret) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
