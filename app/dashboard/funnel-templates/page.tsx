export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { FUNNEL_TEMPLATES } from '@/lib/funnel-templates'
import { FunnelTemplatesClient } from './funnel-templates-client'

export default async function FunnelTemplatesPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botsQuery = supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name')

  if (session?.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return <FunnelTemplatesClient templates={FUNNEL_TEMPLATES} bots={[]} />
    botsQuery = botsQuery.in('id', botIds)
  }

  const { data: bots } = await botsQuery
  return <FunnelTemplatesClient templates={FUNNEL_TEMPLATES} bots={bots ?? []} />
}
