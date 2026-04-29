export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { RedirectPageClient } from './redirect-page-client'

export default async function RedirectPagesPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botIds: string[] | null = null
  if (session?.type === 'user') {
    botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
      return <RedirectPageClient initialPages={[]} bots={[]} baseUrl={baseUrl} />
    }
  }

  let pagesQ = supabaseAdmin.from('redirect_pages').select('*').order('created_at', { ascending: false })
  let botsQ = supabaseAdmin.from('bots').select('id, name').order('name')

  if (botIds !== null) {
    pagesQ = pagesQ.in('bot_id', botIds)
    botsQ = botsQ.in('id', botIds)
  }

  const [{ data: pages }, { data: bots }] = await Promise.all([pagesQ, botsQ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''

  return (
    <RedirectPageClient
      initialPages={pages ?? []}
      bots={bots ?? []}
      baseUrl={baseUrl}
    />
  )
}
