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
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const { cloakerId, verdict, params: encodedParams } = payload

  const { data: cloaker } = await supabaseAdmin
    .from('cloakers')
    .select('destination_url, safe_url, is_active')
    .eq('id', cloakerId)
    .maybeSingle()

  if (!cloaker || !cloaker.is_active) {
    return NextResponse.redirect('https://www.google.com', { status: 302 })
  }

  const rawTarget = verdict === 'h' ? cloaker.destination_url : (cloaker.safe_url || 'https://www.google.com')

  // Append preserved click IDs (fbclid, gclid, ttclid, UTMs, etc.) to destination
  let target = rawTarget
  if (verdict === 'h' && encodedParams) {
    try {
      const preserved = JSON.parse(decodeURIComponent(encodedParams)) as Record<string, string>
      const destUrl = new URL(rawTarget)
      Object.entries(preserved).forEach(([k, v]) => {
        if (!destUrl.searchParams.has(k)) destUrl.searchParams.set(k, v)
      })
      target = destUrl.toString()
    } catch { /* malformed params — use original URL */ }
  }

  const response = NextResponse.redirect(target, { status: 302 })
  response.cookies.set('_ck', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  return response
}
