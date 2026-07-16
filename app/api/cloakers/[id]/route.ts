import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

async function assertOwnsCloaker(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, id: string) {
  const { data: cloaker } = await supabaseAdmin.from('cloakers').select('saas_user_id').eq('id', id).single()
  if (!cloaker) return { ok: false as const, status: 404, error: 'Cloaker não encontrado' }
  if (session.type === 'admin') return { ok: true as const }
  if (cloaker.saas_user_id !== session.userId) return { ok: false as const, status: 403, error: 'Forbidden' }
  return { ok: true as const }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsCloaker(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const body = await request.json()
  const allowed = ['name', 'destination_url', 'safe_url', 'is_active', 'allowed_countries']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  const { data, error } = await supabaseAdmin
    .from('cloakers').update(update).eq('id', id)
    .select('*, bot:bots(id, name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsCloaker(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const { error } = await supabaseAdmin.from('cloakers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsCloaker(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '50')
  const { data, error } = await supabaseAdmin
    .from('cloaker_clicks')
    .select('id, verdict, bot_reason, user_agent, created_at')
    .eq('cloaker_id', id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
