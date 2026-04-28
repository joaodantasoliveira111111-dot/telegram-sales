import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAdmin(request: NextRequest): boolean {
  const session = request.cookies.get('tgsession')?.value
  const secret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  return session === secret
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { amount } = await request.json()
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('saas_users')
    .select('payout_pending, payout_total_released')
    .eq('id', id)
    .single()

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('saas_users')
    .update({
      payout_pending: Math.max(0, (user.payout_pending ?? 0) - amount),
      payout_total_released: (user.payout_total_released ?? 0) + amount,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
