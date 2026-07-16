import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const botId = request.nextUrl.searchParams.get('bot_id')

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return NextResponse.json([])
    if (botId && !botIds.includes(botId)) return NextResponse.json([])
  }

  let query = supabaseAdmin
    .from('offers')
    .select('*, bot:bots(name), trigger_plan:plans!offers_trigger_plan_id_fkey(name, price), offer_plan:plans!offers_offer_plan_id_fkey(name, price)')
    .order('created_at', { ascending: false })

  if (botId) {
    query = query.eq('bot_id', botId)
  } else if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    query = query.in('bot_id', botIds)
  }

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
