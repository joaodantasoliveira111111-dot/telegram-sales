import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { rows, bot_id, plan_id } = body as {
    rows: { product_name: string; login: string; password: string; extra_info?: string; warranty_days?: string; notes?: string }[]
    bot_id?: string
    plan_id?: string
  }

  if (!rows?.length) return NextResponse.json({ error: 'Nenhuma linha enviada' }, { status: 400 })

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.login?.trim() || !row.password?.trim()) { skipped++; continue }
    if (!row.product_name?.trim()) { skipped++; continue }

    // Check duplicate login for same plan
    if (plan_id) {
      const { count } = await supabaseAdmin
        .from('account_stocks')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', plan_id)
        .eq('login', row.login.trim())
      if ((count ?? 0) > 0) { skipped++; continue }
    }

    const warranty_until = row.warranty_days
      ? new Date(Date.now() + Number(row.warranty_days) * 86400000).toISOString()
      : null

    const { error } = await supabaseAdmin.from('account_stocks').insert({
      product_name: row.product_name.trim(),
      login: row.login.trim(),
      password: row.password.trim(),
      extra_info: row.extra_info?.trim() || null,
      notes: row.notes?.trim() || null,
      bot_id: bot_id || null,
      plan_id: plan_id || null,
      warranty_until,
    })

    if (error) { errors.push(`Linha ${i + 2}: ${error.message}`); skipped++ }
    else imported++
  }

  return NextResponse.json({ imported, skipped, errors, total: rows.length })
}
