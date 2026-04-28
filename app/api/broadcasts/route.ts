import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const botId = request.nextUrl.searchParams.get('bot_id')

  let query = supabaseAdmin
    .from('broadcasts')
    .select('*, bot:bots(name)')
    .order('created_at', { ascending: false })

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return NextResponse.json([])
    query = query.in('bot_id', botIds)
  }

  if (botId) query = query.eq('bot_id', botId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (!botIds.includes(body.bot_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const insert: Record<string, unknown> = {
    bot_id: body.bot_id,
    name: body.name,
    message_text: body.message_text,
    media_url: body.media_url ?? null,
    media_type: body.media_type ?? null,
    target_type: body.target_type,
    status: body.scheduled_at ? 'scheduled' : 'draft',
  }
  if (body.scheduled_at) insert.scheduled_at = body.scheduled_at
  if (body.inline_keyboard) insert.inline_keyboard = body.inline_keyboard

  const { data, error } = await supabaseAdmin
    .from('broadcasts').insert(insert).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
