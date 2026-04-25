export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, CreditCard, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

async function getStats() {
  const [bots, payments, subscriptions, revenue] = await Promise.all([
    supabaseAdmin.from('bots').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('payments').select('plan:plans(price)').eq('status', 'paid'),
  ])

  const totalRevenue = (revenue.data ?? []).reduce((acc, p) => {
    const price = (p.plan as unknown as { price: number } | null)?.price ?? 0
    return acc + Number(price)
  }, 0)

  return {
    bots: bots.count ?? 0,
    paidPayments: payments.count ?? 0,
    activeSubscriptions: subscriptions.count ?? 0,
    totalRevenue,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const cards = [
    { title: 'Bots Ativos', value: stats.bots, icon: Bot, color: 'text-blue-400' },
    { title: 'Pagamentos Aprovados', value: stats.paidPayments, icon: CreditCard, color: 'text-green-400' },
    { title: 'Assinaturas Ativas', value: stats.activeSubscriptions, icon: Users, color: 'text-purple-400' },
    { title: 'Receita Total', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-yellow-400' },
  ]

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-zinc-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
