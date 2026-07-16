import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

async function assertOwnsPost(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, id: string) {
  const { data: post } = await supabaseAdmin.from('scheduled_posts').select('bot_id').eq('id', id).single()
  if (!post) return { ok: false as const, status: 404, error: 'Post não encontrado' }
  if (session.type === 'admin') return { ok: true as const }
  const botIds = await getUserBotIds(session.userId!)
  if (!botIds.includes(post.bot_id)) return { ok: false as const, status: 403, error: 'Forbidden' }
  return { ok: true as const }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsPost(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const { error } = await supabaseAdmin.from('scheduled_posts').delete().eq('id', id).eq('status', 'pending')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsPost(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const body = await request.json()
  const allowed = ['message_text', 'media_url', 'media_type', 'scheduled_at', 'chat_title']
  const update: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) update[k] = body[k] }
  const { data, error } = await supabaseAdmin.from('scheduled_posts').update(update).eq('id', id).eq('status', 'pending').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
