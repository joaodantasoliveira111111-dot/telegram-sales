import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabaseAdmin
    .from('telegram_sessions')
    .select('phone, status, account_name, account_username, updated_at')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (session.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  const { data } = await query.maybeSingle()
  return NextResponse.json({ session: data ?? null })
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabaseAdmin
    .from('telegram_sessions')
    .update({ status: 'disconnected', session_string: '', updated_at: new Date().toISOString() })
    .eq('status', 'connected')

  if (session.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  await query
  return NextResponse.json({ ok: true })
}
