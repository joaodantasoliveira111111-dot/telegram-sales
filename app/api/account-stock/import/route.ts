import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

interface ImportRow {
  product_name: string
  login?: string
  password?: string
  extra_info?: string
  warranty_days?: string
  notes?: string
  custom_fields?: Record<string, string>
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.type !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { rows, bot_id, plan_id } = body as {
    rows: ImportRow[]
    bot_id?: string
    plan_id?: string
  }

  if (!rows?.length) return NextResponse.json({ error: 'Nenhuma linha enviada' }, { status: 400 })

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const hasCustomFields = row.custom_fields && Object.keys(row.custom_fields).some((k) => row.custom_fields![k]?.trim())
    const hasCredentials = row.login?.trim() && row.password?.trim()

    if (!row.product_name?.trim()) { skipped++; continue }
    if (!hasCredentials && !hasCustomFields) { skipped++; continue }

    if (plan_id) {
      let dupeQuery = supabaseAdmin
        .from('account_stocks')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', plan_id)
      dupeQuery = hasCredentials
        ? dupeQuery.eq('login', row.login!.trim())
        : dupeQuery.contains('custom_fields', row.custom_fields as Record<string, string>)
      const { count } = await dupeQuery
      if ((count ?? 0) > 0) { skipped++; continue }
    }

    const warranty_until = row.warranty_days
      ? new Date(Date.now() + Number(row.warranty_days) * 86400000).toISOString()
      : null

    const { error } = await supabaseAdmin.from('account_stocks').insert({
      product_name: row.product_name.trim(),
      login: row.login?.trim() || null,
      password: row.password?.trim() || null,
      extra_info: row.extra_info?.trim() || null,
      notes: row.notes?.trim() || null,
      bot_id: bot_id || null,
      plan_id: plan_id || null,
      warranty_until,
      custom_fields: hasCustomFields ? row.custom_fields : {},
    })

    if (error) { errors.push(`Linha ${i + 2}: ${error.message}`); skipped++ }
    else imported++
  }

  return NextResponse.json({ imported, skipped, errors, total: rows.length })
}
