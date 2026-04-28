import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'
import { createPix as amlopayCreatePix } from '@/lib/amplopay'

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(salt + password).digest('hex')
}

const PLAN_PRICES: Record<string, number> = { starter: 97, pro: 297 }

export async function POST(request: NextRequest) {
  let body: {
    name?: string; email?: string; phone?: string; cpf_cnpj?: string
    password?: string; plan_type?: string
  }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { name, email, phone, cpf_cnpj, password, plan_type = 'pay_per_use' } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('saas_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })

  const salt = randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)
  const sessionToken = randomBytes(32).toString('hex')
  const requiresPayment = ['starter', 'pro'].includes(plan_type)

  const { data: user, error } = await supabaseAdmin
    .from('saas_users')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() ?? null,
      cpf_cnpj: cpf_cnpj?.trim() ?? null,
      password_hash: passwordHash,
      password_salt: salt,
      session_token: sessionToken,
      plan_type,
      // Start inactive for paid plans; active immediately for pay_per_use
      is_active: !requiresPayment,
    })
    .select('id, name, email, plan_type')
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  }

  // For free plan — activate immediately
  if (!requiresPayment) {
    const res = NextResponse.json({ ok: true, requires_payment: false })
    res.cookies.set('ubsession', `${user.id}:${sessionToken}`, cookieOpts)
    return res
  }

  // For paid plans — generate PIX
  const amount = PLAN_PRICES[plan_type]
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
        identifier: `saas-${user.id}-${Date.now()}`,
        amount,
        callbackUrl: `${baseUrl}/api/saas/billing-webhook`,
        client: { name: user.name, email: user.email, phone: phone ?? '', document: cpf_cnpj ?? undefined },
      }, {
        publicKey: settings.saas_billing_amplopay_public_key,
        secretKey: settings.saas_billing_amplopay_secret_key,
      })
      paymentId = pix.transactionId
      pixCode = pix.pix.code
      pixQr = pix.pix.qrCode
    } else {
      const { createPix: pushinCreatePix } = await import('@/lib/pushinpay')
      const pix = await pushinCreatePix(
        { value: amount, webhookUrl: `${baseUrl}/api/saas/billing-webhook` },
        settings.saas_billing_pushinpay_token
      )
      paymentId = pix.id
      pixCode = pix.qr_code
      pixQr = pix.qr_code_base64 ?? ''
    }

    await supabaseAdmin.from('saas_users').update({
      billing_payment_id: paymentId,
      billing_payment_code: pixCode,
      billing_payment_qr: pixQr,
    }).eq('id', user.id)

    const res = NextResponse.json({
      ok: true,
      requires_payment: true,
      pix_code: pixCode,
      pix_qr: pixQr,
      amount,
    })
    res.cookies.set('ubsession', `${user.id}:${sessionToken}`, cookieOpts)
    return res
  } catch (err) {
    // If PIX generation fails, delete the user and return error
    await supabaseAdmin.from('saas_users').delete().eq('id', user.id)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao gerar pagamento: ${msg}` }, { status: 500 })
  }
}
