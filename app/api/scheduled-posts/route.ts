import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const botId = request.nextUrl.searchParams.get('bot_id')
  const status = request.nextUrl.searchParams.get('status') ?? 'pending'

  let q = supabaseAdmin
    .from('scheduled_posts')
    .select('*, bot:bots(id, name)')
    .order('scheduled_at', { ascending: true })

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return NextResponse.json([])
    q = q.in('bot_id', botIds)
  }

  if (botId) q = q.eq('bot_id', botId)
  if (status !== 'all') q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { bot_id, chat_id, chat_title, message_text, media_url, media_type, scheduled_at } = body

  if (!bot_id || !chat_id || !scheduled_at) {
    return NextResponse.json({ error: 'bot_id, chat_id e scheduled_at são obrigatórios' }, { status: 400 })
  }
  if (!message_text && !media_url) {
    return NextResponse.json({ error: 'Informe mensagem ou mídia' }, { status: 400 })
  }

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (!botIds.includes(bot_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin.from('scheduled_posts').insert({
    bot_id, chat_id, chat_title: chat_title || null,
    message_text: message_text || null,
    media_url: media_url || null,
    media_type: media_type || null,
    scheduled_at,
  }).select('*, bot:bots(id, name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
