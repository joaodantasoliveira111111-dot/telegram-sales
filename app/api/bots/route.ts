import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getMe, setWebhook } from '@/lib/telegram'
import { CreateBotForm } from '@/types'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('bots')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body: CreateBotForm = await request.json()

  // Validate token with Telegram
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
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-configure webhook
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (baseUrl) {
    await setWebhook(body.telegram_token, `${baseUrl}/api/telegram/${data.id}`)
  }

  return NextResponse.json(data, { status: 201 })
}
