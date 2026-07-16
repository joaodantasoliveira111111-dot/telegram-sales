import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import { ProductTypeField } from '@/types'

function adminOnly(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session || session.type !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

function validateFields(fields: unknown): ProductTypeField[] | null {
  if (!Array.isArray(fields) || fields.length === 0) return null
  const seen = new Set<string>()
  const out: ProductTypeField[] = []
  for (const f of fields) {
    if (!f || typeof f !== 'object') return null
    const key = String((f as Record<string, unknown>).key ?? '').trim()
    const label = String((f as Record<string, unknown>).label ?? '').trim()
    if (!key || !label) return null
    if (!/^[a-z0-9_]+$/.test(key)) return null
    if (seen.has(key)) return null
    seen.add(key)
    out.push({ key, label })
  }
  return out
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const deny = adminOnly(session)
  if (deny) return deny

  const { data, error } = await supabaseAdmin
    .from('product_types')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const deny = adminOnly(session)
  if (deny) return deny

  const body = await request.json()
  const { name, fields, message_template } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  const validFields = validateFields(fields)
  if (!validFields) {
    return NextResponse.json(
      { error: 'Informe ao menos um campo válido (chave só com letras minúsculas, números e _, sem repetir)' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('product_types')
    .insert({ name: name.trim(), fields: validFields, message_template: message_template?.trim() || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
