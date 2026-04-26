export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/revenue-chart'
import { Bot, CreditCard, TrendingUp, Users, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaymentStatus } from '@/types'

const statusConfig: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  paid: { label: 'Pago', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'secondary' },
  chargeback: { label: 'Chargeback', variant: 'destructive' },
}

async function getStats() {
  const [bots, payments, subscriptions, revenue, recentPayments] = await Promise.all([
    supabaseAdmin.from('bots').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('payments').select('plan:plans(price)').eq('status', 'paid'),
    supabaseAdmin
      .from('payments')
      .select('*, plan:plans(name, price), bot:bots(name)')
      .order('created_at', { ascending: false })
      .limit(5),
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
    recentPayments: recentPayments.data ?? [],
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const cards = [
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'from-green-500/10 to-transparent',
      border: 'border-green-500/20',
    },
    {
      title: 'Vendas Aprovadas',
      value: stats.paidPayments,
      icon: CreditCard,
      color: 'text-blue-400',
      bg: 'from-blue-500/10 to-transparent',
      border: 'border-blue-500/20',
    },
    {
      title: 'Assinantes Ativos',
      value: stats.activeSubscriptions,
      icon: Users,
      color: 'text-purple-400',
      bg: 'from-purple-500/10 to-transparent',
      border: 'border-purple-500/20',
    },
    {
      title: 'Bots Ativos',
      value: stats.bots,
      icon: Bot,
      color: 'text-orange-400',
      bg: 'from-orange-500/10 to-transparent',
      border: 'border-orange-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-500">Visão geral do seu negócio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, color, bg, border }) => (
          <Card key={title} className={`border ${border} bg-gradient-to-br ${bg} bg-zinc-900/80`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
              <div className={`rounded-lg bg-zinc-800/80 p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-zinc-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Recent Payments */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base text-zinc-100">Últimas Vendas</CardTitle>
          <a
            href="/dashboard/payments"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Telegram ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((p) => {
                  const status = p.status as PaymentStatus
                  const cfg = statusConfig[status] ?? { label: status, variant: 'outline' as const }
                  return (
                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-zinc-400">{p.telegram_id}</td>
                      <td className="px-6 py-3 text-zinc-300">
                        {(p.plan as { name: string } | null)?.name ?? '—'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-green-400">
                        {formatCurrency((p.plan as { price: number } | null)?.price ?? 0)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="px-6 py-3 text-zinc-500 text-xs">{formatDate(p.created_at)}</td>
                    </tr>
                  )
                })}
                {stats.recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-600">
                      Nenhuma venda ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
