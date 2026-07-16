import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteWebhook, setWebhook } from '@/lib/telegram'
import { getSessionFromRequest } from '@/lib/session'

async function ownBot(session: { type: string; userId?: string }, botId: string): Promise<boolean> {
  if (session.type === 'admin') return true
  const { data } = await supabaseAdmin
    .from('bots').select('id').eq('id', botId).eq('saas_user_id', session.userId!).maybeSingle()
  return !!data
}

const ALLOWED_FIELDS = [
  'name', 'telegram_token', 'welcome_message', 'welcome_media_url', 'welcome_media_type',
  'is_active', 'bot_type', 'flow_type', 'flow_type_b', 'ab_test_enabled', 'protect_content',
  'gateway', 'flow_config',
  'meta_pixel_id', 'meta_access_token', 'meta_test_event_code',
  'tiktok_pixel_id', 'tiktok_access_token',
  'ga4_measurement_id', 'ga4_api_secret', 'gtm_container_id',
  'kwai_pixel_id', 'kwai_access_token',
] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!(await ownBot(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('bots').update(update).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (typeof body.is_active === 'boolean' && data) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (body.is_active && baseUrl) await setWebhook(data.telegram_token, `${baseUrl}/api/telegram/${id}`)
    else if (!body.is_active) await deleteWebhook(data.telegram_token)
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!(await ownBot(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: bot } = await supabaseAdmin
    .from('bots').select('telegram_token').eq('id', id).single()

  if (bot) await deleteWebhook(bot.telegram_token).catch(() => {})

  await supabaseAdmin.from('flow_sessions').delete().eq('bot_id', id)
  await supabaseAdmin.from('bot_events').delete().eq('bot_id', id)
  await supabaseAdmin.from('telegram_users').delete().eq('bot_id', id)
  await supabaseAdmin.from('payments').delete().eq('bot_id', id)
  await supabaseAdmin.from('subscriptions').delete().eq('bot_id', id)
  await supabaseAdmin.from('bot_messages').delete().eq('bot_id', id)
  await supabaseAdmin.from('plans').delete().eq('bot_id', id)

  const { error } = await supabaseAdmin.from('bots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
