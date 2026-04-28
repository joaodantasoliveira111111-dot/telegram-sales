import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('tgsession')?.value
  const secret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  return session === secret
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const allowed = ['is_active', 'plan_type', 'pending_fee_total']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { error } = await supabaseAdmin
    .from('saas_users')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
