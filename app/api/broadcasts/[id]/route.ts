import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

async function canAccessBroadcast(session: Awaited<ReturnType<typeof getSessionFromRequest>>, id: string): Promise<boolean> {
  if (!session) return false
  if (session.type === 'admin') return true
  const botIds = await getUserBotIds(session.userId!)
  if (botIds.length === 0) return false
  const { data } = await supabaseAdmin.from('broadcasts').select('id').eq('id', id).in('bot_id', botIds).maybeSingle()
  return !!data
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const { id } = await params
  if (!(await canAccessBroadcast(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const allowed = ['name', 'message_text', 'media_url', 'media_type', 'target_type', 'scheduled_at', 'status', 'inline_keyboard']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('broadcasts')
    .update(update)
    .eq('id', id)
    .select('*, bot:bots(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const { id } = await params
  if (!(await canAccessBroadcast(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin.from('broadcasts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
