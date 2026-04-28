import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('scheduled_posts').delete().eq('id', id).eq('status', 'pending')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const allowed = ['message_text', 'media_url', 'media_type', 'scheduled_at', 'chat_title']
  const update: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) update[k] = body[k] }
  const { data, error } = await supabaseAdmin.from('scheduled_posts').update(update).eq('id', id).eq('status', 'pending').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
