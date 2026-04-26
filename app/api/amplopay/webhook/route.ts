import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, createInviteLink } from '@/lib/telegram'
import { validateWebhookToken } from '@/lib/amplopay'
import { addDays } from '@/lib/utils'

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

    await supabaseAdmin.from('subscriptions').insert({
      bot_id: payment.bot_id,
      plan_id: payment.plan_id,
      telegram_id: payment.telegram_id,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })

    const botToken = bot.telegram_token as string
    const chatId = payment.telegram_id

    if (plan.content_type === 'telegram_channel' && plan.telegram_chat_id) {
      try {
        const inviteLink = await createInviteLink(botToken, plan.telegram_chat_id)
        await sendMessage(
          botToken,
          chatId,
          `✅ <b>Pagamento confirmado!</b>\n\n` +
            `🎉 Seu acesso ao plano <b>${plan.name}</b> foi liberado!\n\n` +
            `📲 Clique no link para entrar:\n${inviteLink}\n\n` +
            `⏳ Acesso válido até: <b>${expiresAt.toLocaleDateString('pt-BR')}</b>`
        )
      } catch {
        await sendMessage(
          botToken,
          chatId,
          `✅ <b>Pagamento confirmado!</b>\n\nSeu acesso foi liberado. Entre em contato com o suporte para receber o link.`
        )
      }
    } else if (plan.content_type === 'link' && plan.content_url) {
      await sendMessage(
        botToken,
        chatId,
        `✅ <b>Pagamento confirmado!</b>\n\n` +
          `🎉 Seu acesso ao plano <b>${plan.name}</b> foi liberado!\n\n` +
          `🔗 Acesse aqui: ${plan.content_url}\n\n` +
          `⏳ Acesso válido até: <b>${expiresAt.toLocaleDateString('pt-BR')}</b>`
      )
    } else {
      await sendMessage(
        botToken,
        chatId,
        `✅ <b>Pagamento confirmado!</b>\n\nSeu acesso ao plano <b>${plan.name}</b> foi liberado!`
      )
    }
  } else if (status === 'FAILED') {
    await supabaseAdmin.from('payments').update({ status: 'canceled' }).eq('id', payment.id)

    const bot = payment.bot
    await sendMessage(
      bot.telegram_token,
      payment.telegram_id,
      `❌ Seu pagamento falhou. Para tentar novamente, envie /start.`
    )
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
