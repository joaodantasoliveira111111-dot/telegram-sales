import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createConnectedClient } from '@/lib/telegram-client'

export const runtime = 'nodejs'
export const maxDuration = 30

// Send message to a group/channel OR via a bot token to a specific chat_id
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { target, chatId, message, parse_html, via_bot_id } = body

  if (!message) return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })

  // Option A: send via connected account (to group/channel)
  if (target === 'account' && chatId) {
    let client
    try {
      client = await createConnectedClient()
      await client.sendMessage(chatId, {
        message,
        parseMode: parse_html ? 'html' : undefined,
      })
      await client.disconnect()
      return NextResponse.json({ ok: true })
    } catch (err: unknown) {
      if (client) { try { await (client as { disconnect: () => Promise<void> }).disconnect() } catch {} }
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // Option B: send via bot token
  if (via_bot_id && chatId) {
    const { data: bot } = await supabaseAdmin
      .from('bots')
      .select('telegram_token')
      .eq('id', via_bot_id)
      .single()

    if (!bot) return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 })

    const res = await fetch(`https://api.telegram.org/bot${bot.telegram_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
    const data = await res.json()
    if (!data.ok) return NextResponse.json({ error: data.description }, { status: 422 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
}
