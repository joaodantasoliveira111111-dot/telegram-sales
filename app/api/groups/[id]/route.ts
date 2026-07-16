import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createConnectedClient } from '@/lib/telegram-client'
import { getSessionFromRequest } from '@/lib/session'

export const runtime = 'nodejs'
export const maxDuration = 60

async function assertOwnsGroup(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, id: string) {
  const { data: group } = await supabaseAdmin.from('telegram_groups').select('saas_user_id').eq('id', id).single()
  if (!group) return { ok: false as const, status: 404, error: 'Grupo não encontrado' }
  if (session.type === 'admin') return { ok: true as const }
  if (group.saas_user_id !== session.userId) return { ok: false as const, status: 403, error: 'Forbidden' }
  return { ok: true as const }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsGroup(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const body = await request.json()

  // Fetch current group for chat_id
  const { data: group } = await supabaseAdmin
    .from('telegram_groups')
    .select('telegram_chat_id, type')
    .eq('id', id)
    .single()

  // If we have a chat_id and Telegram changes, apply them via MTProto
  if (group?.telegram_chat_id) {
    let client
    try {
      client = await createConnectedClient()
      const { Api } = await import('telegram')
      const peer = await client.getEntity(group.telegram_chat_id)

      if (body.title) {
        if (group.type === 'channel') {
          await client.invoke(new Api.channels.EditTitle({ channel: peer, title: body.title }))
        } else {
          await client.invoke(new Api.messages.EditChatTitle({ chatId: peer as never, title: body.title }))
        }
      }
      if (body.description !== undefined) {
        await client.invoke(new Api.messages.EditChatAbout({ peer, about: body.description }))
      }
      await client.disconnect()
    } catch (err) {
      if (client) { try { await (client as { disconnect: () => Promise<void> }).disconnect() } catch {} }
      console.error('[Groups PATCH] Telegram error:', err)
    }
  }

  const allowed = ['title', 'description', 'photo_url', 'invite_link', 'member_count']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('telegram_groups')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsGroup(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const { error } = await supabaseAdmin.from('telegram_groups').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
