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

  // Get target users based on target_type
  let allIds: string[] = []

  if (broadcast.target_type === 'all') {
    const { data } = await supabaseAdmin
      .from('telegram_users')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
    allIds = (data ?? []).map((u) => u.telegram_id)
  } else if (broadcast.target_type === 'active') {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
      .eq('status', 'active')
    allIds = [...new Set((data ?? []).map((u) => u.telegram_id))]
  } else if (broadcast.target_type === 'expired') {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
      .eq('status', 'expired')
    allIds = [...new Set((data ?? []).map((u) => u.telegram_id))]
  } else if (broadcast.target_type === 'unpaid') {
    const { data: allUsers } = await supabaseAdmin
      .from('telegram_users')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
    const { data: paidUsers } = await supabaseAdmin
      .from('payments')
      .select('telegram_id')
      .eq('bot_id', broadcast.bot_id)
      .eq('status', 'paid')
    const paidSet = new Set((paidUsers ?? []).map((p) => p.telegram_id))
    allIds = (allUsers ?? []).map((u) => u.telegram_id).filter((id) => !paidSet.has(id))
  }

  allIds = [...new Set(allIds)]

  // Exclude users who already received this broadcast
  const { data: alreadySent } = await supabaseAdmin
    .from('broadcast_recipients')
    .select('telegram_id')
    .eq('broadcast_id', id)

  const alreadySentSet = new Set((alreadySent ?? []).map((r) => r.telegram_id))
  const telegramIds = allIds.filter((tid) => !alreadySentSet.has(tid))

  let sent = 0
  const newRecipients: { broadcast_id: string; telegram_id: string }[] = []

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
      newRecipients.push({ broadcast_id: id, telegram_id: chatId })
    } catch {
      // User blocked the bot — skip
    }
    await new Promise((r) => setTimeout(r, 50))
  }

  // Record new recipients
  if (newRecipients.length > 0) {
    await supabaseAdmin.from('broadcast_recipients').insert(newRecipients)
  }

  const totalSent = (broadcast.sent_count ?? 0) + sent

  await supabaseAdmin
    .from('broadcasts')
    .update({ status: 'sent', sent_count: totalSent })
    .eq('id', id)

  return NextResponse.json({ ok: true, sent, skipped: alreadySentSet.size, total: telegramIds.length + alreadySentSet.size })
}
