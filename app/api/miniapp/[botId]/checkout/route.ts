import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateInitData } from '@/lib/telegram-webapp'
import { createPix, withWebhookToken as withAmplopayWebhookToken } from '@/lib/amplopay'
import { createPix as pushinpayCreatePix, withWebhookToken as withPushinpayWebhookToken } from '@/lib/pushinpay'
import { getSetting } from '@/lib/settings'

// Creates a pending payment + Pix for a plan bought from the Mini App
// storefront. Delivery/confirmation still flows through the existing
// AmploPay/PushinPay webhooks exactly like a purchase started in the chat —
// this route only originates the payment.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  const body = await request.json()
  const { plan_id, init_data } = body as { plan_id?: string; init_data?: string }

  if (!plan_id || !init_data) {
    return NextResponse.json({ error: 'plan_id e init_data são obrigatórios' }, { status: 400 })
  }

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('id, telegram_token, gateway, is_active, miniapp_config')
    .eq('id', botId)
    .single()

  if (!bot || !bot.is_active) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  if (!(bot.miniapp_config as { enabled?: boolean } | null)?.enabled) {
    return NextResponse.json({ error: 'Loja não está ativa' }, { status: 404 })
  }

  const user = validateInitData(bot.telegram_token, init_data)
  if (!user) return NextResponse.json({ error: 'Sessão inválida — reabra o app pelo Telegram' }, { status: 401 })

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id, name, price')
    .eq('id', plan_id)
    .eq('bot_id', botId)
    .eq('miniapp_visible', true)
    .single()

  if (!plan) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments').insert({
      bot_id: botId,
      plan_id: plan.id,
      plan_name: plan.name,
      plan_price: plan.price,
      telegram_id: String(user.id),
      status: 'pending',
    }).select().single()

  if (paymentError || !payment) return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const gateway = (bot.gateway as string | null) || await getSetting('active_gateway') || 'amplopay'

  try {
    let pixCode: string | null = null
    let qrCode: string | null = null

    if (gateway === 'pushinpay') {
      const r = await pushinpayCreatePix({
        value: Number(plan.price),
        webhookUrl: baseUrl ? await withPushinpayWebhookToken(`${baseUrl}/api/pushinpay/webhook`) : undefined,
      })
      await supabaseAdmin.from('payments').update({
        transaction_id: r.id, pix_code: r.qr_code, qr_code: r.qr_code_base64 ?? null,
      }).eq('id', payment.id)
      pixCode = r.qr_code
      qrCode = r.qr_code_base64 ?? null
    } else {
      const r = await createPix({
        identifier: `payment_${payment.id}_telegram_${user.id}`,
        amount: Number(plan.price),
        client: {
          name: user.first_name || 'Cliente',
          email: `telegram_${user.id}@cliente.com`,
          phone: '11999999999',
          document: '78189144472',
        },
        callbackUrl: baseUrl ? await withAmplopayWebhookToken(`${baseUrl}/api/amplopay/webhook`) : undefined,
      })
      await supabaseAdmin.from('payments').update({
        transaction_id: r.transactionId, pix_code: r.pix?.code, qr_code: r.pix?.qrCode,
      }).eq('id', payment.id)
      pixCode = r.pix?.code ?? null
      qrCode = r.pix?.qrCode ?? null
    }

    return NextResponse.json({ payment_id: payment.id, pix_code: pixCode, qr_code: qrCode })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar Pix'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
