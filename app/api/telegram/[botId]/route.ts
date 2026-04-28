import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  sendMessage,
  sendPhoto,
  sendVideo,
  sendButtons,
  sendPhotoWithButtons,
  sendVideoWithButtons,
  answerCallbackQuery,
} from '@/lib/telegram'
import { createPix } from '@/lib/amplopay'
import { TelegramUpdate, Plan } from '@/types'
import { getBotMessage } from '@/lib/messages'
import { sendInitiateCheckoutEvent, sendViewContentEvent } from '@/lib/meta'
import { executeFlowStep } from '@/lib/flow-executor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params

  const { data: bot, error: botError } = await supabaseAdmin
    .from('bots')
    .select('*')
    .eq('id', botId)
    .eq('is_active', true)
    .single()

  if (botError || !bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 })

  let update: TelegramUpdate
  try {
    update = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Visual flow mode — delegate to flow executor
  if ((bot.flow_type as string) === 'visual') {
    if (update.message?.text?.startsWith('/start') || update.message) {
      const from = update.message.from
      const chatId = update.message.chat.id
      await supabaseAdmin.from('telegram_users').upsert(
        { bot_id: botId, telegram_id: String(from.id), username: from.username ?? null, first_name: from.first_name ?? null },
        { onConflict: 'bot_id,telegram_id' }
      )
      await executeFlowStep(botId, String(from.id), bot.telegram_token as string, chatId, bot.protect_content as boolean ?? false)
    }
    if (update.callback_query) {
      const cq = update.callback_query
      const chatId = cq.message?.chat.id ?? cq.from.id
      await answerCallbackQuery(bot.telegram_token as string, cq.id)
      await executeFlowStep(botId, String(cq.from.id), bot.telegram_token as string, chatId, bot.protect_content as boolean ?? false, cq.data)
    }
    return NextResponse.json({ ok: true })
  }

  if (update.message?.text?.startsWith('/start')) {
    await handleStart(bot, update)
    return NextResponse.json({ ok: true })
  }

  if (update.callback_query) {
    await handleCallbackQuery(bot, update)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildPlanButtons(plans: Plan[]) {
  return plans.map((plan: Plan) => [{
    text: `${plan.button_text} — R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`,
    callback_data: `buy_${plan.id}`,
  }])
}

async function sendWelcomeOnly(
  token: string, chatId: number,
  welcomeMsg: string, mediaUrl: string | null, mediaType: string | null,
) {
  if (mediaUrl && mediaType === 'image') await sendPhoto(token, chatId, mediaUrl, welcomeMsg)
  else if (mediaUrl && mediaType === 'video') await sendVideo(token, chatId, mediaUrl, welcomeMsg)
  else await sendMessage(token, chatId, welcomeMsg)
}

async function sendWelcomeWithButtons(
  token: string, chatId: number,
  welcomeMsg: string, mediaUrl: string | null, mediaType: string | null,
  buttons: { text: string; callback_data: string }[][],
) {
  if (mediaUrl && mediaType === 'image') await sendPhotoWithButtons(token, chatId, mediaUrl, welcomeMsg, buttons)
  else if (mediaUrl && mediaType === 'video') await sendVideoWithButtons(token, chatId, mediaUrl, welcomeMsg, buttons)
  else await sendButtons(token, chatId, welcomeMsg, buttons)
}

function recordEvent(
  botId: string,
  telegramId: string,
  eventType: string,
  opts?: { planId?: string; abVariant?: string }
) {
  void supabaseAdmin.from('bot_events').insert({
    bot_id: botId,
    telegram_id: telegramId,
    event_type: eventType,
    plan_id: opts?.planId ?? null,
    ab_variant: opts?.abVariant ?? null,
  })
}

// ─── /start ──────────────────────────────────────────────────────────────────

async function handleStart(bot: Record<string, unknown>, update: TelegramUpdate) {
  const msg = update.message!
  const from = msg.from
  const chatId = msg.chat.id

  // A/B test: deterministic assignment by telegram_id parity
  const abEnabled = bot.ab_test_enabled as boolean
  const flowTypeA = (bot.flow_type as string) ?? 'direct'
  const flowTypeB = (bot.flow_type_b as string) ?? 'direct'
  const abVariant: 'a' | 'b' = abEnabled ? (from.id % 2 === 0 ? 'a' : 'b') : 'a'
  const effectiveFlowType = abEnabled && abVariant === 'b' ? flowTypeB : flowTypeA

  await supabaseAdmin.from('telegram_users').upsert(
    {
      bot_id: bot.id,
      telegram_id: String(from.id),
      username: from.username ?? null,
      first_name: from.first_name ?? null,
      ab_variant: abEnabled ? abVariant : null,
    },
    { onConflict: 'bot_id,telegram_id' }
  )

  recordEvent(bot.id as string, String(from.id), 'start', { abVariant: abEnabled ? abVariant : undefined })

  const botPixel = {
    pixelId: bot.meta_pixel_id as string | undefined,
    accessToken: bot.meta_access_token as string | undefined,
    testEventCode: bot.meta_test_event_code as string | undefined,
  }
  sendViewContentEvent({
    eventId: `view_${bot.id}_${from.id}_${Date.now()}`,
    telegramId: String(from.id),
    firstName: from.first_name,
    botName: bot.name as string,
  }, botPixel).catch(() => {})

  const token = bot.telegram_token as string
  const welcomeMsg = bot.welcome_message as string
  const mediaUrl = bot.welcome_media_url as string | null
  const mediaType = bot.welcome_media_type as string | null

  const { data: plans } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('bot_id', bot.id)
    .eq('plan_role', 'main')
    .order('price', { ascending: true })

  if (!plans || plans.length === 0) {
    await sendWelcomeOnly(token, chatId, welcomeMsg, mediaUrl, mediaType)
    return
  }

  const planButtons = buildPlanButtons(plans)

  if (effectiveFlowType === 'direct') {
    await sendWelcomeWithButtons(token, chatId, welcomeMsg, mediaUrl, mediaType, planButtons)
  } else if (effectiveFlowType === 'presentation') {
    await sendWelcomeOnly(token, chatId, welcomeMsg, mediaUrl, mediaType)
    const howMsg = await getBotMessage(bot.id as string, 'how_it_works')
    await sendButtons(token, chatId, howMsg, planButtons)
  } else if (effectiveFlowType === 'consultive') {
    const btnText = await getBotMessage(bot.id as string, 'consultive_button_text')
    const consultiveButton = [[{ text: btnText, callback_data: `show_how_${abVariant}` }]]
    await sendWelcomeWithButtons(token, chatId, welcomeMsg, mediaUrl, mediaType, consultiveButton)
  } else {
    await sendWelcomeWithButtons(token, chatId, welcomeMsg, mediaUrl, mediaType, planButtons)
  }
}

// ─── callback_query ───────────────────────────────────────────────────────────

async function handleCallbackQuery(bot: Record<string, unknown>, update: TelegramUpdate) {
  const cq = update.callback_query!
  const data = cq.data ?? ''
  const from = cq.from
  const chatId = cq.message?.chat.id ?? from.id
  const token = bot.telegram_token as string

  await answerCallbackQuery(token, cq.id)

  // show_how — consultive flow step 2 (variant encoded in callback data)
  if (data.startsWith('show_how')) {
    const variant = data.includes('_b') ? 'b' : 'a'
    const { data: plans } = await supabaseAdmin
      .from('plans').select('*').eq('bot_id', bot.id).eq('plan_role', 'main').order('price', { ascending: true })
    const planButtons = plans ? buildPlanButtons(plans) : []
    const howMsg = await getBotMessage(bot.id as string, 'how_it_works')
    await sendButtons(token, chatId, howMsg, planButtons)
    recordEvent(bot.id as string, String(from.id), 'plan_view', { abVariant: variant })
    return
  }

  if (!data.startsWith('buy_')) return

  const planId = data.replace('buy_', '')

  // Record plan click
  const userRecord = await supabaseAdmin
    .from('telegram_users')
    .select('ab_variant')
    .eq('bot_id', bot.id)
    .eq('telegram_id', String(from.id))
    .maybeSingle()
  const abVariant = userRecord?.data?.ab_variant ?? undefined

  recordEvent(bot.id as string, String(from.id), 'plan_click', { planId, abVariant })

  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans').select('*').eq('id', planId).eq('bot_id', bot.id).single()

  if (planError || !plan) { await sendMessage(token, chatId, '❌ Plano não encontrado.'); return }

  // Re-send pending payment
  const { data: existingPayment } = await supabaseAdmin
    .from('payments').select('*').eq('bot_id', bot.id).eq('plan_id', planId)
    .eq('telegram_id', String(from.id)).eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (existingPayment?.pix_code) {
    const pendingMsg = await getBotMessage(bot.id as string, 'payment_pending', { nome: from.first_name ?? '', plano: plan.name })
    await sendMessage(token, chatId, pendingMsg)
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(existingPayment.pix_code)}`
      await sendPhoto(token, chatId, qrUrl)
    } catch { /* ignore */ }
    const pixMsg = await getBotMessage(bot.id as string, 'pix_instructions')
    await sendMessage(token, chatId, pixMsg)
    await sendMessage(token, chatId, `<code>${existingPayment.pix_code}</code>`)
    return
  }

  await sendMessage(token, chatId, '⏳ Um momento, estou gerando seu Pix...')

  const botPixelCq = {
    pixelId: bot.meta_pixel_id as string | undefined,
    accessToken: bot.meta_access_token as string | undefined,
    testEventCode: bot.meta_test_event_code as string | undefined,
  }
  sendInitiateCheckoutEvent({
    eventId: `checkout_${planId}_${from.id}_${Date.now()}`,
    value: Number(plan.price),
    planName: plan.name,
    planId,
    telegramId: String(from.id),
    firstName: from.first_name,
  }, botPixelCq).catch(() => {})

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments').insert({
      bot_id: bot.id,
      plan_id: planId,
      plan_name: plan.name,
      plan_price: plan.price,
      telegram_id: String(from.id),
      ab_variant: abVariant ?? null,
      status: 'pending',
    }).select().single()

  if (paymentError || !payment) { await sendMessage(token, chatId, '❌ Erro ao criar pagamento. Tente novamente.'); return }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const pixResponse = await createPix({
      identifier: `payment_${payment.id}_telegram_${from.id}`,
      amount: Number(plan.price),
      client: {
        name: from.first_name || 'Cliente',
        email: `telegram_${from.id}@cliente.com`,
        phone: '11999999999',
        document: '78189144472',
      },
      callbackUrl: baseUrl ? `${baseUrl}/api/amplopay/webhook` : undefined,
    })

    await supabaseAdmin.from('payments').update({
      transaction_id: pixResponse.transactionId,
      pix_code: pixResponse.pix?.code,
      qr_code: pixResponse.pix?.qrCode,
    }).eq('id', payment.id)

    recordEvent(bot.id as string, String(from.id), 'pix_generated', { planId, abVariant })

    const priceFormatted = `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`
    const introMsg = await getBotMessage(bot.id as string, 'payment_intro', {
      nome: from.first_name ?? '',
      plano: plan.name,
      valor: priceFormatted,
    })
    await sendMessage(token, chatId, introMsg)

    if (pixResponse.pix?.code) {
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixResponse.pix.code)}`
        await sendPhoto(token, chatId, qrUrl)
      } catch { /* ignore */ }
    }

    const pixMsg = await getBotMessage(bot.id as string, 'pix_instructions')
    await sendMessage(token, chatId, pixMsg)
    await sendMessage(token, chatId, `<code>${pixResponse.pix?.code}</code>`)
  } catch (err) {
    console.error('[Telegram] createPix error:', err)
    await supabaseAdmin.from('payments').delete().eq('id', payment.id)
    await sendMessage(token, chatId, '❌ Erro ao gerar pagamento Pix. Por favor, tente novamente em instantes.')
  }
}
