export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/session'
import { AccountStockList } from './account-stock-list'

async function getData() {
  const [accounts, bots, plans] = await Promise.all([
    supabaseAdmin
      .from('account_stocks')
      .select('*, bot:bots(name), plan:plans(name)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true),
    supabaseAdmin.from('plans').select('id, name, bot_id'),
  ])

  const all = accounts.data ?? []

  const stats = {
    available: all.filter((a) => a.status === 'available').length,
    delivered: all.filter((a) => a.status === 'delivered').length,
    blocked: all.filter((a) => a.status === 'blocked').length,
    total: all.length,
  }

  // Find plans with low stock (< 5 available)
  const planMap: Record<string, { name: string; available: number }> = {}
  for (const a of all) {
    if (!a.plan_id) continue
    const planName = (a.plan as { name: string } | null)?.name ?? a.plan_id
    if (!planMap[a.plan_id]) planMap[a.plan_id] = { name: planName, available: 0 }
    if (a.status === 'available') planMap[a.plan_id].available++
  }
  const lowStockPlans = Object.values(planMap).filter((p) => p.available < 5 && p.available >= 0)

  return {
    accounts: all,
    stats,
    lowStockPlans,
    bots: bots.data ?? [],
    plans: plans.data ?? [],
  }
}

export default async function AccountStockPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)
  if (session?.type === 'user') redirect('/dashboard')

  const { accounts, stats, lowStockPlans, bots, plans } = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Estoque de Contas</h2>
        <p className="text-sm text-zinc-500">Gerencie logins e senhas entregues automaticamente após pagamento</p>
      </div>
      <AccountStockList
        initialAccounts={accounts}
        stats={stats}
        lowStockPlans={lowStockPlans}
        bots={bots}
        plans={plans}
      />
    </div>
  )
}
