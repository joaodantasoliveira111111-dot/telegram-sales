export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { TelegramConnectClient } from './telegram-connect-client'

export default async function TelegramConnectPage() {
  const { data: session } = await supabaseAdmin
    .from('telegram_sessions')
    .select('phone, status, account_name, account_username, updated_at')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasApiKeys = !!(process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH)

  return (
    <TelegramConnectClient
      initialSession={session ?? null}
      hasApiKeys={hasApiKeys}
    />
  )
}
