export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/session'
import { TelegramConnectClient } from './telegram-connect-client'

export default async function TelegramConnectPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  if (session?.type === 'user') redirect('/dashboard')

  const { data: sessionData } = await supabaseAdmin
    .from('telegram_sessions')
    .select('phone, status, account_name, account_username, updated_at')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasApiKeys = !!(process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH)

  return (
    <TelegramConnectClient
      initialSession={sessionData ?? null}
      hasApiKeys={hasApiKeys}
    />
  )
}
