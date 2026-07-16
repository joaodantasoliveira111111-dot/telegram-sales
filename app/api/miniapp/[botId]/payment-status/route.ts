import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Lightweight polling endpoint the Mini App checkout screen calls while
// waiting for the Pix to be confirmed by the payment webhook.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  const paymentId = request.nextUrl.searchParams.get('payment_id')
  if (!paymentId) return NextResponse.json({ error: 'payment_id é obrigatório' }, { status: 400 })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .eq('bot_id', botId)
    .single()

  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
  return NextResponse.json({ status: payment.status })
}
