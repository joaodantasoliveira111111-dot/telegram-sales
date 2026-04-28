import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getMe, setWebhook } from '@/lib/telegram'
import { getSessionFromRequest } from '@/lib/session'
import { CreateBotForm } from '@/types'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabaseAdmin
    .from('bots')
    .select('*')
    .order('created_at', { ascending: false })

  if (session.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateBotForm = await request.json()

  const me = await getMe(body.telegram_token)
  if (!me.ok) {
    return NextResponse.json({ error: 'Token do Telegram inválido.' }, { status: 400 })
  }

  const bodyAny = body as unknown as Record<string, unknown>
  const { data, error } = await supabaseAdmin
    .from('bots')
    .insert({
      name: body.name,
      telegram_token: body.telegram_token,
      welcome_message: body.welcome_message,
      welcome_media_url: body.welcome_media_url ?? null,
      welcome_media_type: body.welcome_media_type ?? null,
      bot_type: bodyAny.bot_type ?? 'channel_link',
      flow_type: bodyAny.flow_type ?? 'direct',
      ab_test_enabled: bodyAny.ab_test_enabled ?? false,
      flow_type_b: bodyAny.flow_type_b ?? null,
      protect_content: bodyAny.protect_content ?? false,
      gateway: bodyAny.gateway ?? null,
      saas_user_id: session.type === 'user' ? session.userId : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (baseUrl) {
    await setWebhook(body.telegram_token, `${baseUrl}/api/telegram/${data.id}`)
  }

  return NextResponse.json(data, { status: 201 })
}
