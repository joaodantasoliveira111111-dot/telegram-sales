export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { AccountStockList } from '@/app/dashboard/account-stock/account-stock-list'
import { AccountStock } from '@/types'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotAccountsPage({ params }: PageProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin.from('bots').select('id, name').eq('id', botId).single()
  if (!bot) notFound()

  // Only plans for this bot
  const { data: plans } = await supabaseAdmin
    .from('plans')
    .select('id, name, bot_id')
    .eq('bot_id', botId)
    .eq('content_type', 'account_stock')

  const planIds = (plans ?? []).map((p) => p.id)

  const [{ data: accounts }, statsData] = await Promise.all([
    planIds.length > 0
      ? supabaseAdmin
          .from('account_stock')
          .select('*')
          .in('plan_id', planIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    planIds.length > 0
      ? supabaseAdmin
          .from('account_stock')
          .select('status, plan_id')
          .in('plan_id', planIds)
      : Promise.resolve({ data: [] }),
  ])

  const statsRows = statsData.data ?? []
  const stats = {
    available: statsRows.filter((r) => r.status === 'available').length,
    delivered: statsRows.filter((r) => r.status === 'delivered').length,
    blocked: statsRows.filter((r) => r.status === 'blocked').length,
    total: statsRows.length,
  }

  // Low stock check (< 3 available per plan)
  const byPlan: Record<string, number> = {}
  for (const r of statsRows.filter((r) => r.status === 'available')) {
    byPlan[r.plan_id] = (byPlan[r.plan_id] ?? 0) + 1
  }
  const lowStockPlans = (plans ?? [])
    .filter((p) => (byPlan[p.id] ?? 0) < 3)
    .map((p) => ({ name: p.name, available: byPlan[p.id] ?? 0 }))

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-semibold text-slate-100">Estoque de Contas</h2>
        <p className="text-sm text-slate-500">
          Contas para entrega automática nos planos de <strong>{bot.name}</strong>
        </p>
      </div>
      <AccountStockList
        initialAccounts={(accounts as AccountStock[]) ?? []}
        stats={stats}
        lowStockPlans={lowStockPlans}
        bots={[{ id: bot.id, name: bot.name }]}
        plans={plans ?? []}
      />
    </div>
  )
}
