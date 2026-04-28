export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/revenue-chart'
import { ConversionFunnel } from '@/components/conversion-funnel'
import {
  Bot, CreditCard, TrendingUp, Users, ArrowUpRight,
  ShoppingBag, Percent, Activity, CheckCircle2, XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, getPeriodRange } from '@/lib/utils'
import { PaymentStatus } from '@/types'
import { PeriodSelector } from '@/components/period-selector'

// ─── Inline platform SVGs ─────────────────────────────────────────────────────

function PlatformIcon({ id }: { id: string }) {
  if (id === 'meta') return (
    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
      <path d="M6 28.5c0 4.97 3.13 8.5 7.5 8.5 2.6 0 4.5-1.05 6.4-3.5L24 28l4.1 5.5C30 36 32 37 34.5 37 38.87 37 42 33.47 42 28.5c0-2.63-.72-5.07-2.14-7.15C38.2 19.05 35.6 17 32.5 17c-2.4 0-4.6.85-6.7 3.3L24 22.5l-1.8-2.2C20.1 17.85 17.9 17 15.5 17c-3.1 0-5.7 2.05-7.36 4.35C6.72 23.43 6 25.87 6 28.5zm3.2 0c0-2.06.55-4 1.56-5.55C11.9 21.23 13.52 20 15.5 20c1.75 0 3.2.63 4.9 2.85L24 27.3l3.6-4.45C29.3 20.63 30.75 20 32.5 20c1.98 0 3.6 1.23 4.74 2.95C38.25 24.5 38.8 26.44 38.8 28.5c0 3.62-2.03 6-4.3 6-1.45 0-2.58-.6-3.9-2.38L24 24.4l-6.6 7.72C16.08 33.9 14.95 34.5 13.5 34.5c-2.27 0-4.3-2.38-4.3-6z" fill="#0081FB" />
    </svg>
  )
  if (id === 'tiktok') return (
    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
      <path d="M38.72 11.52A10.6 10.6 0 0132 9.04V21.9a12.42 12.42 0 01-12.42 12.4 12.42 12.42 0 01-12.42-12.4A12.42 12.42 0 0119.58 9.5c.68 0 1.35.06 2 .17V17.6a4.85 4.85 0 00-2-.42 4.9 4.9 0 00-4.9 4.9 4.9 4.9 0 004.9 4.9 4.9 4.9 0 004.9-4.9V3h6.74a10.62 10.62 0 007.5 8.52z" fill="#69C9D0" />
      <path d="M37.72 10.52A10.6 10.6 0 0131 8.04V20.9a12.42 12.42 0 01-12.42 12.4 12.42 12.42 0 01-12.42-12.4A12.42 12.42 0 0118.58 8.5c.68 0 1.35.06 2 .17V16.6a4.85 4.85 0 00-2-.42 4.9 4.9 0 00-4.9 4.9 4.9 4.9 0 004.9 4.9 4.9 4.9 0 004.9-4.9V2h6.74a10.62 10.62 0 007.5 8.52z" fill="#EE1D52" opacity="0.7" />
      <path d="M38.72 11.52A10.6 10.6 0 0132 9.04V21.9a12.42 12.42 0 01-12.42 12.4 12.42 12.42 0 01-12.42-12.4A12.42 12.42 0 0119.58 9.5c.68 0 1.35.06 2 .17V17.6a4.85 4.85 0 00-2-.42 4.9 4.9 0 00-4.9 4.9 4.9 4.9 0 004.9 4.9 4.9 4.9 0 004.9-4.9V3h6.74a10.62 10.62 0 007.5 8.52z" fill="#010101" />
    </svg>
  )
  if (id === 'ga4') return (
    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
      <rect x="5" y="26" width="10" height="16" rx="3" fill="#E37400" />
      <rect x="19" y="16" width="10" height="26" rx="3" fill="#E37400" />
      <rect x="33" y="6" width="10" height="36" rx="3" fill="#E37400" />
      <circle cx="38" cy="12" r="4" fill="#FBBC04" />
    </svg>
  )
  if (id === 'gtm') return (
    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
      <path d="M24 4L44 24L24 44L4 24Z" fill="#4285F4" />
      <path d="M24 4L34 24L24 44L14 24Z" fill="#3367D6" />
      <path d="M19 29V20h4l-7-8-7 8h4v9h6z" fill="white" />
      <path d="M26 17h5v5h-2v-3h-3v-2z" fill="white" opacity="0.8" />
    </svg>
  )
  if (id === 'kwai') return (
    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
      <rect width="48" height="48" rx="12" fill="#FF5E0A" />
      <path d="M14 12h5v10l9-10h7L24 24l12 12h-7L20 26v10h-6V12z" fill="white" />
    </svg>
  )
  return null
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const statusConfig: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  paid:       { label: 'Pago',        variant: 'success' },
  pending:    { label: 'Pendente',    variant: 'warning' },
  canceled:   { label: 'Cancelado',  variant: 'destructive' },
  refunded:   { label: 'Reembolsado',variant: 'secondary' },
  chargeback: { label: 'Chargeback', variant: 'destructive' },
}

const periodLabel: Record<string, string> = {
  today:     'Hoje',
  yesterday: 'Ontem',
  '7d':      'Últimos 7 dias',
  '30d':     'Este mês',
}

async function getStats(period: string) {
  const { since, until } = getPeriodRange(period)

  function addUntil<T extends { lt: (col: string, val: string) => T }>(q: T): T {
    return until ? q.lt('created_at', until) : q
  }

  const [
    botsRes, revenueRes, paidCountRes, subscriptionsRes,
    recentPaymentsRes, startedRes, initiatedRes, botsListRes,
    allPaymentsRes, usersPerBotRes, settingsRes,
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
    supabaseAdmin.from('settings').select('key, value')
      .in('key', ['meta_pixel_id', 'tiktok_pixel_id', 'ga4_measurement_id', 'gtm_container_id', 'kwai_pixel_id']),
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

  const allPaidRes = await addUntil(
    supabaseAdmin.from('payments')
      .select('plan_id, plan_name, plan_price, plan:plans(name, price)')
      .eq('status', 'paid').gte('created_at', since)
  )
  const planMap: Record<string, { name: string; revenue: number; sales: number }> = {}
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
    return { ...bot, started: s, checkouts: ch, sales: sa, convPct: s > 0 ? ((sa / s) * 100).toFixed(1) : '—' }
  }).filter(b => b.started > 0 || b.sales > 0).sort((a, b) => b.sales - a.sales)

  // Pixel / tracking status from settings
  const settingsMap: Record<string, string> = {}
  for (const s of settingsRes.data ?? []) settingsMap[s.key] = s.value ?? ''

  const pixelStatus = {
    meta:   !!(settingsMap.meta_pixel_id?.trim()),
    tiktok: !!(settingsMap.tiktok_pixel_id?.trim()),
    ga4:    !!(settingsMap.ga4_measurement_id?.trim()),
    gtm:    !!(settingsMap.gtm_container_id?.trim()),
    kwai:   !!(settingsMap.kwai_pixel_id?.trim()),
  }

  return {
    bots: botsRes.count ?? 0,
    paidPayments: paidCount,
    activeSubscriptions: subscriptionsRes.count ?? 0,
    totalRevenue,
    avgTicket,
    overallConvPct,
    recentPayments: recentPaymentsRes.data ?? [],
    funnel: { started: startedCount, initiated: initiatedRes.count ?? 0, paid: paidCount },
    byPlan: byPlan.slice(0, 6),
    maxPlanRevenue,
    conversionByBot: conversionByBot.slice(0, 6),
    pixelStatus,
  }
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { period: periodParam } = await searchParams
  const period = periodParam ?? '30d'
  const stats = await getStats(period)

  const kpis = [
    {
      label: 'Receita Total',
      value: formatCurrency(stats.totalRevenue),
      sub: periodLabel[period] ?? '',
      Icon: TrendingUp,
      color: '#34d399',
      glow: 'rgba(52,211,153,0.2)',
      bg: 'rgba(52,211,153,0.08)',
    },
    {
      label: 'Vendas Aprovadas',
      value: String(stats.paidPayments),
      sub: 'pagamentos confirmados',
      Icon: ShoppingBag,
      color: '#60a5fa',
      glow: 'rgba(96,165,250,0.2)',
      bg: 'rgba(96,165,250,0.08)',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(stats.avgTicket),
      sub: 'por venda',
      Icon: CreditCard,
      color: '#a78bfa',
      glow: 'rgba(167,139,250,0.2)',
      bg: 'rgba(167,139,250,0.08)',
    },
    {
      label: 'Conversão',
      value: stats.overallConvPct === '—' ? '—' : `${stats.overallConvPct}%`,
      sub: 'início → pagamento',
      Icon: Percent,
      color: '#fb923c',
      glow: 'rgba(251,146,60,0.2)',
      bg: 'rgba(251,146,60,0.08)',
    },
    {
      label: 'Assinantes',
      value: String(stats.activeSubscriptions),
      sub: 'ativos agora',
      Icon: Users,
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.2)',
      bg: 'rgba(34,211,238,0.08)',
    },
    {
      label: 'Bots Ativos',
      value: String(stats.bots),
      sub: 'em funcionamento',
      Icon: Bot,
      color: '#fbbf24',
      glow: 'rgba(251,191,36,0.2)',
      bg: 'rgba(251,191,36,0.08)',
    },
  ]

  const pixelPlatforms = [
    { id: 'meta',   name: 'Meta Ads',             active: stats.pixelStatus.meta },
    { id: 'tiktok', name: 'TikTok Ads',           active: stats.pixelStatus.tiktok },
    { id: 'ga4',    name: 'Google Analytics 4',   active: stats.pixelStatus.ga4 },
    { id: 'gtm',    name: 'Google Tag Manager',   active: stats.pixelStatus.gtm },
    { id: 'kwai',   name: 'Kwai Ads',             active: stats.pixelStatus.kwai },
  ]

  const activePixels = pixelPlatforms.filter(p => p.active).length

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 leading-none">
            Dashboard
          </h1>
          <p className="text-[12px] text-zinc-500 mt-1 flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-emerald-500" />
            Visão geral — {periodLabel[period] ?? period}
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map(({ label, value, sub, Icon, color, glow, bg }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-[1.01]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Colored bottom-left glow */}
            <div
              className="absolute bottom-0 left-0 h-20 w-20 rounded-full pointer-events-none"
              style={{ background: glow, filter: 'blur(20px)', transform: 'translate(-30%, 30%)' }}
            />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500 leading-none">{label}</p>
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: bg }}
                >
                  <Icon className="h-3 w-3" style={{ color }} />
                </div>
              </div>
              <p
                className="text-xl font-bold tracking-tight leading-none kpi-value"
                style={{ color }}
              >
                {value}
              </p>
              <p className="text-[10px] text-zinc-600 mt-1.5 leading-none">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Rastreamento & Plataformas ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(40px)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Rastreamento &amp; Marketing
            </p>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              {activePixels} de {pixelPlatforms.length} plataformas ativas
            </p>
          </div>
          <a
            href="/dashboard/settings?tab=pixel"
            className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Configurar pixels →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {pixelPlatforms.map(({ id, name, active }) => (
            <div
              key={id}
              className="relative flex items-center gap-2.5 rounded-xl p-3 transition-all"
              style={{
                background: active ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <PlatformIcon id={id} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-zinc-300 truncate leading-tight">{name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {active ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-2.5 w-2.5 text-zinc-600 shrink-0" />
                  )}
                  <p className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Funil + Gráfico de Receita ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px] font-semibold text-zinc-100">Funil de Conversão</CardTitle>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded-full"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
              >
                {periodLabel[period] ?? period}
              </span>
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

      {/* ── Receita por Plano + Conversão por Bot ───────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] font-semibold text-zinc-100">Receita por Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {stats.byPlan.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda no período</p>
            ) : stats.byPlan.map((plan, i) => {
              const barPct = Math.round((plan.revenue / stats.maxPlanRevenue) * 100)
              const medals = [
                { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
                { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
                { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
              ]
              const m = medals[i] ?? { color: '#52525b', bg: 'rgba(82,82,91,0.1)' }
              return (
                <div key={plan.name}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ color: m.color, background: m.bg }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-[12px] text-zinc-300">{plan.name}</span>
                    <span className="text-[11px] text-zinc-600">{plan.sales}×</span>
                    <span className="text-[12px] font-bold text-gradient-emerald shrink-0">{formatCurrency(plan.revenue)}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] font-semibold text-zinc-100">Conversão por Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.conversionByBot.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Nenhum dado no período</p>
            ) : stats.conversionByBot.map((bot) => {
              const convNum = bot.convPct === '—' ? 0 : parseFloat(bot.convPct as string)
              const isGood = convNum >= 5
              const barW = Math.min(100, convNum * 5)
              return (
                <div
                  key={bot.id}
                  className="rounded-xl p-3 transition-all"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}
                    >
                      <Bot className="h-3 w-3" />
                    </div>
                    <p className="flex-1 text-[12px] font-semibold text-zinc-200 truncate">{bot.name}</p>
                    <div
                      className="shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        background: isGood ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                        color: isGood ? '#34d399' : '#71717a',
                      }}
                    >
                      {bot.convPct === '—' ? '—' : `${bot.convPct}%`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600 mb-2">
                    <span>{bot.started} iniciaram</span>
                    <span>·</span>
                    <span>{bot.checkouts} checkouts</span>
                    <span>·</span>
                    <span className="text-emerald-500 font-semibold">{bot.sales} vendas</span>
                  </div>
                  <div className="h-0.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barW}%`,
                        background: isGood ? 'linear-gradient(90deg,#10b981,#34d399)' : 'rgba(139,92,246,0.4)',
                        transition: 'width 0.7s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Últimas Vendas ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-[13px] font-semibold text-zinc-100">Últimas Vendas</CardTitle>
          <a
            href="/dashboard/payments"
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">Telegram ID</th>
                  <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 sm:table-cell">Plano</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">Valor</th>
                  <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 sm:table-cell">Status</th>
                  <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((p) => {
                  const status = p.status as PaymentStatus
                  const cfg = statusConfig[status] ?? { label: status, variant: 'outline' as const }
                  return (
                    <tr
                      key={p.id}
                      className="table-row-hover transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500">{p.telegram_id}</td>
                      <td className="hidden px-5 py-3.5 text-[12px] text-zinc-300 sm:table-cell">
                        {(p.plan as unknown as { name: string } | null)?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] font-semibold text-emerald-400">
                        {formatCurrency((p.plan as unknown as { price: number } | null)?.price ?? 0)}
                      </td>
                      <td className="hidden px-5 py-3.5 sm:table-cell">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="hidden px-5 py-3.5 text-[11px] text-zinc-600 md:table-cell">
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
