import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const plan_id = searchParams.get('plan_id')

  let query = supabaseAdmin
    .from('account_stocks')
    .select('*, bot:bots(name), plan:plans(name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (plan_id) query = query.eq('plan_id', plan_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { product_name, login, password, extra_info, notes, bot_id, plan_id, warranty_days } = body

  if (!product_name || !login || !password) {
    return NextResponse.json({ error: 'product_name, login e password são obrigatórios' }, { status: 400 })
  }

  const warranty_until = warranty_days
    ? new Date(Date.now() + Number(warranty_days) * 86400000).toISOString()
    : null

  const { data, error } = await supabaseAdmin
    .from('account_stocks')
    .insert({
      product_name,
      login,
      password,
      extra_info: extra_info || null,
      notes: notes || null,
      bot_id: bot_id || null,
      plan_id: plan_id || null,
      warranty_until,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
