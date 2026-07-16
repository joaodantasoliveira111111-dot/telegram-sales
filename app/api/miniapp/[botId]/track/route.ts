import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateInitData } from '@/lib/telegram-webapp'
import { sendViewContentEvent } from '@/lib/meta'
import { sendTikTokViewContent } from '@/lib/tiktok'
import { sendGA4ViewContent } from '@/lib/ga4'
import { sendKwaiViewContent } from '@/lib/kwai'

interface TrackBody {
  event: 'view_content'
  init_data: string
  plan_id?: string
  plan_name?: string
  value?: number
}

// Fires marketing-pixel ViewContent events for product views inside the Mini
// App storefront, using each bot's own pixel credentials — same platforms the
// chat-based purchase flow already tracks. InitiateCheckout is tracked
// server-side from the checkout route itself (more reliable, fires exactly
// once per real attempt); Purchase is tracked from the payment webhook.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  const body = await request.json() as TrackBody
  const { event, init_data, plan_id, plan_name, value } = body

  if (event !== 'view_content' || !init_data) return NextResponse.json({ ok: false }, { status: 400 })

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('telegram_token, meta_pixel_id, meta_access_token, meta_test_event_code')
    .eq('id', botId)
    .single()

  if (!bot) return NextResponse.json({ ok: false }, { status: 404 })

  const user = validateInitData(bot.telegram_token, init_data)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const telegramId = String(user.id)
  const eventId = `miniapp_view_${plan_id ?? 'store'}_${telegramId}_${Date.now()}`
  const botPixel = {
    pixelId: bot.meta_pixel_id ?? undefined,
    accessToken: bot.meta_access_token ?? undefined,
    testEventCode: bot.meta_test_event_code ?? undefined,
  }

  await Promise.all([
    sendViewContentEvent({ eventId, telegramId, firstName: user.first_name, botName: plan_name }, botPixel).catch(() => {}),
    sendTikTokViewContent({ eventId, value, planName: plan_name ?? 'Produto', planId: plan_id, telegramId }).catch(() => {}),
    sendGA4ViewContent({ telegramId, value, planName: plan_name ?? 'Produto', planId: plan_id }).catch(() => {}),
    sendKwaiViewContent({ eventId, value, planName: plan_name ?? 'Produto', planId: plan_id, telegramId }).catch(() => {}),
  ])
  return NextResponse.json({ ok: true })
}
