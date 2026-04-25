export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { PlansList } from './plans-list'

export default async function PlansPage() {
  const [{ data: plans }, { data: bots }] = await Promise.all([
    supabaseAdmin
      .from('plans')
      .select('*, bot:bots(name)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true),
  ])

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
