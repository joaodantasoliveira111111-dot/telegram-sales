import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const { phone } = await request.json()

  if (!phone) {
    return NextResponse.json({ error: 'Número de telefone é obrigatório' }, { status: 400 })
  }

  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH

  if (!apiId || !apiHash) {
    return NextResponse.json(
      { error: 'TELEGRAM_API_ID e TELEGRAM_API_HASH não configurados no ambiente' },
      { status: 500 }
    )
  }

  try {
    // Dynamically import gramjs to avoid edge runtime issues
    const { TelegramClient } = await import('telegram')
    const { StringSession } = await import('telegram/sessions')

    const session = new StringSession('')
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 3,
    })

    await client.connect()

    const result = await client.sendCode(
      { apiId, apiHash },
      phone
    )

    const sessionString = String(client.session.save())

    await client.disconnect()

    // Upsert session record
    await supabaseAdmin
      .from('telegram_sessions')
      .upsert({
        phone,
        phone_code_hash: result.phoneCodeHash,
        session_string: sessionString,
        status: 'pending_code',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' })

    return NextResponse.json({ ok: true, message: 'Código enviado para seu Telegram!' })
  } catch (err: unknown) {
    console.error('[Telegram Connect] request-code error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao solicitar código: ${msg}` }, { status: 500 })
  }
}
