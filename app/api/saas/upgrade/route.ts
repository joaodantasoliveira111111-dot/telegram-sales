import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { createPix as amlopayCreatePix } from '@/lib/amplopay'

const PLAN_ORDER = ['pay_per_use', 'starter', 'pro']
const PLAN_PRICES: Record<string, number> = { starter: 97, pro: 297 }

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.type !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { new_plan } = await request.json()
  if (!PLAN_ORDER.includes(new_plan)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('saas_users')
    .select('id, name, email, phone, cpf_cnpj, plan_type')
    .eq('id', session.userId!)
    .single()

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Only allow upgrades
  const currentIdx = PLAN_ORDER.indexOf(user.plan_type)
  const newIdx = PLAN_ORDER.indexOf(new_plan)
  if (newIdx <= currentIdx) {
    return NextResponse.json({ error: 'Você só pode fazer upgrade para um plano superior' }, { status: 400 })
  }

  // pay_per_use has no monthly fee
  if (new_plan === 'pay_per_use') {
    await supabaseAdmin.from('saas_users').update({ plan_type: 'pay_per_use' }).eq('id', user.id)
    return NextResponse.json({ ok: true, requires_payment: false })
  }

  const amount = PLAN_PRICES[new_plan]
  const settings = await getSettings([
    'saas_billing_gateway',
    'saas_billing_amplopay_public_key', 'saas_billing_amplopay_secret_key',
    'saas_billing_pushinpay_token',
  ])
  const gateway = settings.saas_billing_gateway || 'amplopay'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  try {
    let paymentId = '', pixCode = '', pixQr = ''

    if (gateway === 'amplopay') {
      const pix = await amlopayCreatePix({
        identifier: `upgrade-${user.id}-${new_plan}-${Date.now()}`,
        amount,
        callbackUrl: `${baseUrl}/api/saas/billing-webhook`,
        client: {
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          document: user.cpf_cnpj ?? undefined,
        },
      }, {
        publicKey: settings.saas_billing_amplopay_public_key,
        secretKey: settings.saas_billing_amplopay_secret_key,
      })
      paymentId = pix.transactionId
      pixCode = pix.pix.code
      pixQr = pix.pix.qrCode
    } else {
      // PushinPay
      const { createPix: pushinCreatePix } = await import('@/lib/pushinpay')
      const pix = await pushinCreatePix({
        value: amount,
        webhookUrl: `${baseUrl}/api/saas/billing-webhook`,
      }, settings.saas_billing_pushinpay_token)
      paymentId = pix.id
      pixCode = pix.qr_code
      pixQr = pix.qr_code_base64 ?? ''
    }

    await supabaseAdmin.from('saas_users').update({
      billing_payment_id: paymentId,
      billing_payment_code: pixCode,
      billing_payment_qr: pixQr,
    }).eq('id', user.id)

    return NextResponse.json({
      ok: true,
      requires_payment: true,
      payment_id: paymentId,
      pix_code: pixCode,
      pix_qr: pixQr,
      amount,
      new_plan,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao gerar PIX: ${msg}` }, { status: 500 })
  }
}
