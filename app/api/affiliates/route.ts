import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function randomCode(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase()
}

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get('bot_id')
  let q = supabaseAdmin.from('affiliates').select('*').order('created_at', { ascending: false })
  if (botId) q = q.eq('bot_id', botId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { bot_id, name, commission_pct, telegram_id } = body
  if (!bot_id || !name) return NextResponse.json({ error: 'bot_id e name são obrigatórios' }, { status: 400 })

  let code = randomCode()
  const { data: existing } = await supabaseAdmin.from('affiliates').select('id').eq('bot_id', bot_id).eq('code', code).maybeSingle()
  if (existing) code = randomCode(8)

  const { data, error } = await supabaseAdmin.from('affiliates').insert({
    bot_id,
    name,
    code,
    commission_pct: commission_pct ?? 10,
    telegram_id: telegram_id || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
