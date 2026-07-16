import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

const ALLOWED_FIELDS = [
  'bot_id', 'name', 'price', 'duration_days', 'button_text',
  'content_type', 'content_url', 'telegram_chat_id', 'plan_role', 'product_type_id',
  'miniapp_visible', 'miniapp_category', 'miniapp_icon', 'miniapp_image_url', 'miniapp_featured_label', 'miniapp_sort',
] as const

async function assertOwnsPlan(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, planId: string) {
  const { data: plan } = await supabaseAdmin.from('plans').select('bot_id').eq('id', planId).single()
  if (!plan) return { ok: false as const, status: 404, error: 'Plano não encontrado' }
  if (session.type === 'admin') return { ok: true as const, botId: plan.bot_id as string }
  const botIds = await getUserBotIds(session.userId!)
  if (!botIds.includes(plan.bot_id)) return { ok: false as const, status: 403, error: 'Forbidden' }
  return { ok: true as const, botId: plan.bot_id as string }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsPlan(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const body = await request.json()

  // If moving the plan to a different bot, the target bot must belong to the same user too
  if (body.bot_id && body.bot_id !== ownership.botId && session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (!botIds.includes(body.bot_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
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
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsPlan(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const { error } = await supabaseAdmin.from('plans').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
