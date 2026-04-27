export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { GroupsClient } from './groups-client'

export default async function GroupsPage() {
  const [{ data: groups }, { data: bots }, { data: session }] = await Promise.all([
    supabaseAdmin.from('telegram_groups').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true),
    supabaseAdmin.from('telegram_sessions').select('account_name, phone').eq('status', 'connected').maybeSingle(),
  ])

  return (
    <GroupsClient
      initialGroups={groups ?? []}
      bots={bots ?? []}
      connectedAccount={session ?? null}
    />
  )
}
