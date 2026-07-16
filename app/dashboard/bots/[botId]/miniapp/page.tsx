export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getMe } from '@/lib/telegram'
import { DEFAULT_MINIAPP_CONFIG, MiniAppConfig, Plan } from '@/types'
import { MiniAppClient } from './miniapp-client'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotMiniAppPage({ params }: PageProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('id, name, telegram_token, miniapp_config')
    .eq('id', botId)
    .single()

  if (!bot) notFound()

  const { data: plans } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('bot_id', botId)
    .order('miniapp_sort', { ascending: true })

  const config: MiniAppConfig = {
    ...DEFAULT_MINIAPP_CONFIG,
    store_name: bot.name,
    ...(bot.miniapp_config ?? {}),
  }

  let botUsername = ''
  try {
    const me = await getMe(bot.telegram_token)
    botUsername = me?.result?.username ?? ''
  } catch { /* username stays empty, guide falls back to a placeholder */ }

  return (
    <MiniAppClient
      botId={bot.id}
      botUsername={botUsername}
      initialConfig={config}
      initialPlans={(plans ?? []) as Plan[]}
    />
  )
}
