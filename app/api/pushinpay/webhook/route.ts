import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, createInviteLink, sendButtons } from '@/lib/telegram'
import { reserveAccountForPlan, markAccountDelivered } from '@/lib/accounts'
import { addDays } from '@/lib/utils'
import { sendPurchaseEvent } from '@/lib/meta'
import { getBotMessage } from '@/lib/messages'

interface PushinPayWebhookPayload {
  id: string
  value: number
  status: 'created' | 'paid' | 'canceled'
  end_to_end_id: string | null
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  let payload: PushinPayWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  await supabaseAdmin.from('webhook_logs').insert({
    source: 'pushinpay',
    payload: payload as unknown as Record<string, unknown>,
  })

  const { id: transactionId, status } = payload
  if (!transactionId) return NextResponse.json({ ok: true })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*, plan:plans(*), bot:bots(*)')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  if (!payment) {
    console.warn('[PushinPay Webhook] Payment not found:', transactionId)
    return NextResponse.json({ ok: true })
  }

  if (status === 'paid') {
    if (payment.status === 'paid') return NextResponse.json({ ok: true })

    await supabaseAdmin.from('payments').update({ status: 'paid' }).eq('id', payment.id)

    void supabaseAdmin.from('bot_events').insert({
      bot_id: payment.bot_id,
      telegram_id: String(payment.telegram_id),
      event_type: 'payment_confirmed',
      plan_id: payment.plan_id,
      ab_variant: payment.ab_variant ?? null,
    })

    const plan = payment.plan
    const bot = payment.bot
    const expiresAt = addDays(new Date(), plan.duration_days)

    const botPixel = {
      pixelId: bot.meta_pixel_id || undefined,
      accessToken: bot.meta_access_token || undefined,
      testEventCode: bot.meta_test_event_code || undefined,
    }

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
          console.error('[Account Stock] send error:', err)
        }
      } else {
        const msg = await getBotMessage(payment.bot_id, 'stock_empty', { nome: '', plano: plan.name })
        await sendMessage(botToken, chatId, msg)
      }
    } else if (plan.content_type === 'telegram_channel' && plan.telegram_chat_id) {
      try {
        const inviteLink = await createInviteLink(botToken, plan.telegram_chat_id)
        const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_channel', {
          nome: '', plano: plan.name, link: inviteLink ?? '',
          expira: expiresAt.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' }),
        })
        await sendMessage(botToken, chatId, msg)
      } catch {
        const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_generic', { nome: '', plano: plan.name })
        await sendMessage(botToken, chatId, msg)
      }
    } else if (plan.content_type === 'link' && plan.content_url) {
      const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_link', {
        nome: '', plano: plan.name, link: plan.content_url,
        expira: expiresAt.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' }),
      })
      await sendMessage(botToken, chatId, msg)
    } else {
      const msg = await getBotMessage(payment.bot_id, 'payment_confirmed_generic', { nome: '', plano: plan.name })
      await sendMessage(botToken, chatId, msg)
    }

    if (payment.affiliate_code) {
      const commission = Number(payment.plan_price ?? payment.plan?.price ?? 0)
      const { data: affiliate } = await supabaseAdmin
        .from('affiliates')
        .select('id, commission_pct, total_sales, total_earned')
        .eq('bot_id', payment.bot_id)
        .eq('code', payment.affiliate_code)
        .maybeSingle()
      if (affiliate) {
        const earned = commission * (affiliate.commission_pct / 100)
        void supabaseAdmin.from('affiliates').update({
          total_sales: (affiliate.total_sales ?? 0) + 1,
          total_earned: Number((affiliate.total_earned ?? 0)) + earned,
        }).eq('id', affiliate.id)
      }
    }

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
      await sendButtons(botToken, chatId, upsellOffer.message, [[{
        text: `${offerPlan.button_text || offerPlan.name} — R$ ${Number(offerPlan.price).toFixed(2).replace('.', ',')}`,
        callback_data: `buy_${offerPlan.id}`,
      }]])
    }

  } else if (status === 'canceled') {
    await supabaseAdmin.from('payments').update({ status: 'canceled' }).eq('id', payment.id)
    const failMsg = await getBotMessage(payment.bot_id, 'payment_failed', { nome: '' })
    await sendMessage(payment.bot.telegram_token, payment.telegram_id, failMsg)
  }

  return NextResponse.json({ ok: true })
}
