import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

const ALLOWED_FIELDS = ['name', 'type', 'trigger_plan_id', 'offer_plan_id', 'message', 'is_active', 'bot_id'] as const

async function assertOwnsOffer(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, offerId: string) {
  const { data: offer } = await supabaseAdmin.from('offers').select('bot_id').eq('id', offerId).single()
  if (!offer) return { ok: false as const, status: 404, error: 'Oferta não encontrada' }
  if (session.type === 'admin') return { ok: true as const, botId: offer.bot_id as string }
  const botIds = await getUserBotIds(session.userId!)
  if (!botIds.includes(offer.bot_id)) return { ok: false as const, status: 403, error: 'Forbidden' }
  return { ok: true as const, botId: offer.bot_id as string }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsOffer(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const body = await request.json()

  if (body.bot_id && body.bot_id !== ownership.botId && session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (!botIds.includes(body.bot_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin.from('offers').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsOffer(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const { error } = await supabaseAdmin.from('offers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
