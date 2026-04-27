import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const { phone, code, password } = await request.json()

  if (!phone || !code) {
    return NextResponse.json({ error: 'Telefone e código são obrigatórios' }, { status: 400 })
  }

  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH

  if (!apiId || !apiHash) {
    return NextResponse.json(
      { error: 'TELEGRAM_API_ID e TELEGRAM_API_HASH não configurados' },
      { status: 500 }
    )
  }

  // Load stored session
  const { data: stored } = await supabaseAdmin
    .from('telegram_sessions')
    .select('*')
    .eq('phone', phone)
    .eq('status', 'pending_code')
    .single()

  if (!stored) {
    return NextResponse.json({ error: 'Sessão não encontrada. Solicite o código novamente.' }, { status: 404 })
  }

  try {
    const { TelegramClient } = await import('telegram')
    const { StringSession } = await import('telegram/sessions')
    const { Api } = await import('telegram')

    const session = new StringSession(stored.session_string)
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 3,
    })

    await client.connect()

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash: stored.phone_code_hash,
          phoneCode: code.trim(),
        })
      )
    } catch (err: unknown) {
      // Handle 2FA
      if (err instanceof Error && err.message.includes('SESSION_PASSWORD_NEEDED')) {
        if (!password) {
          await client.disconnect()
          return NextResponse.json({ requires2FA: true }, { status: 200 })
        }
        const { Api: Api2 } = await import('telegram')
        const srp = await client.invoke(new Api2.account.GetPassword())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const srpCheck = await import('telegram/Password' as any)
        const hash = await srpCheck.computeCheck(srp, password)
        await client.invoke(new Api2.auth.CheckPassword({ password: hash }))
      } else {
        throw err
      }
    }

    // Get account info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const me = await client.getMe() as any
    const accountName = [me?.firstName, me?.lastName].filter(Boolean).join(' ')
    const accountUsername = (me?.username as string) ?? ''

    const finalSession = String(client.session.save())
    await client.disconnect()

    // Save connected session
    await supabaseAdmin
      .from('telegram_sessions')
      .update({
        session_string: finalSession,
        phone_code_hash: '',
        status: 'connected',
        account_name: accountName,
        account_username: accountUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', phone)

    return NextResponse.json({
      ok: true,
      accountName,
      accountUsername,
      message: `Conectado como ${accountName}!`,
    })
  } catch (err: unknown) {
    console.error('[Telegram Connect] verify-code error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao verificar código: ${msg}` }, { status: 500 })
  }
}
