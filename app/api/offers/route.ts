import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get('bot_id')
  let query = supabaseAdmin
    .from('offers')
    .select('*, bot:bots(name), trigger_plan:plans!offers_trigger_plan_id_fkey(name, price), offer_plan:plans!offers_offer_plan_id_fkey(name, price)')
    .order('created_at', { ascending: false })
  if (botId) query = query.eq('bot_id', botId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('offers')
    .insert({
      bot_id: body.bot_id,
      name: body.name,
      type: body.type,
      trigger_plan_id: body.trigger_plan_id,
      offer_plan_id: body.offer_plan_id,
      message: body.message,
      is_active: true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
