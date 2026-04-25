import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage } from '@/lib/telegram'

// Protect with CRON_SECRET header
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Expire subscriptions past their expiry date
  const { data: expired, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select('*, bot:bots(*), plan:plans(*)')

  if (error) {
    console.error('[Cron] check-expirations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Optionally notify users of expiration
  const notifications: Promise<unknown>[] = []

  for (const sub of expired ?? []) {
    const botToken = sub.bot?.telegram_token
    if (!botToken) continue

    notifications.push(
      sendMessage(
        botToken,
        sub.telegram_id,
        `⚠️ Seu acesso ao plano <b>${sub.plan?.name ?? 'Premium'}</b> expirou.\n\nPara renovar, clique em /start.`
      ).catch((err) => console.error('[Cron] notify error:', err))
    )
  }

  await Promise.allSettled(notifications)

  return NextResponse.json({
    ok: true,
    expired: expired?.length ?? 0,
  })
}
