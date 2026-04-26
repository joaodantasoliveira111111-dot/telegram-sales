import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get('bot_id')

  let query = supabaseAdmin
    .from('broadcasts')
    .select('*, bot:bots(name)')
    .order('created_at', { ascending: false })

  if (botId) query = query.eq('bot_id', botId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('broadcasts')
    .insert({
      bot_id: body.bot_id,
      name: body.name,
      message_text: body.message_text,
      media_url: body.media_url ?? null,
      media_type: body.media_type ?? null,
      target_type: body.target_type,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
