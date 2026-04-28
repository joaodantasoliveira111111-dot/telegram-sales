import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Admin session (env-based single user)
  const adminSession = request.cookies.get('tgsession')?.value
  const adminSecret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  if (adminSession === adminSecret) {
    return NextResponse.next()
  }

  // SaaS user session: cookie format "userId:sessionToken"
  const userSession = request.cookies.get('ubsession')?.value
  if (userSession && userSession.includes(':')) {
    const [userId] = userSession.split(':')
    // Basic format validation (UUID)
    if (/^[0-9a-f-]{36}$/.test(userId)) {
      return NextResponse.next()
    }
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
