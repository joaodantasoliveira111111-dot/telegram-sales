export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, ShoppingBag, Users, DollarSign, Bot } from 'lucide-react'
import { PeriodTabs } from './period-tabs'

interface PageProps {
  searchParams: Promise<{ days?: string }>
}

async function getData(days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [paidPayments, allPayments, telegramUsers, bots] = await Promise.all([
    supabaseAdmin
      .from('payments')
      .select('plan_id, bot_id, created_at, plan:plans(name, price)')
      .eq('status', 'paid')
      .gte('created_at', since),
    supabaseAdmin
      .from('payments')
      .select('plan_id, bot_id, status')
      .gte('created_at', since),
    supabaseAdmin
      .from('telegram_users')
      .select('bot_id')
      .gte('created_at', since),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true),
  ])

  const paid = paidPayments.data ?? []
  const all = allPayments.data ?? []
  const users = telegramUsers.data ?? []
  const botList = bots.data ?? []

  // Summary
  const totalRevenue = paid.reduce((acc, p) => acc + Number((p.plan as { price: number } | null)?.price ?? 0), 0)
  const totalSales = paid.length
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  // Revenue + sales by plan
  const planMap: Record<string, { name: string; revenue: number; sales: number }> = {}
  for (const p of paid) {
    const id = p.plan_id as string
    const name = (p.plan as { name: string } | null)?.name ?? 'Sem nome'
    const price = Number((p.plan as { price: number } | null)?.price ?? 0)
    if (!planMap[id]) planMap[id] = { name, revenue: 0, sales: 0 }
    planMap[id].revenue += price
    planMap[id].sales++
  }
  const byPlan = Object.values(planMap).sort((a, b) => b.revenue - a.revenue)
  const maxRevenue = byPlan[0]?.revenue ?? 1

  // Conversion by bot
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

  // Top products (by quantity)
  const topProducts = [...byPlan].sort((a, b) => b.sales - a.sales)

  return { totalRevenue, totalSales, avgTicket, byPlan, maxRevenue, conversionByBot, topProducts }
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { days: daysParam } = await searchParams
  const days = Number(daysParam ?? '30')
  const { totalRevenue, totalSales, avgTicket, byPlan, maxRevenue, conversionByBot, topProducts } = await getData(days)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Relatórios</h2>
          <p className="text-sm text-zinc-500">Análise de receita, conversão e produtos</p>
        </div>
        <Suspense>
          <PeriodTabs />
        </Suspense>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { title: 'Receita Total', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-400', border: 'border-green-500/20', bg: 'from-green-500/10' },
          { title: 'Vendas', value: totalSales, icon: ShoppingBag, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10' },
          { title: 'Ticket Médio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10' },
          { title: 'Planos ativos', value: byPlan.length, icon: Bot, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'from-orange-500/10' },
        ].map(({ title, value, icon: Icon, color, border, bg }) => (
          <Card key={title} className={`border ${border} bg-gradient-to-br ${bg} to-transparent bg-zinc-900/80`}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by plan */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-zinc-100">Receita por Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {byPlan.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda no período</p>
            ) : byPlan.map((plan) => (
              <div key={plan.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{plan.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{plan.sales} vendas</span>
                    <span className="font-bold text-green-400">{formatCurrency(plan.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-700"
                    style={{ width: `${Math.round((plan.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top products by quantity */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-zinc-100">Top Produtos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda no período</p>
            ) : (
              <div className="space-y-2">
                {topProducts.slice(0, 8).map((plan, i) => (
                  <div key={plan.name} className="flex items-center gap-3 rounded-lg bg-zinc-800/40 px-3 py-2.5">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-zinc-600/40 text-zinc-300' :
                      i === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-zinc-700/40 text-zinc-500'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-zinc-200">{plan.name}</span>
                    <Badge variant="secondary">{plan.sales} vendas</Badge>
                    <span className="text-sm font-semibold text-green-400">{formatCurrency(plan.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion by bot */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-zinc-100">Taxa de Conversão por Bot</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Bot</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500">Iniciaram</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500">Clicaram em comprar</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500">Pagaram</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500">Conv. Início</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500">Conv. Checkout</th>
                </tr>
              </thead>
              <tbody>
                {conversionByBot.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-600">Nenhum dado no período</td></tr>
                ) : conversionByBot.map((bot) => (
                  <tr key={bot.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-zinc-200">{bot.name}</td>
                    <td className="px-6 py-3 text-right text-zinc-400">{bot.started}</td>
                    <td className="px-6 py-3 text-right text-zinc-400">{bot.checkout}</td>
                    <td className="px-6 py-3 text-right font-semibold text-green-400">{bot.sales}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`font-medium ${bot.convStart !== '—' && Number(bot.convStart) >= 5 ? 'text-green-400' : 'text-zinc-400'}`}>
                        {bot.convStart !== '—' ? `${bot.convStart}%` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`font-medium ${bot.convCheckout !== '—' && Number(bot.convCheckout) >= 20 ? 'text-green-400' : 'text-zinc-400'}`}>
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
