import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import { DEFAULT_MINIAPP_CONFIG, MiniAppConfig } from '@/types'

async function ownBot(session: { type: string; userId?: string }, botId: string): Promise<boolean> {
  if (session.type === 'admin') return true
  const { data } = await supabaseAdmin
    .from('bots').select('id').eq('id', botId).eq('saas_user_id', session.userId!).maybeSingle()
  return !!data
}

const ALLOWED_KEYS: (keyof MiniAppConfig)[] = [
  'enabled', 'app_short_name', 'store_name', 'tagline', 'theme', 'accent', 'accent_2',
  'logo_emoji', 'logo_url', 'layout', 'show_categories', 'show_rating', 'show_trust_badges',
  'rating_value', 'rating_count_label',
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!(await ownBot(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: bot, error } = await supabaseAdmin.from('bots').select('id, name, miniapp_config').eq('id', id).single()
  if (error || !bot) return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 })

  const config: MiniAppConfig = {
    ...DEFAULT_MINIAPP_CONFIG,
    store_name: bot.name,
    ...(bot.miniapp_config ?? {}),
  }

  return NextResponse.json(config)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!(await ownBot(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  const { data: bot } = await supabaseAdmin.from('bots').select('miniapp_config').eq('id', id).single()
  const current = { ...DEFAULT_MINIAPP_CONFIG, ...(bot?.miniapp_config ?? {}) }

  const update: Record<string, unknown> = { ...current }
  for (const key of ALLOWED_KEYS) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('bots')
    .update({ miniapp_config: update })
    .eq('id', id)
    .select('miniapp_config')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.miniapp_config)
}
