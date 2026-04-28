import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

function randomCode(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase()
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const botId = request.nextUrl.searchParams.get('bot_id')
  let q = supabaseAdmin.from('affiliates').select('*').order('created_at', { ascending: false })

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return NextResponse.json([])
    q = q.in('bot_id', botIds)
  }

  if (botId) q = q.eq('bot_id', botId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { bot_id, name, commission_pct, telegram_id } = body
  if (!bot_id || !name) return NextResponse.json({ error: 'bot_id e name são obrigatórios' }, { status: 400 })

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (!botIds.includes(bot_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let code = randomCode()
  const { data: existing } = await supabaseAdmin.from('affiliates').select('id').eq('bot_id', bot_id).eq('code', code).maybeSingle()
  if (existing) code = randomCode(8)

  const { data, error } = await supabaseAdmin.from('affiliates').insert({
    bot_id, name, code,
    commission_pct: commission_pct ?? 10,
    telegram_id: telegram_id || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
