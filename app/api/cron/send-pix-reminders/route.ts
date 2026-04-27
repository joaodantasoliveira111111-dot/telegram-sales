import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendPhoto } from '@/lib/telegram'
import { getBotMessage } from '@/lib/messages'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find payments: pending, have a pix_code, reminder not sent yet,
  // generated between 13 and 60 minutes ago
  const now = new Date()
  const from = new Date(now.getTime() - 60 * 60 * 1000).toISOString()  // 60 min ago
  const to = new Date(now.getTime() - 13 * 60 * 1000).toISOString()    // 13 min ago

  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select('*, plan:plans(*), bot:bots(*)')
    .eq('status', 'pending')
    .eq('reminder_sent', false)
    .not('pix_code', 'is', null)
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) {
    console.error('[Cron pix-reminders] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  const errors: string[] = []

  for (const payment of payments ?? []) {
    const bot = payment.bot
    const plan = payment.plan
    if (!bot?.telegram_token || !payment.pix_code) continue

    const priceFormatted = `R$ ${Number(payment.plan_price ?? plan?.price ?? 0).toFixed(2).replace('.', ',')}`

    try {
      const msg = await getBotMessage(payment.bot_id, 'pix_reminder', {
        nome: '',
        plano: payment.plan_name ?? plan?.name ?? 'Plano',
        valor: priceFormatted,
      })
      await sendMessage(bot.telegram_token, payment.telegram_id, msg)

      // Resend QR code
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payment.pix_code)}`
        await sendPhoto(bot.telegram_token, payment.telegram_id, qrUrl)
      } catch { /* ignore */ }

      // Resend the code
      await sendMessage(bot.telegram_token, payment.telegram_id, `<code>${payment.pix_code}</code>`)

      // Mark reminder sent
      await supabaseAdmin.from('payments').update({ reminder_sent: true }).eq('id', payment.id)
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`payment ${payment.id}: ${msg}`)
      console.error('[Cron pix-reminders] send error:', err)
    }
  }

  return NextResponse.json({ ok: true, sent, errors })
}
