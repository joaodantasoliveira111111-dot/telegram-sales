import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createConnectedClient } from '@/lib/telegram-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('telegram_groups').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
