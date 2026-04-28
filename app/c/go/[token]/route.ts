import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/cloaker-crypto'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const payload = verifyToken(token)

  if (!payload) {
    // Expired or tampered — send to google silently
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const { cloakerId, verdict } = payload

  const { data: cloaker } = await supabaseAdmin
    .from('cloakers')
    .select('destination_url, safe_url, is_active')
    .eq('id', cloakerId)
    .maybeSingle()

  if (!cloaker || !cloaker.is_active) {
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const target = verdict === 'h' ? cloaker.destination_url : cloaker.safe_url

  const response = NextResponse.redirect(target, { status: 302 })

  // Clear the session cookie after use
  response.cookies.set('_ck', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  return response
}
