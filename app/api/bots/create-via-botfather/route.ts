import { NextRequest, NextResponse } from 'next/server'
import { createConnectedClient, sleep } from '@/lib/telegram-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const { botName, botUsername } = await request.json()

  if (!botName || !botUsername) {
    return NextResponse.json({ error: 'Nome e username são obrigatórios' }, { status: 400 })
  }

  // Ensure username ends with 'bot'
  const username = botUsername.toLowerCase().endsWith('bot')
    ? botUsername
    : `${botUsername}bot`

  let client
  try {
    client = await createConnectedClient()

    // Step 1: /newbot
    await client.sendMessage('BotFather', { message: '/newbot' })
    await sleep(2000)

    // Step 2: send display name
    await client.sendMessage('BotFather', { message: botName })
    await sleep(2000)

    // Step 3: send username
    await client.sendMessage('BotFather', { message: username })
    await sleep(3500)

    // Read BotFather's last messages to find the token
    const { Api } = await import('telegram')
    const botFatherEntity = await client.getEntity('@BotFather')
    const messages = await client.getMessages(botFatherEntity, { limit: 6 })

    let token: string | null = null
    let errorMsg: string | null = null

    for (const msg of messages) {
      const text = (msg as { message?: string }).message ?? ''
      // Match token pattern: digits:alphanumeric
      const match = text.match(/(\d{8,12}:[A-Za-z0-9_-]{35,})/)
      if (match) {
        token = match[1]
        break
      }
      // Check for common errors
      if (text.includes('Sorry') || text.includes('username is already taken') || text.includes('invalid')) {
        errorMsg = text.split('\n')[0]
      }
    }

    await client.disconnect()

    if (!token) {
      return NextResponse.json({
        error: errorMsg ?? 'Não foi possível obter o token. O username pode já estar em uso.',
      }, { status: 422 })
    }

    return NextResponse.json({ token, username })
  } catch (err: unknown) {
    if (client) {
      try { await (client as { disconnect: () => Promise<void> }).disconnect() } catch {}
    }
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
