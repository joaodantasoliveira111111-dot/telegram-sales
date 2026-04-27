export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getPeriodRange } from '@/lib/utils'
import { TrendingUp, ShoppingBag, DollarSign, Bot } from 'lucide-react'
import { PeriodSelector } from '@/components/period-selector'

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

async function getData(period: string) {
  const { since, until } = getPeriodRange(period)

  function addUntil<T extends { lt: (col: string, val: string) => T }>(q: T): T {
    return until ? q.lt('created_at', until) : q
  }

  const [paidPayments, allPayments, telegramUsers, bots] = await Promise.all([
    addUntil(
      supabaseAdmin
        .from('payments')
        .select('plan_id, bot_id, created_at, plan_name, plan_price, plan:plans(name, price)')
        .eq('status', 'paid')
        .gte('created_at', since)
    ),
    addUntil(
      supabaseAdmin
        .from('payments')
        .select('plan_id, bot_id, status')
        .gte('created_at', since)
    ),
    addUntil(
      supabaseAdmin
        .from('telegram_users')
        .select('bot_id')
        .gte('created_at', since)
    ),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true),
  ])

  const paid = paidPayments.data ?? []
  const all = allPayments.data ?? []
  const users = telegramUsers.data ?? []
  const botList = bots.data ?? []

  const totalRevenue = paid.reduce((acc, p) => {
    const price = (p.plan as unknown as { price: number } | null)?.price ?? (p as unknown as { plan_price: number }).plan_price ?? 0
    return acc + Number(price)
  }, 0)
  const totalSales = paid.length
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  const planMap: Record<string, { name: string; revenue: number; sales: number }> = {}
  for (const p of paid) {
    const id = (p.plan_id ?? 'deleted') as string
    const snap = p as unknown as { plan_name?: string; plan_price?: number }
    const name = (p.plan as unknown as { name: string } | null)?.name ?? snap.plan_name ?? '(plano excluído)'
    const price = Number((p.plan as unknown as { price: number } | null)?.price ?? snap.plan_price ?? 0)
    if (!planMap[id]) planMap[id] = { name, revenue: 0, sales: 0 }
    planMap[id].revenue += price
    planMap[id].sales++
  }
  const byPlan = Object.values(planMap).sort((a, b) => b.revenue - a.revenue)
  const maxRevenue = byPlan[0]?.revenue ?? 1

  const botUserMap: Record<string, number> = {}
  for (const u of users) {
    const id = u.bot_id as string
    botUserMap[id] = (botUserMap[id] ?? 0) + 1
  }

  const botCheckoutMap: Record<string, number> = {}
  const botSalesMap: Record<string, number> = {}
  for (const p of all) {
    const id = p.bot_id as string
    botCheckoutMap[id] = (botCheckoutMap[id] ?? 0) + 1
  }
  for (const p of paid) {
    const id = p.bot_id as string
    botSalesMap[id] = (botSalesMap[id] ?? 0) + 1
  }

  const conversionByBot = botList.map((bot) => {
    const started = botUserMap[bot.id] ?? 0
    const checkout = botCheckoutMap[bot.id] ?? 0
    const sales = botSalesMap[bot.id] ?? 0
    const convStart = started > 0 ? ((sales / started) * 100).toFixed(1) : '—'
    const convCheckout = checkout > 0 ? ((sales / checkout) * 100).toFixed(1) : '—'
    return { ...bot, started, checkout, sales, convStart, convCheckout }
  }).sort((a, b) => b.sales - a.sales)

  const topProducts = [...byPlan].sort((a, b) => b.sales - a.sales)

  return { totalRevenue, totalSales, avgTicket, byPlan, maxRevenue, conversionByBot, topProducts }
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { period: periodParam } = await searchParams
  const period = periodParam ?? '30d'
  const { totalRevenue, totalSales, avgTicket, byPlan, maxRevenue, conversionByBot, topProducts } = await getData(period)

  const summaryCards = [
    { title: 'Receita Total', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10', topBorder: 'border-t-emerald-500' },
    { title: 'Vendas', value: String(totalSales), icon: ShoppingBag, color: 'text-blue-400', iconBg: 'bg-blue-500/10', topBorder: 'border-t-blue-500' },
    { title: 'Ticket Médio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'text-violet-400', iconBg: 'bg-violet-500/10', topBorder: 'border-t-violet-500' },
    { title: 'Planos com venda', value: String(byPlan.length), icon: Bot, color: 'text-orange-400', iconBg: 'bg-orange-500/10', topBorder: 'border-t-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Relatórios</h2>
          <p className="text-sm text-zinc-500">Análise de receita, conversão e produtos</p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map(({ title, value, icon: Icon, color, iconBg, topBorder }) => (
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by plan */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-zinc-100">Receita por Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {byPlan.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">Nenhuma venda no período</p>
            ) : byPlan.map((plan) => (
              <div key={plan.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="truncate text-zinc-300">{plan.name}</span>
                  <div className="ml-3 flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-500">{plan.sales} vendas</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(plan.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.round((plan.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-zinc-100">Top Produtos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">Nenhuma venda no período</p>
            ) : (
              <div className="space-y-2">
                {topProducts.slice(0, 8).map((plan, i) => (
                  <div key={plan.name} className="flex items-center gap-3 rounded-xl bg-zinc-800/40 px-3 py-2.5">
                    <span className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-zinc-600/40 text-zinc-300' :
                      i === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-zinc-700/40 text-zinc-500',
                    ].join(' ')}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm text-zinc-200">{plan.name}</span>
                    <Badge variant="secondary">{plan.sales} vendas</Badge>
                    <span className="shrink-0 text-sm font-semibold text-emerald-400">{formatCurrency(plan.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion by bot */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-zinc-100">Taxa de Conversão por Bot</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Bot</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Iniciaram</th>
                  <th className="hidden px-5 py-3 text-right text-xs font-medium text-zinc-500 sm:table-cell">Clicaram</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Pagaram</th>
                  <th className="hidden px-5 py-3 text-right text-xs font-medium text-zinc-500 sm:table-cell">Conv. Início</th>
                  <th className="hidden px-5 py-3 text-right text-xs font-medium text-zinc-500 md:table-cell">Conv. Checkout</th>
                </tr>
              </thead>
              <tbody>
                {conversionByBot.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-600">Nenhum dado no período</td></tr>
                ) : conversionByBot.map((bot) => (
                  <tr key={bot.id} className="border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/20">
                    <td className="px-5 py-3.5 font-medium text-zinc-200">{bot.name}</td>
                    <td className="px-5 py-3.5 text-right text-zinc-400">{bot.started}</td>
                    <td className="hidden px-5 py-3.5 text-right text-zinc-400 sm:table-cell">{bot.checkout}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-400">{bot.sales}</td>
                    <td className="hidden px-5 py-3.5 text-right sm:table-cell">
                      <span className={bot.convStart !== '—' && Number(bot.convStart) >= 5 ? 'font-medium text-emerald-400' : 'text-zinc-500'}>
                        {bot.convStart !== '—' ? `${bot.convStart}%` : '—'}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-right md:table-cell">
                      <span className={bot.convCheckout !== '—' && Number(bot.convCheckout) >= 20 ? 'font-medium text-emerald-400' : 'text-zinc-500'}>
                        {bot.convCheckout !== '—' ? `${bot.convCheckout}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
