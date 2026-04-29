'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, MousePointerClick, QrCode, CheckCircle2, TrendingDown, Loader2, RefreshCw, FlaskConical, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FunnelData {
  overall: { starts: number; plan_clicks: number; pix_generated: number; paid: number }
  a: { starts: number; plan_clicks: number; pix_generated: number; paid: number }
  b: { starts: number; plan_clicks: number; pix_generated: number; paid: number }
}

const FLOW_LABELS: Record<string, string> = {
  direct: 'Direto',
  presentation: 'Apresentação',
  consultive: 'Consultivo',
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: 'Tudo', value: 0 },
]

const STEPS = [
  { key: 'starts' as const,        label: 'Iniciaram o bot',    icon: Users,             color: '#60a5fa' },
  { key: 'plan_clicks' as const,   label: 'Clicaram no plano',  icon: MousePointerClick, color: '#a78bfa' },
  { key: 'pix_generated' as const, label: 'Geraram o Pix',      icon: QrCode,            color: '#f59e0b' },
  { key: 'paid' as const,          label: 'Pagaram',            icon: CheckCircle2,      color: '#34d399' },
]

function pct(a: number, b: number) {
  if (!b) return 0
  return Math.round((a / b) * 1000) / 10
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

// ─── FunnelBar ────────────────────────────────────────────────────────────────

function FunnelBar({
  step, value, total, dropOff, isLast, color,
}: {
  step: typeof STEPS[number]
  value: number
  total: number
  dropOff?: number
  isLast: boolean
  color: string
}) {
  const Icon = step.icon
  const width = total > 0 ? Math.max((value / total) * 100, 3) : 0
  const rate = pct(value, total)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-slate-300 font-medium">{step.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono text-xs">{rate}%</span>
          <span className="text-slate-100 font-semibold tabular-nums">{fmt(value)}</span>
        </div>
      </div>
      <div className="h-9 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.80)' }}>
        <div
          className="h-full rounded-xl transition-all duration-700 ease-out flex items-center px-3"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}33, ${color}22)`,
            borderRight: `2px solid ${color}88`,
            boxShadow: `0 0 20px ${color}15`,
          }}
        />
      </div>
      {!isLast && dropOff !== undefined && dropOff > 0 && (
        <div className="flex items-center gap-1.5 pl-1">
          <TrendingDown className="h-3 w-3 text-red-400" />
          <span className="text-xs text-red-400">{dropOff}% abandonaram aqui</span>
        </div>
      )}
    </div>
  )
}

// ─── VariantCard ──────────────────────────────────────────────────────────────

function VariantCard({
  variant, data, flowLabel, winner,
}: {
  variant: string
  data: { starts: number; plan_clicks: number; pix_generated: number; paid: number }
  flowLabel: string
  winner: boolean
}) {
  const convRate = pct(data.paid, data.starts)
  const color = variant === 'a' ? '#60a5fa' : '#a78bfa'

  return (
    <div
      className="rounded-2xl p-5 space-y-4 flex-1"
      style={{
        background: winner ? `${color}08` : 'rgba(255,255,255,0.68)',
        border: `1px solid ${winner ? color + '30' : 'rgba(255,255,255,0.82)'}`,
        boxShadow: winner ? `0 0 30px ${color}10` : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${color}20`, color }}>
            {variant.toUpperCase()}
          </div>
          <span className="text-sm font-semibold" style={{ color }}>{flowLabel}</span>
        </div>
        {winner && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${color}15`, color }}>
            <Trophy className="h-3 w-3" />
            Vencedor
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Iniciaram', value: data.starts },
          { label: 'Clicaram', value: data.plan_clicks },
          { label: 'Geraram Pix', value: data.pix_generated },
          { label: 'Pagaram', value: data.paid },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.72)' }}>
            <p className="text-lg font-bold text-slate-100">{fmt(value)}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 text-center" style={{ background: winner ? `${color}12` : 'rgba(255,255,255,0.72)', border: winner ? `1px solid ${color}25` : 'none' }}>
        <p className="text-2xl font-bold" style={{ color: winner ? color : undefined }}>{convRate}%</p>
        <p className="text-xs text-slate-500 mt-0.5">Taxa de conversão</p>
      </div>
    </div>
  )
}

// ─── FunnelClient ─────────────────────────────────────────────────────────────

export function FunnelClient({
  botId, abEnabled, flowTypeA, flowTypeB,
}: {
  botId: string
  abEnabled: boolean
  flowTypeA: string
  flowTypeB: string
}) {
  const [period, setPeriod] = useState(7)
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bots/${botId}/funnel?days=${period}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [botId, period])

  useEffect(() => { load() }, [load])

  const overall = data?.overall ?? { starts: 0, plan_clicks: 0, pix_generated: 0, paid: 0 }
  const total = overall.starts || 1
  const conversionRate = pct(overall.paid, overall.starts)

  const winnerVariant = abEnabled && data
    ? (pct(data.b.paid, data.b.starts) > pct(data.a.paid, data.a.starts) ? 'b' : 'a')
    : null

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Funil de conversão</h2>
          <p className="text-sm text-slate-500 mt-0.5">Do primeiro contato ao pagamento confirmado</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.84)' }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className="px-3.5 py-2 text-xs font-medium transition-all duration-150"
                style={period === opt.value ? {
                  background: 'rgba(59,130,246,0.2)',
                  color: '#93c5fd',
                  borderRight: '1px solid rgba(59,130,246,0.2)',
                } : {
                  background: 'rgba(255,255,255,0.68)',
                  color: '#64748b',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STEPS.map((step) => {
              const val = overall[step.key]
              return (
                <div
                  key={step.key}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}
                >
                  <step.icon className="h-4 w-4 mx-auto mb-2" style={{ color: step.color }} />
                  <p className="text-2xl font-bold text-slate-100">{fmt(val)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.label}</p>
                </div>
              )
            })}
          </div>

          {/* Funnel bars */}
          <div
            className="rounded-2xl p-5 space-y-5"
            style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.82)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Jornada completa</p>
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">{conversionRate}% taxa de conversão</span>
              </div>
            </div>

            {STEPS.map((step, i) => {
              const curr = overall[step.key]
              const prev = i > 0 ? overall[STEPS[i - 1].key] : overall.starts
              const dropOff = i > 0 ? pct(prev - curr, prev) : 0
              return (
                <FunnelBar
                  key={step.key}
                  step={step}
                  value={curr}
                  total={total}
                  dropOff={dropOff}
                  isLast={i === STEPS.length - 1}
                  color={step.color}
                />
              )
            })}
          </div>

          {/* A/B Test section */}
          {abEnabled && (
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.82)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  <FlaskConical className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Teste A/B</p>
                  <p className="text-xs text-slate-500">Comparação de desempenho por variante</p>
                </div>
              </div>

              {data && (
                <div className="flex gap-3">
                  <VariantCard
                    variant="a"
                    data={data.a}
                    flowLabel={FLOW_LABELS[flowTypeA] ?? flowTypeA}
                    winner={winnerVariant === 'a'}
                  />
                  <VariantCard
                    variant="b"
                    data={data.b}
                    flowLabel={FLOW_LABELS[flowTypeB] ?? flowTypeB}
                    winner={winnerVariant === 'b'}
                  />
                </div>
              )}

              {winnerVariant && data && (
                <div
                  className="rounded-xl p-3 text-center text-sm"
                  style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  <span className="text-slate-400">Variante </span>
                  <span className="font-bold text-blue-300">{winnerVariant.toUpperCase()} ({FLOW_LABELS[winnerVariant === 'a' ? flowTypeA : flowTypeB]})</span>
                  <span className="text-slate-400"> está convertendo </span>
                  <span className="font-bold text-emerald-400">
                    {Math.abs(
                      pct(data[winnerVariant === 'a' ? 'a' : 'b'].paid, data[winnerVariant === 'a' ? 'a' : 'b'].starts) -
                      pct(data[winnerVariant === 'a' ? 'b' : 'a'].paid, data[winnerVariant === 'a' ? 'b' : 'a'].starts)
                    )}pp a mais
                  </span>
                </div>
              )}
            </div>
          )}

          {overall.starts === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'rgba(255,255,255,0.68)', border: '1px dashed rgba(255,255,255,0.84)' }}
            >
              <Users className="h-8 w-8 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">Nenhum dado ainda</p>
              <p className="text-sm text-slate-600 mt-1">Os dados aparecem conforme os usuários interagem com o bot</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
