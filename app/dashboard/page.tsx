export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/revenue-chart'
import { ConversionFunnel } from '@/components/conversion-funnel'
import { Bot, CreditCard, TrendingUp, Users, ArrowUpRight, ShoppingBag, Percent } from 'lucide-react'
import { formatCurrency, formatDate, getPeriodRange } from '@/lib/utils'
import { PaymentStatus } from '@/types'
import { PeriodSelector } from '@/components/period-selector'
import { RevenueMilestone } from '@/components/revenue-milestone'

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
  '7d': 'últimos 7 dias',
  '30d': 'este mês',
}

async function getStats(period: string) {
  const { since, until } = getPeriodRange(period)

  function addUntil<T extends { lt: (col: string, val: string) => T }>(q: T): T {
    return until ? q.lt('created_at', until) : q
  }

  const [
    botsRes, revenueRes, paidCountRes, subscriptionsRes,
    recentPaymentsRes, startedRes, initiatedRes, botsListRes,
    allPaymentsRes, usersPerBotRes,
  ] = await Promise.all([
    supabaseAdmin.from('bots').select('id', { count: 'exact', head: true }).eq('is_active', true),
    addUntil(supabaseAdmin.from('payments').select('plan_price, plan:plans(price)').eq('status', 'paid').gte('created_at', since)),
    addUntil(supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid').gte('created_at', since)),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    addUntil(
      supabaseAdmin.from('payments')
        .select('*, plan:plans(name, price), bot:bots(name)')
        .eq('status', 'paid').gte('created_at', since)
        .order('created_at', { ascending: false }).limit(8)
    ),
    addUntil(supabaseAdmin.from('telegram_users').select('id', { count: 'exact', head: true }).gte('created_at', since)),
    addUntil(supabaseAdmin.from('payments').select('id', { count: 'exact', head: true }).gte('created_at', since)),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true),
    addUntil(supabaseAdmin.from('payments').select('bot_id, status').gte('created_at', since)),
    addUntil(supabaseAdmin.from('telegram_users').select('bot_id').gte('created_at', since)),
  ])

  const paid = revenueRes.data ?? []
  const paidCount = paidCountRes.count ?? 0

  const totalRevenue = paid.reduce((acc, p) => {
    const price = (p.plan as unknown as { price: number } | null)?.price
      ?? (p as unknown as { plan_price?: number }).plan_price ?? 0
    return acc + Number(price)
  }, 0)

  const avgTicket = paidCount > 0 ? totalRevenue / paidCount : 0
  const startedCount = startedRes.count ?? 0
  const overallConvPct = startedCount > 0 ? ((paidCount / startedCount) * 100).toFixed(1) : '—'

  // Revenue + sales by plan
  const planMap: Record<string, { name: string; revenue: number; sales: number }> = {}
  for (const p of recentPaymentsRes.data ?? []) {
    // skip — we build from a separate query below
  }
  const allPaidRes = await addUntil(
    supabaseAdmin.from('payments')
      .select('plan_id, plan_name, plan_price, plan:plans(name, price)')
      .eq('status', 'paid').gte('created_at', since)
  )
  for (const p of allPaidRes.data ?? []) {
    const id = (p.plan_id ?? 'deleted') as string
    const snap = p as unknown as { plan_name?: string; plan_price?: number }
    const name = (p.plan as unknown as { name: string } | null)?.name ?? snap.plan_name ?? '(excluído)'
    const price = Number((p.plan as unknown as { price: number } | null)?.price ?? snap.plan_price ?? 0)
    if (!planMap[id]) planMap[id] = { name, revenue: 0, sales: 0 }
    planMap[id].revenue += price
    planMap[id].sales++
  }
  const byPlan = Object.values(planMap).sort((a, b) => b.revenue - a.revenue)
  const maxPlanRevenue = byPlan[0]?.revenue ?? 1

  // Conversion by bot
  const botUserMap: Record<string, number> = {}
  for (const u of usersPerBotRes.data ?? []) {
    const id = u.bot_id as string
    botUserMap[id] = (botUserMap[id] ?? 0) + 1
  }
  const botSalesMap: Record<string, number> = {}
  const botCheckoutMap: Record<string, number> = {}
  for (const p of allPaymentsRes.data ?? []) {
    const id = p.bot_id as string
    botCheckoutMap[id] = (botCheckoutMap[id] ?? 0) + 1
    if (p.status === 'paid') botSalesMap[id] = (botSalesMap[id] ?? 0) + 1
  }
  const conversionByBot = (botsListRes.data ?? []).map((bot) => {
    const s = botUserMap[bot.id] ?? 0
    const ch = botCheckoutMap[bot.id] ?? 0
    const sa = botSalesMap[bot.id] ?? 0
    return {
      ...bot,
      started: s,
      checkouts: ch,
      sales: sa,
      convPct: s > 0 ? ((sa / s) * 100).toFixed(1) : '—',
    }
  }).filter(b => b.started > 0 || b.sales > 0).sort((a, b) => b.sales - a.sales)

  return {
    bots: botsRes.count ?? 0,
    paidPayments: paidCount,
    activeSubscriptions: subscriptionsRes.count ?? 0,
    totalRevenue,
    avgTicket,
    overallConvPct,
    recentPayments: recentPaymentsRes.data ?? [],
    funnel: {
      started: startedCount,
      initiated: initiatedRes.count ?? 0,
      paid: paidCount,
    },
    byPlan: byPlan.slice(0, 6),
    maxPlanRevenue,
    conversionByBot: conversionByBot.slice(0, 6),
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
      sub: periodLabel[period] ?? '',
      icon: TrendingUp,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      topBorder: 'border-t-emerald-500',
    },
    {
      title: 'Vendas Aprovadas',
      value: String(stats.paidPayments),
      sub: 'pagamentos confirmados',
      icon: ShoppingBag,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      topBorder: 'border-t-blue-500',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(stats.avgTicket),
      sub: 'por venda aprovada',
      icon: CreditCard,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      topBorder: 'border-t-violet-500',
    },
    {
      title: 'Conversão Geral',
      value: stats.overallConvPct === '—' ? '—' : `${stats.overallConvPct}%`,
      sub: 'início → pagamento',
      icon: Percent,
      color: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      topBorder: 'border-t-orange-500',
    },
    {
      title: 'Assinantes Ativos',
      value: String(stats.activeSubscriptions),
      sub: 'total ativo agora',
      icon: Users,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      topBorder: 'border-t-cyan-500',
    },
    {
      title: 'Bots Ativos',
      value: String(stats.bots),
      sub: 'em funcionamento',
      icon: Bot,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      topBorder: 'border-t-amber-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Dashboard</h2>
          <p className="text-sm text-zinc-500">Visão geral — {periodLabel[period] ?? period}</p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* Stat cards — 2 cols mobile, 3 cols tablet, 6 cols desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ title, value, sub, icon: Icon, color, iconBg, topBorder }) => (
          <Card key={title} className={`border-t-2 ${topBorder}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-1 mb-2">
                <p className="text-[11px] font-medium text-zinc-500 leading-tight">{title}</p>
                <div className={`shrink-0 rounded-lg p-1.5 ${iconBg}`}>
                  <Icon className={`h-3 w-3 ${color}`} />
                </div>
              </div>
              <p className="text-xl font-black tracking-tight text-zinc-100 leading-none">{value}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue milestone banner */}
      <RevenueMilestone variant="banner" />

      {/* Funnel + Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-100">Funil de Conversão</CardTitle>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{periodLabel[period] ?? period}</span>
            </div>
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

      {/* Revenue by plan + Conversion by bot */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by plan */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-100">Receita por Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byPlan.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda no período</p>
            ) : stats.byPlan.map((plan, i) => {
              const barPct = Math.round((plan.revenue / stats.maxPlanRevenue) * 100)
              const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-orange-400']
              const rankBgs = ['bg-yellow-500/15', 'bg-zinc-500/15', 'bg-orange-500/15']
              return (
                <div key={plan.name}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${rankColors[i] ?? 'text-zinc-600'} ${rankBgs[i] ?? 'bg-zinc-700/30'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-xs text-zinc-300">{plan.name}</span>
                    <span className="text-[11px] text-zinc-500">{plan.sales}×</span>
                    <span className="text-xs font-bold text-emerald-400 shrink-0">{formatCurrency(plan.revenue)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Conversion by bot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-100">Conversão por Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.conversionByBot.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Nenhum dado no período</p>
            ) : stats.conversionByBot.map((bot) => {
              const convNum = bot.convPct === '—' ? 0 : parseFloat(bot.convPct as string)
              const isGood = convNum >= 5
              return (
                <div
                  key={bot.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{bot.name}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {bot.started} iniciaram · {bot.checkouts} checkouts · {bot.sales} vendas
                    </p>
                  </div>
                  <div
                    className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                    style={{
                      background: isGood ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                      color: isGood ? '#34d399' : '#71717a',
                    }}
                  >
                    {bot.convPct === '—' ? '—' : `${bot.convPct}%`}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
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
