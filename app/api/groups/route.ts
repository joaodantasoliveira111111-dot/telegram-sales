import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createConnectedClient, sleep } from '@/lib/telegram-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('telegram_groups')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, title, description, photo_url } = body

  if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  let client
  let chatId = ''
  let inviteLink = ''

  try {
    client = await createConnectedClient()
    const { Api } = await import('telegram')

    if (type === 'channel') {
      // Create channel (broadcast)
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
        // Generate invite link
        try {
          const linkResult = await client.invoke(new Api.messages.ExportChatInvite({
            peer: await client.getEntity(chatId),
          })) as { link?: string }
          inviteLink = linkResult.link ?? ''
        } catch { /* ignore */ }
        // Set photo if provided
        if (photo_url) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const file = await client.downloadFile(new Api.InputWebFileLocation({
              url: photo_url,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              accessHash: BigInt(0) as any,
            }) as any, { dcId: 1 })
            await client.invoke(new Api.channels.EditPhoto({
              channel: await client.getEntity(chatId),
              // @ts-expect-error: dynamic upload
              photo: file,
            }))
          } catch { /* ignore photo upload errors */ }
        }
      }
    } else {
      // Create supergroup
      const result = await client.invoke(new Api.messages.CreateChat({
        users: [],
        title,
      })) as { chats?: Array<{ id?: { valueOf(): string } }> }
      const chat = result.chats?.[0]
      if (chat) {
        const rawId = chat.id?.valueOf?.() ?? ''
        chatId = `-${rawId}`
        // Set description
        if (description) {
          try {
            await client.invoke(new Api.messages.EditChatAbout({
              peer: await client.getEntity(chatId),
              about: description,
            }))
          } catch { /* ignore */ }
        }
        // Invite link
        try {
          const linkResult = await client.invoke(new Api.messages.ExportChatInvite({
            peer: await client.getEntity(chatId),
          })) as { link?: string }
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
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
