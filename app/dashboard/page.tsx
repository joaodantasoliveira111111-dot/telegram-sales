export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/revenue-chart'
import { ConversionFunnel } from '@/components/conversion-funnel'
import { Bot, CreditCard, TrendingUp, Users, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatDate, getPeriodRange } from '@/lib/utils'
import { PaymentStatus } from '@/types'
import { PeriodSelector } from '@/components/period-selector'

const statusConfig: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  paid: { label: 'Pago', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'secondary' },
  chargeback: { label: 'Chargeback', variant: 'destructive' },
}

const periodLabel: Record<string, string> = {
  today: 'hoje',
  yesterday: 'ontem',
  '7d': 'nos últimos 7 dias',
  '30d': 'neste mês',
}

async function getStats(period: string) {
  const { since, until } = getPeriodRange(period)

  function addUntil<T extends { lt: (col: string, val: string) => T }>(q: T): T {
    return until ? q.lt('created_at', until) : q
  }

  const [bots, revenue, paidCount, subscriptions, recentPayments, started, initiated] = await Promise.all([
    supabaseAdmin.from('bots').select('id', { count: 'exact', head: true }).eq('is_active', true),
    addUntil(supabaseAdmin.from('payments').select('plan:plans(price)').eq('status', 'paid').gte('created_at', since)),
    addUntil(supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid').gte('created_at', since)),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    addUntil(
      supabaseAdmin
        .from('payments')
        .select('*, plan:plans(name, price), bot:bots(name)')
        .eq('status', 'paid')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5)
    ),
    addUntil(supabaseAdmin.from('telegram_users').select('id', { count: 'exact', head: true }).gte('created_at', since)),
    addUntil(supabaseAdmin.from('payments').select('telegram_id', { count: 'exact', head: true }).gte('created_at', since)),
  ])

  const totalRevenue = (revenue.data ?? []).reduce((acc, p) => {
    const price = (p.plan as unknown as { price: number } | null)?.price ?? 0
    return acc + Number(price)
  }, 0)

  return {
    bots: bots.count ?? 0,
    paidPayments: paidCount.count ?? 0,
    activeSubscriptions: subscriptions.count ?? 0,
    totalRevenue,
    recentPayments: recentPayments.data ?? [],
    funnel: {
      started: started.count ?? 0,
      initiated: initiated.count ?? 0,
      paid: paidCount.count ?? 0,
    },
  }
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { period: periodParam } = await searchParams
  const period = periodParam ?? '30d'
  const stats = await getStats(period)

  const cards = [
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      topBorder: 'border-t-emerald-500',
    },
    {
      title: 'Vendas Aprovadas',
      value: String(stats.paidPayments),
      icon: CreditCard,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      topBorder: 'border-t-blue-500',
    },
    {
      title: 'Assinantes Ativos',
      value: String(stats.activeSubscriptions),
      icon: Users,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      topBorder: 'border-t-violet-500',
    },
    {
      title: 'Bots Ativos',
      value: String(stats.bots),
      icon: Bot,
      color: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      topBorder: 'border-t-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Dashboard</h2>
          <p className="text-sm text-zinc-500">
            Resultados {periodLabel[period] ?? ''}
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, color, iconBg, topBorder }) => (
          <Card key={title} className={`border-t-2 ${topBorder}`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-500">{title}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-100">{value}</p>
                </div>
                <div className={`shrink-0 rounded-xl p-2.5 ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel + Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-100">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionFunnel
              started={stats.funnel.started}
              initiated={stats.funnel.initiated}
              paid={stats.funnel.paid}
            />
          </CardContent>
        </Card>
        <RevenueChart />
      </div>

      {/* Recent sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-100">Últimas Vendas</CardTitle>
          <a
            href="/dashboard/payments"
            className="flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
          >
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Telegram ID</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium text-zinc-500 sm:table-cell">Plano</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Valor</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium text-zinc-500 sm:table-cell">Status</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium text-zinc-500 md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((p) => {
                  const status = p.status as PaymentStatus
                  const cfg = statusConfig[status] ?? { label: status, variant: 'outline' as const }
                  return (
                    <tr key={p.id} className="border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/20">
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">{p.telegram_id}</td>
                      <td className="hidden px-5 py-3.5 text-zinc-300 sm:table-cell">
                        {(p.plan as unknown as { name: string } | null)?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-400">
                        {formatCurrency((p.plan as unknown as { price: number } | null)?.price ?? 0)}
                      </td>
                      <td className="hidden px-5 py-3.5 sm:table-cell">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="hidden px-5 py-3.5 text-xs text-zinc-500 md:table-cell">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  )
                })}
                {stats.recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Nenhuma venda no período selecionado
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
