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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const deny = adminOnly(session)
  if (deny) return deny

  const { id } = await params
  const body = await request.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if ('name' in body) {
    if (!body.name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    update.name = body.name.trim()
  }
  if ('fields' in body) {
    const validFields = validateFields(body.fields)
    if (!validFields) {
      return NextResponse.json(
        { error: 'Informe ao menos um campo válido (chave só com letras minúsculas, números e _, sem repetir)' },
        { status: 400 }
      )
    }
    update.fields = validFields
  }
  if ('message_template' in body) {
    update.message_template = body.message_template?.trim() || null
  }

  const { data, error } = await supabaseAdmin
    .from('product_types')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const deny = adminOnly(session)
  if (deny) return deny

  const { id } = await params
  const { error } = await supabaseAdmin.from('product_types').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
