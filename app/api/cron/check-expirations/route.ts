import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendButtons, kickChatMember } from '@/lib/telegram'
import { getBotMessage } from '@/lib/messages'

export const runtime = 'nodejs'
export const maxDuration = 60

function authOk(req: NextRequest) {
  const h = req.headers.get('authorization')
  const s = process.env.CRON_SECRET
  return !s || h === `Bearer ${s}`
}

export async function GET(request: NextRequest) {
  if (!authOk(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()

  // ── 1. Mark expired subscriptions ────────────────────────────────────────────
  const { data: expired } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', now.toISOString())
    .select('*, bot:bots(*), plan:plans(*)')

  // Notify + kick expired users
  for (const sub of expired ?? []) {
    const botToken = sub.bot?.telegram_token as string | undefined
    if (!botToken) continue

    try {
      const msg = await getBotMessage(sub.bot?.id, 'subscription_expired', {
        nome: '', plano: sub.plan?.name ?? 'Premium',
      })
      await sendMessage(botToken, sub.telegram_id, msg)
    } catch { /* ignore */ }

    // Kick from group if plan has kick_on_expire and has a chat_id
    const chatId = sub.plan?.telegram_chat_id
    if (sub.plan?.kick_on_expire && chatId) {
      try {
        await kickChatMember(botToken, chatId, sub.telegram_id)
      } catch (err) {
        console.error('[Cron] kick error:', err)
      }
    }

    // Send renewal offer if not already sent
    if (!sub.renewal_offered_at && sub.plan) {
      try {
        const discountPct: number = sub.plan.renewal_discount_pct ?? 0
        const price = Number(sub.plan.price)
        const discountedPrice = discountPct > 0
          ? (price * (1 - discountPct / 100)).toFixed(2).replace('.', ',')
          : price.toFixed(2).replace('.', ',')

        const renewMsg = discountPct > 0
          ? `🔄 *Renove seu acesso!*\n\n${discountPct}% de desconto especial para você: *R$ ${discountedPrice}*`
          : `🔄 *Renove seu acesso ao ${sub.plan.name}!*`

        await sendButtons(
          botToken,
          sub.telegram_id,
          renewMsg,
          [[{ text: `Renovar — R$ ${discountedPrice}`, callback_data: `buy_${sub.plan.id}` }]]
        )
        await supabaseAdmin
          .from('subscriptions')
          .update({ renewal_offered_at: now.toISOString() })
          .eq('id', sub.id)
      } catch { /* ignore */ }
    }
  }

  // ── 2. Send expiry warnings (7, 3, 1 days before) ────────────────────────────
  const warningDays = [7, 3, 1]
  let warnings = 0

  for (const days of warningDays) {
    const windowStart = new Date(now.getTime() + days * 86400000)
    const windowEnd = new Date(windowStart.getTime() + 3600000) // 1h window

    const { data: expiringSoon } = await supabaseAdmin
      .from('subscriptions')
      .select('*, bot:bots(*), plan:plans(*)')
      .eq('status', 'active')
      .gte('expires_at', windowStart.toISOString())
      .lt('expires_at', windowEnd.toISOString())
      // Only send if we haven't sent this specific day warning yet
      .not('notified_days', 'cs', `{${days}}`)

    for (const sub of expiringSoon ?? []) {
      const botToken = sub.bot?.telegram_token as string | undefined
      if (!botToken) continue

      try {
        const planName = sub.plan?.name ?? 'Premium'
        const price = Number(sub.plan?.price ?? 0).toFixed(2).replace('.', ',')
        const daysText = days === 1 ? 'amanhã' : `em ${days} dias`
        const msg = `⚠️ *Atenção!*\n\nSeu acesso ao *${planName}* expira *${daysText}*.\n\nRenove agora para não perder o acesso!`

        await sendButtons(
          botToken,
          sub.telegram_id,
          msg,
          [[{ text: `Renovar — R$ ${price}`, callback_data: `buy_${sub.plan?.id}` }]]
        )

        // Record that we sent this day's notification
        const current = (sub.notified_days as number[]) ?? []
        await supabaseAdmin
          .from('subscriptions')
          .update({ notified_days: [...current, days] })
          .eq('id', sub.id)

        warnings++
      } catch { /* ignore */ }
    }
  }

  return NextResponse.json({
    ok: true,
    expired: expired?.length ?? 0,
    warnings,
  })
}
