import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.type !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { pix_key?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { pix_key } = body
  if (!pix_key?.trim()) return NextResponse.json({ error: 'Chave PIX é obrigatória' }, { status: 400 })

  // Confirm user is on FlowBot marketplace (no own gateway configured)
  const { data: user } = await supabaseAdmin
    .from('saas_users')
    .select('gateway_type')
    .eq('id', session.userId!)
    .single()

  if (user?.gateway_type) {
    return NextResponse.json({ error: 'Saque disponível apenas para usuários usando o gateway FlowBot' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('withdrawal_requests')
    .insert({ saas_user_id: session.userId!, pix_key: pix_key.trim(), status: 'pending' })

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Funcionalidade em implantação. Tente novamente em breve.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Erro ao solicitar saque' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
