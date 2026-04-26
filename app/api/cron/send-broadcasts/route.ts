import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendPhoto, sendVideo } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find scheduled broadcasts that are due
  const { data: broadcasts } = await supabaseAdmin
    .from('broadcasts')
    .select('*, bot:bots(*)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (!broadcasts || broadcasts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let totalSent = 0

  for (const broadcast of broadcasts) {
    await supabaseAdmin.from('broadcasts').update({ status: 'sending' }).eq('id', broadcast.id)

    const botToken = broadcast.bot.telegram_token as string

    // Get target users
    let telegramIds: string[] = []

    if (broadcast.target_type === 'all') {
      const { data } = await supabaseAdmin
        .from('telegram_users').select('telegram_id').eq('bot_id', broadcast.bot_id)
      telegramIds = (data ?? []).map((u) => u.telegram_id)
    } else if (broadcast.target_type === 'active') {
      const { data } = await supabaseAdmin
        .from('subscriptions').select('telegram_id').eq('bot_id', broadcast.bot_id).eq('status', 'active')
      telegramIds = [...new Set((data ?? []).map((u) => u.telegram_id))]
    } else if (broadcast.target_type === 'expired') {
      const { data } = await supabaseAdmin
        .from('subscriptions').select('telegram_id').eq('bot_id', broadcast.bot_id).eq('status', 'expired')
      telegramIds = [...new Set((data ?? []).map((u) => u.telegram_id))]
    } else if (broadcast.target_type === 'unpaid') {
      const { data: allUsers } = await supabaseAdmin
        .from('telegram_users').select('telegram_id').eq('bot_id', broadcast.bot_id)
      const { data: paidUsers } = await supabaseAdmin
        .from('payments').select('telegram_id').eq('bot_id', broadcast.bot_id).eq('status', 'paid')
      const paidIds = new Set((paidUsers ?? []).map((p) => p.telegram_id))
      telegramIds = (allUsers ?? []).map((u) => u.telegram_id).filter((id) => !paidIds.has(id))
    }

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
      } catch { /* skip blocked users */ }
      await new Promise((r) => setTimeout(r, 50))
    }

    await supabaseAdmin
      .from('broadcasts')
      .update({ status: 'sent', sent_count: sent })
      .eq('id', broadcast.id)

    totalSent += sent
  }

  return NextResponse.json({ ok: true, processed: broadcasts.length, sent: totalSent })
}
