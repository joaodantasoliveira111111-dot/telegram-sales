import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, trigger, is_active, steps } = body

  const update: Record<string, unknown> = {}
  if (name !== undefined) update.name = name
  if (trigger !== undefined) update.trigger = trigger
  if (is_active !== undefined) update.is_active = is_active

  if (Object.keys(update).length > 0) {
    await supabaseAdmin.from('remarketing_sequences').update(update).eq('id', id)
  }

  if (Array.isArray(steps)) {
    await supabaseAdmin.from('remarketing_steps').delete().eq('sequence_id', id)
    if (steps.length > 0) {
      const rows = steps.map((s: { delay_hours: number; message_text: string }, i: number) => ({
        sequence_id: id,
        position: i,
        delay_hours: s.delay_hours,
        message_text: s.message_text,
      }))
      await supabaseAdmin.from('remarketing_steps').insert(rows)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // Cancel pending sends first
  await supabaseAdmin.from('remarketing_sends').update({ status: 'cancelled' }).eq('status', 'pending')
    .in('step_id', supabaseAdmin.from('remarketing_steps').select('id').eq('sequence_id', id) as unknown as string[])
  await supabaseAdmin.from('remarketing_sequences').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
