import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// NOTE: This cron requires Vercel Pro (cron jobs are a Pro feature).
// Add to vercel.json when upgrading:
// { "crons": [{ "path": "/api/cron/send-remarketing", "schedule": "*/15 * * * *" }] }
//
// The cron runs every 15 minutes and sends all remarketing messages that are due.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Fetch pending sends that are due
  const { data: pending } = await supabaseAdmin
    .from('remarketing_sends')
    .select('id, bot_id, telegram_id, step_id, remarketing_steps(message_text, remarketing_sequences(bot_id))')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .limit(100)

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0, failed = 0

  for (const send of pending) {
    const step = send.remarketing_steps as unknown as { message_text: string } | null
    if (!step?.message_text) continue

    const { data: bot } = await supabaseAdmin
      .from('bots')
      .select('telegram_token')
      .eq('id', send.bot_id)
      .single()

    if (!bot?.telegram_token) {
      await supabaseAdmin.from('remarketing_sends').update({ status: 'failed', error_msg: 'Bot sem token' }).eq('id', send.id)
      failed++
      continue
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${bot.telegram_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: send.telegram_id, text: step.message_text, parse_mode: 'HTML' }),
      })
      if (res.ok) {
        await supabaseAdmin.from('remarketing_sends').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', send.id)
        sent++
      } else {
        const err = await res.text()
        await supabaseAdmin.from('remarketing_sends').update({ status: 'failed', error_msg: err }).eq('id', send.id)
        failed++
      }
    } catch (e) {
      await supabaseAdmin.from('remarketing_sends').update({ status: 'failed', error_msg: String(e) }).eq('id', send.id)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
