import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createConnectedClient } from '@/lib/telegram-client'
import { getSessionFromRequest } from '@/lib/session'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabaseAdmin
    .from('telegram_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (session.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, title, description, photo_url } = body

  if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  let client
  let chatId = ''
  let inviteLink = ''

  try {
    client = await createConnectedClient(session.type === 'user' ? session.userId : undefined)
    const { Api } = await import('telegram')

    if (type === 'channel') {
      const result = await client.invoke(new Api.channels.CreateChannel({
        title,
        about: description ?? '',
        broadcast: true,
        megagroup: false,
      })) as { chats?: Array<{ id?: { valueOf(): string } }> }
      const chat = result.chats?.[0]
      if (chat) {
        const rawId = chat.id?.valueOf?.() ?? ''
        chatId = `-100${rawId}`
        try {
          const linkResult = await client.invoke(new Api.messages.ExportChatInvite({
            peer: await client.getEntity(chatId),
          })) as { link?: string }
          inviteLink = linkResult.link ?? ''
        } catch { /* ignore */ }
        if (photo_url) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const file = await client.downloadFile(new Api.InputWebFileLocation({ url: photo_url, accessHash: BigInt(0) as any }) as any, { dcId: 1 })
            await client.invoke(new Api.channels.EditPhoto({ channel: await client.getEntity(chatId), photo: file as unknown as never }))
          } catch { /* ignore */ }
        }
      }
    } else {
      const result = await client.invoke(new Api.messages.CreateChat({ users: [], title })) as { chats?: Array<{ id?: { valueOf(): string } }> }
      const chat = result.chats?.[0]
      if (chat) {
        const rawId = chat.id?.valueOf?.() ?? ''
        chatId = `-${rawId}`
        if (description) {
          try {
            await client.invoke(new Api.messages.EditChatAbout({ peer: await client.getEntity(chatId), about: description }))
          } catch { /* ignore */ }
        }
        try {
          const linkResult = await client.invoke(new Api.messages.ExportChatInvite({ peer: await client.getEntity(chatId) })) as { link?: string }
          inviteLink = linkResult.link ?? ''
        } catch { /* ignore */ }
      }
    }

    await client.disconnect()
  } catch (err: unknown) {
    if (client) { try { await (client as { disconnect: () => Promise<void> }).disconnect() } catch {} }
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('telegram_groups')
    .insert({
      type: type ?? 'group',
      title,
      description: description ?? '',
      telegram_chat_id: chatId,
      invite_link: inviteLink,
      photo_url: photo_url ?? '',
      saas_user_id: session.type === 'user' ? session.userId : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
