import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CreatePlanForm } from '@/types'

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get('bot_id')

  let query = supabaseAdmin.from('plans').select('*, bot:bots(name)').order('created_at', { ascending: false })

  if (botId) query = query.eq('bot_id', botId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body: CreatePlanForm = await request.json()

  const { data, error } = await supabaseAdmin
    .from('plans')
    .insert({
      bot_id: body.bot_id,
      name: body.name,
      price: body.price,
      duration_days: body.duration_days,
      button_text: body.button_text,
      content_type: body.content_type,
      content_url: body.content_url ?? null,
      telegram_chat_id: body.telegram_chat_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
