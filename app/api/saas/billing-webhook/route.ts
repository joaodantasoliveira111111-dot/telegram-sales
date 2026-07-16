import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'

// Receives payment notifications for SaaS subscription billing
// Called by AmloPay/PushinPay after user pays for their plan
export async function POST(request: NextRequest) {
  const token =
    request.headers.get('x-webhook-token') ??
    request.nextUrl.searchParams.get('token')

  // Accepts either gateway's SaaS-billing-specific token — this single endpoint
  // serves both AmploPay and PushinPay callbacks depending on which gateway is
  // configured for SaaS billing. If neither token is configured, requests are
  // allowed through (matches the lenient default used by the per-gateway routes).
  const settings = await getSettings(['saas_billing_amplopay_webhook_token', 'saas_billing_pushinpay_webhook_token'])
  const amploToken = settings.saas_billing_amplopay_webhook_token
  const pushinToken = settings.saas_billing_pushinpay_webhook_token
  const anyConfigured = !!amploToken || !!pushinToken
  const matches = (amploToken && token === amploToken) || (pushinToken && token === pushinToken)
  if (anyConfigured && !matches) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Support both AmloPay and PushinPay payload shapes
  const transactionId = (body.transactionId ?? body.transaction_id ?? body.id) as string
  const status = ((body.status ?? body.payment_status ?? '') as string).toUpperCase()
  const isPaid = ['COMPLETED', 'PAID', 'APPROVED'].includes(status)

  if (!transactionId) return NextResponse.json({ ok: true })

  // Find user with this billing_payment_id
  const { data: user } = await supabaseAdmin
    .from('saas_users')
    .select('id, plan_type, is_active')
    .eq('billing_payment_id', transactionId)
    .maybeSingle()

  if (!user) return NextResponse.json({ ok: true }) // not a SaaS billing payment

  if (isPaid && !user.is_active) {
    await supabaseAdmin
      .from('saas_users')
      .update({
        is_active: true,
        billing_payment_id: null,
        billing_cycle_start: new Date().toISOString(),
        sales_count_cycle: 0,
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
