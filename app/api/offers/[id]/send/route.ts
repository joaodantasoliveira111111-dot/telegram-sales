import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendButtons } from '@/lib/telegram'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: offer, error } = await supabaseAdmin
    .from('offers')
    .select('*, bot:bots(*), trigger_plan:plans!offers_trigger_plan_id_fkey(*), offer_plan:plans!offers_offer_plan_id_fkey(*)')
    .eq('id', id)
    .single()

  if (error || !offer) {
    return NextResponse.json({ error: 'Oferta não encontrada' }, { status: 404 })
  }

  if (offer.type !== 'downsell') {
    return NextResponse.json({ error: 'Envio manual disponível apenas para downsell' }, { status: 400 })
  }

  const botToken = offer.bot.telegram_token as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offerPlan = offer.offer_plan as any

  // Target: users who started the bot but never paid for the trigger plan
  const { data: allUsers } = await supabaseAdmin
    .from('telegram_users')
    .select('telegram_id')
    .eq('bot_id', offer.bot_id)

  const { data: paidUsers } = await supabaseAdmin
    .from('payments')
    .select('telegram_id')
    .eq('bot_id', offer.bot_id)
    .eq('plan_id', offer.trigger_plan_id)
    .eq('status', 'paid')

  const paidSet = new Set((paidUsers ?? []).map((p) => p.telegram_id))
  const eligible = (allUsers ?? []).map((u) => u.telegram_id).filter((tid) => !paidSet.has(tid))

  // Exclude users who already received this downsell
  const { data: alreadySent } = await supabaseAdmin
    .from('offer_sends')
    .select('telegram_id')
    .eq('offer_id', id)

  const alreadySentSet = new Set((alreadySent ?? []).map((r) => r.telegram_id))
  const targets = eligible.filter((tid) => !alreadySentSet.has(tid))

  let sent = 0
  const newSends: { offer_id: string; telegram_id: string }[] = []

  for (const chatId of targets) {
    try {
      await sendButtons(
        botToken,
        chatId,
        offer.message,
        [[{
          text: `${offerPlan.button_text || offerPlan.name} — R$ ${Number(offerPlan.price).toFixed(2).replace('.', ',')}`,
          callback_data: `buy_${offerPlan.id}`,
        }]]
      )
      sent++
      newSends.push({ offer_id: id, telegram_id: chatId })
    } catch {
      // User blocked the bot
    }
    await new Promise((r) => setTimeout(r, 50))
  }

  if (newSends.length > 0) {
    await supabaseAdmin.from('offer_sends').insert(newSends)
  }

  return NextResponse.json({ ok: true, sent, skipped: alreadySentSet.size, total: targets.length + alreadySentSet.size })
}
