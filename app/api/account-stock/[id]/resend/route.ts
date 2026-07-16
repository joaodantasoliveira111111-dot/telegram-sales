import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import { sendMessage } from '@/lib/telegram'
import { buildAccountDeliveryMessage } from '@/lib/accounts'

function adminOnly(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session || session.type !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const deny = adminOnly(session)
  if (deny) return deny

  const { id } = await params

  const { data: account, error } = await supabaseAdmin
    .from('account_stocks')
    .select('*, bot:bots(telegram_token), plan:plans(name, product_type_id)')
    .eq('id', id)
    .single()

  if (error || !account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
  if (!account.delivered_to_telegram_id) return NextResponse.json({ error: 'Conta ainda não foi entregue a ninguém' }, { status: 400 })

  const bot = account.bot as { telegram_token: string } | null
  if (!bot?.telegram_token) return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 })

  const plan = account.plan as { name: string; product_type_id: string | null } | null
  const planName = plan?.name ?? account.product_name

  const msg = await buildAccountDeliveryMessage(account.bot_id, { name: planName, product_type_id: plan?.product_type_id ?? null }, account)

  try {
    await sendMessage(bot.telegram_token, account.delivered_to_telegram_id, msg)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao enviar mensagem' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
