import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage } from '@/lib/telegram'
import { createInviteLink } from '@/lib/telegram'
import { validateWebhookToken } from '@/lib/amplopay'
import { AmplopayWebhookPayload } from '@/types'
import { addDays } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-webhook-token') ?? request.nextUrl.searchParams.get('token')

  if (!validateWebhookToken(token)) {
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

  const { event, transaction } = payload

  // Fetch payment by transaction_id
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*, plan:plans(*), bot:bots(*)')
    .eq('transaction_id', transaction.id)
    .maybeSingle()

  if (!payment) {
    // Unknown transaction — still return 200 to stop retries
    console.warn('[AmploPay Webhook] Payment not found for transaction:', transaction.id)
    return NextResponse.json({ ok: true })
  }

  if (event === 'TRANSACTION_PAID') {
    // Idempotency — skip if already paid
    if (payment.status === 'paid') {
      return NextResponse.json({ ok: true })
    }

    // Update payment status
    await supabaseAdmin.from('payments').update({ status: 'paid' }).eq('id', payment.id)

    const plan = payment.plan
    const bot = payment.bot

    // Create subscription
    const expiresAt = addDays(new Date(), plan.duration_days)
    await supabaseAdmin.from('subscriptions').insert({
      bot_id: payment.bot_id,
      plan_id: payment.plan_id,
      telegram_id: payment.telegram_id,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })

    const botToken = bot.telegram_token as string
    const chatId = payment.telegram_id

    // Build access message
    if (plan.content_type === 'telegram_channel' && plan.telegram_chat_id) {
      // Generate single-use invite link
      try {
        const inviteLink = await createInviteLink(botToken, plan.telegram_chat_id)
        await sendMessage(
          botToken,
          chatId,
          `✅ <b>Pagamento confirmado!</b>\n\n` +
            `🎉 Seu acesso ao plano <b>${plan.name}</b> foi liberado!\n\n` +
            `📲 Clique no link abaixo para entrar:\n${inviteLink}\n\n` +
            `⏳ Seu acesso expira em: <b>${expiresAt.toLocaleDateString('pt-BR')}</b>`
        )
      } catch (err) {
        console.error('[AmploPay Webhook] createInviteLink error:', err)
        await sendMessage(
          botToken,
          chatId,
          `✅ <b>Pagamento confirmado!</b>\n\n` +
            `Seu acesso foi liberado. Entre em contato com o suporte para receber o link de acesso.`
        )
      }
    } else if (plan.content_type === 'link' && plan.content_url) {
      await sendMessage(
        botToken,
        chatId,
        `✅ <b>Pagamento confirmado!</b>\n\n` +
          `🎉 Seu acesso ao plano <b>${plan.name}</b> foi liberado!\n\n` +
          `🔗 Acesse aqui: ${plan.content_url}\n\n` +
          `⏳ Seu acesso expira em: <b>${expiresAt.toLocaleDateString('pt-BR')}</b>`
      )
    } else {
      await sendMessage(
        botToken,
        chatId,
        `✅ <b>Pagamento confirmado!</b>\n\nSeu acesso ao plano <b>${plan.name}</b> foi liberado!`
      )
    }
  } else if (event === 'TRANSACTION_CANCELED') {
    await supabaseAdmin.from('payments').update({ status: 'canceled' }).eq('id', payment.id)

    const bot = payment.bot
    await sendMessage(
      bot.telegram_token,
      payment.telegram_id,
      `❌ Seu pagamento foi cancelado. Se desejar, inicie novamente com /start.`
    )
  } else if (event === 'TRANSACTION_REFUNDED') {
    await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', payment.id)

    // Cancel active subscription if exists
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('bot_id', payment.bot_id)
      .eq('plan_id', payment.plan_id)
      .eq('telegram_id', payment.telegram_id)
      .eq('status', 'active')
  } else if (event === 'TRANSACTION_CHARGED_BACK') {
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
