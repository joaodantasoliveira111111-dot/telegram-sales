export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/session'
import { BotsList } from './bots-list'

export default async function BotsPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let query = supabaseAdmin
    .from('bots')
    .select('*')
    .order('created_at', { ascending: false })

  if (session?.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  const { data: bots } = await query

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bots</h2>
          <p className="text-sm text-zinc-400">Gerencie seus bots do Telegram</p>
        </div>
      </div>
      <BotsList initialBots={bots ?? []} />
    </div>
  )
}
