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
  createInviteLink,
} from '@/lib/telegram'
import { createPix } from '@/lib/amplopay'
import { TelegramUpdate, Plan } from '@/types'
import { addDays } from '@/lib/utils'
import { getBotMessage } from '@/lib/messages'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params

  // Fetch bot from DB
  const { data: bot, error: botError } = await supabaseAdmin
    .from('bots')
    .select('*')
    .eq('id', botId)
    .eq('is_active', true)
    .single()

  if (botError || !bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  let update: TelegramUpdate
  try {
    update = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Handle /start command
  if (update.message?.text?.startsWith('/start')) {
    await handleStart(bot, update)
    return NextResponse.json({ ok: true })
  }

  // Handle callback_query (button click)
  if (update.callback_query) {
    await handleCallbackQuery(bot, update)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

async function handleStart(bot: Record<string, unknown>, update: TelegramUpdate) {
  const msg = update.message!
  const from = msg.from
  const chatId = msg.chat.id

  // Upsert telegram user
  await supabaseAdmin.from('telegram_users').upsert(
    {
      bot_id: bot.id,
      telegram_id: String(from.id),
      username: from.username ?? null,
      first_name: from.first_name ?? null,
    },
    { onConflict: 'bot_id,telegram_id' }
  )

  const token = bot.telegram_token as string
  const welcomeMsg = bot.welcome_message as string
  const mediaUrl = bot.welcome_media_url as string | null
  const mediaType = bot.welcome_media_type as string | null

  // Fetch only main plans for this bot
  const { data: plans } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('bot_id', bot.id)
    .eq('plan_role', 'main')
    .order('price', { ascending: true })

  if (!plans || plans.length === 0) {
    if (mediaUrl && mediaType === 'image') {
      await sendPhoto(token, chatId, mediaUrl, welcomeMsg)
    } else if (mediaUrl && mediaType === 'video') {
      await sendVideo(token, chatId, mediaUrl, welcomeMsg)
    } else {
      await sendMessage(token, chatId, welcomeMsg)
    }
    return
  }

  // Build inline keyboard
  const buttons = plans.map((plan: Plan) => [
    {
      text: `${plan.button_text} — R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`,
      callback_data: `buy_${plan.id}`,
    },
  ])

  // Send welcome + buttons as a single message (no extra text between them)
  if (mediaUrl && mediaType === 'image') {
    await sendPhotoWithButtons(token, chatId, mediaUrl, welcomeMsg, buttons)
  } else if (mediaUrl && mediaType === 'video') {
    await sendVideoWithButtons(token, chatId, mediaUrl, welcomeMsg, buttons)
  } else {
    await sendButtons(token, chatId, welcomeMsg, buttons)
  }
}

async function handleCallbackQuery(bot: Record<string, unknown>, update: TelegramUpdate) {
  const cq = update.callback_query!
  const data = cq.data ?? ''
  const from = cq.from
  const chatId = cq.message?.chat.id ?? from.id

  const token = bot.telegram_token as string

  await answerCallbackQuery(token, cq.id)

  if (!data.startsWith('buy_')) return

  const planId = data.replace('buy_', '')

  // Fetch plan
  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('bot_id', bot.id)
    .single()

  if (planError || !plan) {
    await sendMessage(token, chatId, '❌ Plano não encontrado.')
    return
  }

  // Check for pending payment already existing (idempotency)
  const { data: existingPayment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('bot_id', bot.id)
    .eq('plan_id', planId)
    .eq('telegram_id', String(from.id))
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingPayment?.pix_code) {
    const priceFormatted = `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`
    const msg = await getBotMessage(bot.id as string, 'payment_pending', {
      nome: from.first_name ?? '',
      plano: plan.name,
      codigo: existingPayment.pix_code,
    })
    await sendMessage(token, chatId, msg)
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(existingPayment.pix_code)}`
      await sendPhoto(token, chatId, qrUrl, `📷 Escaneie o QR Code com o app do seu banco para pagar ${priceFormatted}`)
    } catch {
      // QR code send failed — continue
    }
    await sendMessage(token, chatId, `<code>${existingPayment.pix_code}</code>`)
    return
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      bot_id: bot.id,
      plan_id: planId,
      telegram_id: String(from.id),
      status: 'pending',
    })
    .select()
    .single()

  if (paymentError || !payment) {
    await sendMessage(token, chatId, '❌ Erro ao criar pagamento. Tente novamente.')
    return
  }

  // Create Pix via AmploPay
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

    // Update payment with pix data
    await supabaseAdmin
      .from('payments')
      .update({
        transaction_id: pixResponse.transactionId,
        pix_code: pixResponse.pix?.code,
        qr_code: pixResponse.pix?.qrCode,
      })
      .eq('id', payment.id)

    const priceFormatted = `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`

    const introMsg = await getBotMessage(bot.id as string, 'payment_intro', {
      nome: from.first_name ?? '',
      plano: plan.name,
      valor: priceFormatted,
    })
    await sendMessage(token, chatId, introMsg)

    // Send QR code image generated from Pix code string
    if (pixResponse.pix?.code) {
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixResponse.pix.code)}`
        await sendPhoto(
          token,
          chatId,
          qrUrl,
          `📷 Escaneie o QR Code com o app do seu banco para pagar ${priceFormatted}`
        )
      } catch {
        // QR code send failed — continue with copia e cola only
      }
    }

    const pixMsg = await getBotMessage(bot.id as string, 'pix_instructions')
    await sendMessage(token, chatId, pixMsg)
    await sendMessage(token, chatId, `<code>${pixResponse.pix?.code}</code>`)
  } catch (err) {
    console.error('[Telegram] createPix error:', err)
    // Clean up the pending payment
    await supabaseAdmin.from('payments').delete().eq('id', payment.id)
    await sendMessage(
      token,
      chatId,
      '❌ Erro ao gerar pagamento Pix. Por favor, tente novamente em instantes.'
    )
  }
}
