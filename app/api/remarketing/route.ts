import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const botId = searchParams.get('bot_id')

  let query = supabaseAdmin
    .from('remarketing_sequences')
    .select('*, steps:remarketing_steps(*)')
    .order('created_at', { ascending: false })

  if (session.type === 'user') {
    query = query.eq('bot_id', botId ?? '') // must supply bot_id
  }
  if (botId) query = query.eq('bot_id', botId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { bot_id, name, trigger, is_active = true, steps } = body

  if (!bot_id || !name || !trigger) {
    return NextResponse.json({ error: 'bot_id, name e trigger são obrigatórios' }, { status: 400 })
  }
  if (!['no_payment', 'no_interaction'].includes(trigger)) {
    return NextResponse.json({ error: 'trigger inválido' }, { status: 400 })
  }

  const { data: seq, error } = await supabaseAdmin
    .from('remarketing_sequences')
    .insert({ bot_id, name, trigger, is_active })
    .select()
    .single()

  if (error || !seq) return NextResponse.json({ error: error?.message ?? 'Erro ao criar sequência' }, { status: 500 })

  if (Array.isArray(steps) && steps.length > 0) {
    const rows = steps.map((s: { delay_hours: number; message_text: string }, i: number) => ({
      sequence_id: seq.id,
      position: i,
      delay_hours: s.delay_hours,
      message_text: s.message_text,
    }))
    await supabaseAdmin.from('remarketing_steps').insert(rows)
  }

  return NextResponse.json(seq)
}
