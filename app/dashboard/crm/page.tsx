export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { CrmClient } from './crm-client'

export default async function CrmPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botsQ = supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name')
  if (session?.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return <CrmClient bots={[]} />
    botsQ = botsQ.in('id', botIds)
  }

  const { data: bots } = await botsQ
  return <CrmClient bots={bots ?? []} />
}
