'use client'

import { Users, ShoppingCart, CreditCard, ArrowDown } from 'lucide-react'

interface ConversionFunnelProps {
  started: number
  initiated: number
  paid: number
}

export function ConversionFunnel({ started, initiated, paid }: ConversionFunnelProps) {
  function pct(a: number, b: number) {
    if (b === 0) return '—'
    return ((a / b) * 100).toFixed(1) + '%'
  }
  function pctNum(a: number, b: number) {
    if (b === 0) return 0
    return Math.min(100, Math.round((a / b) * 100))
  }

  const steps = [
    {
      n: 1, icon: Users, label: 'Iniciaram o bot', sub: 'Novos usuários no período',
      value: started, color: '#3b82f6', glow: 'rgba(59,130,246,0.35)',
      bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)',
      barPct: 100,
    },
    {
      n: 2, icon: ShoppingCart, label: 'Clicaram em comprar', sub: 'Iniciaram o checkout',
      value: initiated, color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)',
      bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.18)',
      barPct: pctNum(initiated, started),
    },
    {
      n: 3, icon: CreditCard, label: 'Pagamento aprovado', sub: 'Conversão final',
      value: paid, color: '#10b981', glow: 'rgba(16,185,129,0.35)',
      bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.18)',
      barPct: pctNum(paid, started),
    },
  ]

  const connectors = [
    { from: steps[0], to: steps[1], rate: pct(initiated, started), lost: started - initiated },
    { from: steps[1], to: steps[2], rate: pct(paid, initiated), lost: initiated - paid },
  ]

  const overallConv = pct(paid, started)
  const checkoutConv = pct(paid, initiated)
  const totalLost = started - paid

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.n}>
            {/* Step card */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ background: step.bg, border: `1px solid ${step.border}` }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: step.color, boxShadow: `2px 0 8px ${step.glow}` }}
              />

              <div className="flex items-center gap-4 px-4 py-3.5 pl-5">
                {/* Numbered icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: step.bg, border: `1.5px solid ${step.border}`, boxShadow: `0 0 16px ${step.glow}` }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: step.color }} />
                  </div>
                  <div
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white"
                    style={{ background: step.color }}
                  >
                    {step.n}
                  </div>
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 leading-tight">{step.label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{step.sub}</p>
                </div>

                {/* Value + % */}
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-2xl font-black leading-none"
                    style={{ color: step.color }}
                  >
                    {step.value.toLocaleString('pt-BR')}
                  </p>
                  {i > 0 && (
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                      {pct(step.value, steps[0].value)} do início
                    </p>
                  )}
                  {i === 0 && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">usuários</p>
                  )}
                </div>
              </div>

              {/* Bottom progress bar */}
              <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${step.barPct}%`,
                    background: `linear-gradient(90deg, ${step.color}80, ${step.color})`,
                  }}
                />
              </div>
            </div>

            {/* Connector */}
            {i < connectors.length && (() => {
              const conn = connectors[i]
              const isGood = conn.lost === 0 || (conn.from.value > 0 && (conn.from.value - conn.lost) / conn.from.value >= 0.3)
              return (
                <div className="flex items-center gap-2 py-1 px-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <ArrowDown className="h-3 w-3 text-zinc-700" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: isGood ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                        color: isGood ? '#34d399' : '#f87171',
                        border: `1px solid ${isGood ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
                      }}
                    >
                      {conn.rate}
                    </span>
                    <span className="text-[11px] text-zinc-600">avançaram</span>
                    {conn.lost > 0 && (
                      <span className="text-[11px] text-zinc-700 ml-auto">
                        −{conn.lost.toLocaleString('pt-BR')} saíram
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })}

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {[
          { label: 'Conversão Total', value: overallConv, color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.15)' },
          { label: 'Checkout → Pago', value: checkoutConv, color: '#8b5cf6', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.15)' },
          { label: 'Não converteram', value: totalLost > 0 ? totalLost.toLocaleString('pt-BR') : '—', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
        ].map(({ label, value, color, bg, border }) => (
          <div
            key={label}
            className="rounded-xl p-2.5 text-center"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
            <p className="text-base font-black leading-none" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
