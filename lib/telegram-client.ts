import { supabaseAdmin } from './supabase'

export async function getConnectedSession() {
  const { data } = await supabaseAdmin
    .from('telegram_sessions')
    .select('*')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function createConnectedClient() {
  const session = await getConnectedSession()
  if (!session) throw new Error('Nenhuma conta Telegram conectada. Vá em Conta Telegram e faça login.')

  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH
  if (!apiId || !apiHash) throw new Error('TELEGRAM_API_ID / TELEGRAM_API_HASH não configurados.')

  const { TelegramClient } = await import('telegram')
  const { StringSession } = await import('telegram/sessions')

  const client = new TelegramClient(new StringSession(session.session_string), apiId, apiHash, {
    connectionRetries: 3,
  })
  await client.connect()
  return client
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
