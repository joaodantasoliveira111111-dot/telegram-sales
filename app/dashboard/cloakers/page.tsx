export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { CloakerClient } from './cloaker-client'

export default async function CloakersPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botIds: string[] | null = null
  if (session?.type === 'user') {
    botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      return <CloakerClient initialCloakers={[]} bots={[]} baseUrl={baseUrl} />
    }
  }

  let cloakersQ = supabaseAdmin.from('cloakers').select('*, bot:bots(id, name)').order('created_at', { ascending: false })
  let botsQ = supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name')

  if (botIds !== null) {
    cloakersQ = cloakersQ.in('bot_id', botIds)
    botsQ = botsQ.in('id', botIds)
  }

  const [{ data: cloakers }, { data: bots }] = await Promise.all([cloakersQ, botsQ])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  return (
    <CloakerClient
      initialCloakers={cloakers ?? []}
      bots={bots ?? []}
      baseUrl={baseUrl}
    />
  )
}
