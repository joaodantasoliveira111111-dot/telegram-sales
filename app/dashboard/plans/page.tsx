export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { PlansList } from './plans-list'

export default async function PlansPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botIds: string[] = []
  if (session?.type === 'user') {
    botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Planos</h2>
            <p className="text-sm text-zinc-400">Crie planos de venda para seus bots</p>
          </div>
          <PlansList initialPlans={[]} bots={[]} />
        </div>
      )
    }
  }

  let plansQuery = supabaseAdmin.from('plans').select('*, bot:bots(name)').order('created_at', { ascending: false })
  let botsQuery = supabaseAdmin.from('bots').select('id, name').eq('is_active', true)

  if (session?.type === 'user') {
    plansQuery = plansQuery.in('bot_id', botIds)
    botsQuery = botsQuery.in('id', botIds)
  }

  const [{ data: plans }, { data: bots }] = await Promise.all([plansQuery, botsQuery])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Planos</h2>
        <p className="text-sm text-zinc-400">Crie planos de venda para seus bots</p>
      </div>
      <PlansList initialPlans={plans ?? []} bots={bots ?? []} />
    </div>
  )
}
