import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendPhoto, sendVideo } from '@/lib/telegram'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: broadcast, error: bErr } = await supabaseAdmin
    .from('broadcasts')
    .select('*, bot:bots(*)')
    .eq('id', id)
    .single()

  if (bErr || !broadcast) {
    return NextResponse.json({ error: 'Broadcast não encontrado' }, { status: 404 })
  }

  if (broadcast.status === 'sending') {
    return NextResponse.json({ error: 'Envio já em andamento' }, { status: 409 })
  }

  await supabaseAdmin.from('broadcasts').update({ status: 'sending' }).eq('id', id)

  const botToken = broadcast.bot.telegram_token as string

  // Get target users
  let telegramIds: string[] = []

  if (broadcast.target_type === 'all') {
    const { data } = await supabaseAdmin
      .from('telegram_users')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
    telegramIds = (data ?? []).map((u) => u.telegram_id)
  } else if (broadcast.target_type === 'active') {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
      .eq('status', 'active')
    telegramIds = [...new Set((data ?? []).map((u) => u.telegram_id))]
  } else if (broadcast.target_type === 'expired') {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
      .eq('status', 'expired')
    telegramIds = [...new Set((data ?? []).map((u) => u.telegram_id))]
  } else if (broadcast.target_type === 'unpaid') {
    // Users who started but never completed a payment
    const { data: allUsers } = await supabaseAdmin
      .from('telegram_users')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)

    const { data: paidUsers } = await supabaseAdmin
      .from('payments')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
      .eq('status', 'paid')

    const paidIds = new Set((paidUsers ?? []).map((p) => p.telegram_id))
    telegramIds = (allUsers ?? [])
      .map((u) => u.telegram_id)
      .filter((id) => !paidIds.has(id))
  }

  // Remove duplicates
  telegramIds = [...new Set(telegramIds)]

  let sent = 0
  for (const chatId of telegramIds) {
    try {
      if (broadcast.media_url && broadcast.media_type === 'image') {
        await sendPhoto(botToken, chatId, broadcast.media_url, broadcast.message_text)
      } else if (broadcast.media_url && broadcast.media_type === 'video') {
        await sendVideo(botToken, chatId, broadcast.media_url, broadcast.message_text)
      } else {
        await sendMessage(botToken, chatId, broadcast.message_text)
      }
      sent++
    } catch {
      // Skip users who blocked the bot
    }
    // Respect Telegram rate limit
    await new Promise((r) => setTimeout(r, 50))
  }

  await supabaseAdmin
    .from('broadcasts')
    .update({ status: 'sent', sent_count: sent })
    .eq('id', id)

  return NextResponse.json({ ok: true, sent, total: telegramIds.length })
}
