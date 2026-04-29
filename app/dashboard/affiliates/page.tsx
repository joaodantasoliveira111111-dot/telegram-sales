export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { AffiliatesClient } from './affiliates-client'

export default async function AffiliatesPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botIds: string[] | null = null
  if (session?.type === 'user') {
    botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      return <AffiliatesClient initialAffiliates={[]} bots={[]} baseUrl={baseUrl} />
    }
  }

  let affiliatesQ = supabaseAdmin.from('affiliates').select('*').order('created_at', { ascending: false })
  let botsQ = supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name')

  if (botIds !== null) {
    affiliatesQ = affiliatesQ.in('bot_id', botIds)
    botsQ = botsQ.in('id', botIds)
  }

  const [{ data: affiliates }, { data: bots }] = await Promise.all([affiliatesQ, botsQ])
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return <AffiliatesClient initialAffiliates={affiliates ?? []} bots={bots ?? []} baseUrl={baseUrl} />
}
