import { NextRequest, NextResponse } from 'next/server'
import { verifySession, signToken } from '@/lib/cloaker-crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { slug, verdict, params } = await request.json() as {
      slug: string
      verdict: 'h' | 's'
      params?: string // JSON-encoded click ID map
    }

    if (!slug || (verdict !== 'h' && verdict !== 's')) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 })
    }

    const cookie = request.cookies.get('_ck')?.value ?? ''
    if (!verifySession(cookie, slug)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data: cloaker } = await supabaseAdmin
      .from('cloakers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!cloaker) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const token = signToken(cloaker.id, verdict, params)
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'error' }, { status: 500 })
  }
}
