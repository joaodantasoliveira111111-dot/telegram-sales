import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const allowed = ['name', 'commission_pct', 'telegram_id', 'is_active']
  const update: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) update[k] = body[k] }
  const { data, error } = await supabaseAdmin.from('affiliates').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('affiliates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Return affiliate sales detail
  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select('id, plan_name, plan_price, created_at, status')
    .eq('affiliate_code', id) // we pass code here via query
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(payments)
}
