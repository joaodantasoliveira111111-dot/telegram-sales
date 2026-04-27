import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, createInviteLink, sendButtons } from '@/lib/telegram'
import { reserveAccountForPlan, markAccountDelivered } from '@/lib/accounts'
import { validateWebhookToken } from '@/lib/amplopay'
import { addDays } from '@/lib/utils'
import { sendPurchaseEvent } from '@/lib/meta'
import { getBotMessage } from '@/lib/messages'

interface AmplopayWebhookPayload {
  transactionId: string
  clientIdentifier?: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'CHARGED_BACK'
  amount?: number
  payedAt?: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  const token =
    request.headers.get('x-webhook-token') ??
    request.nextUrl.searchParams.get('token')

  if (!await validateWebhookToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: AmplopayWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Log every webhook
  await supabaseAdmin.from('webhook_logs').insert({
    source: 'amplopay',
    payload: payload as unknown as Record<string, unknown>,
  })

  const { transactionId, status } = payload

  if (!transactionId) {
    return NextResponse.json({ ok: true })
  }

  // Fetch payment by transaction_id
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*, plan:plans(*), bot:bots(*)')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  if (!payment) {
    console.warn('[AmploPay Webhook] Payment not found for transaction:', transactionId)
    return NextResponse.json({ ok: true })
  }

  if (status === 'COMPLETED') {
    // Idempotency — skip if already paid
    if (payment.status === 'paid') {
      return NextResponse.json({ ok: true })
    }

    await supabaseAdmin.from('payments').update({ status: 'paid' }).eq('id', payment.id)

    const plan = payment.plan
    const bot = payment.bot
    const expiresAt = addDays(new Date(), plan.duration_days)

    const botPixel = {
      pixelId: bot.meta_pixel_id || undefined,
      accessToken: bot.meta_access_token || undefined,
      testEventCode: bot.meta_test_event_code || undefined,
    }

    // Dispara evento Purchase no Meta CAPI
    sendPurchaseEvent({
      eventId: `payment_${payment.id}`,
      value: Number(plan.price),
      planName: plan.name,
      planId: String(payment.plan_id ?? plan.id),
      paymentId: String(payment.id),
      telegramId: String(payment.telegram_id),
    }, botPixel).catch((err) => console.error('[Meta CAPI] erro:', err))

    await supabaseAdmin.from('subscriptions').insert({
      bot_id: payment.bot_id,
      plan_id: payment.plan_id,
      telegram_id: payment.telegram_id,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })

    const botToken = bot.telegram_token as string
    const chatId = payment.telegram_id

    if (plan.content_type === 'account_stock') {
      // Deliver account from stock
      let account = null
      try {
        account = await reserveAccountForPlan(payment.plan_id, payment.id, String(payment.telegram_id))
      } catch (err) {
        console.error('[Account Stock] reserve error:', err)
      }

      if (account) {
        const warrantyDays = account.warranty_until
          ? Math.ceil((new Date(account.warranty_until).getTime() - Date.now()) / 86400000)
          : null

        const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_account', {
          nome: '',
          plano: plan.name,
          login: account.login,
          senha: account.password,
          extra: account.extra_info ? `📋 Extra: <code>${account.extra_info}</code>` : '',
          garantia: warrantyDays ? `- Garantia de funcionamento por <b>${warrantyDays} dias</b>` : '',
        })

        try {
          await sendMessage(botToken, chatId, msg)
          await markAccountDelivered(account.id)
        } catch (err) {
          console.error('[Account Stock] send message error:', err)
        }
      } else {
        const msg = await getBotMessage(payment.bot_id, 'stock_empty', { nome: '', plano: plan.name })
        await sendMessage(botToken, chatId, msg)
        console.warn(`[Account Stock] No available account for plan ${payment.plan_id}`)
      }
    } else if (plan.content_type === 'telegram_channel' && plan.telegram_chat_id) {
      try {
        const inviteLink = await createInviteLink(botToken, plan.telegram_chat_id)
        const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_channel', {
          nome: '',
          plano: plan.name,
          link: inviteLink ?? '',
          expira: expiresAt.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' }),
        })
        await sendMessage(botToken, chatId, msg)
      } catch {
        const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_generic', { nome: '', plano: plan.name })
        await sendMessage(botToken, chatId, msg)
      }
    } else if (plan.content_type === 'link' && plan.content_url) {
      const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_link', {
        nome: '',
        plano: plan.name,
        link: plan.content_url,
        expira: expiresAt.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' }),
      })
      await sendMessage(botToken, chatId, msg)
    } else {
      const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_generic', { nome: '', plano: plan.name })
      await sendMessage(botToken, chatId, msg)
    }
    // Fire upsell offer if configured
    const { data: upsellOffer } = await supabaseAdmin
      .from('offers')
      .select('*, offer_plan:plans!offers_offer_plan_id_fkey(*)')
      .eq('bot_id', payment.bot_id)
      .eq('trigger_plan_id', payment.plan_id)
      .eq('type', 'upsell')
      .eq('is_active', true)
      .maybeSingle()

    if (upsellOffer) {
      const offerPlan = upsellOffer.offer_plan
      await sendButtons(
        botToken,
        chatId,
        upsellOffer.message,
        [[{
          text: `${offerPlan.button_text || offerPlan.name} — R$ ${Number(offerPlan.price).toFixed(2).replace('.', ',')}`,
          callback_data: `buy_${offerPlan.id}`,
        }]]
      )
    }

  } else if (status === 'FAILED') {
    await supabaseAdmin.from('payments').update({ status: 'canceled' }).eq('id', payment.id)

    const bot = payment.bot
    const failMsg = await getBotMessage(payment.bot_id, 'payment_failed', { nome: '' })
    await sendMessage(bot.telegram_token, payment.telegram_id, failMsg)
  } else if (status === 'REFUNDED') {
    await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', payment.id)

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('bot_id', payment.bot_id)
      .eq('plan_id', payment.plan_id)
      .eq('telegram_id', payment.telegram_id)
      .eq('status', 'active')
  } else if (status === 'CHARGED_BACK') {
    await supabaseAdmin.from('payments').update({ status: 'chargeback' }).eq('id', payment.id)

    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('bot_id', payment.bot_id)
      .eq('plan_id', payment.plan_id)
      .eq('telegram_id', payment.telegram_id)
      .eq('status', 'active')
  }

  return NextResponse.json({ ok: true })
}
