export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { GroupsClient } from './groups-client'

export default async function GroupsPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botIds: string[] | null = null
  if (session?.type === 'user') {
    botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      return <GroupsClient initialGroups={[]} bots={[]} connectedAccount={null} />
    }
  }

  let botsQ = supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true)
  if (botIds !== null) {
    botsQ = botsQ.in('id', botIds)
  }

  const [{ data: groups }, { data: bots }, { data: telegramSession }] = await Promise.all([
    supabaseAdmin.from('telegram_groups').select('*').order('created_at', { ascending: false }),
    botsQ,
    supabaseAdmin.from('telegram_sessions').select('account_name, phone').eq('status', 'connected').maybeSingle(),
  ])

  return (
    <GroupsClient
      initialGroups={groups ?? []}
      bots={bots ?? []}
      connectedAccount={telegramSession ?? null}
    />
  )
}
