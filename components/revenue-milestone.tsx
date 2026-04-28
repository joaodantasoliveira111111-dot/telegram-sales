'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'

const MILESTONES = [10000, 50000, 100000, 500000, 1000000]

function fmtShort(n: number) {
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
  return `R$ ${n.toFixed(0)}`
}

interface RevenueMilestoneProps {
  variant?: 'compact' | 'banner'
}

export function RevenueMilestone({ variant = 'compact' }: RevenueMilestoneProps) {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/stats/revenue?total=1')
      .then(r => r.json())
      .then(d => setTotal(d.total ?? 0))
      .catch(() => setTotal(0))
  }, [])

  if (total === null) return null

  const next = MILESTONES.find(m => m > total) ?? MILESTONES[MILESTONES.length - 1]
  const prevIdx = MILESTONES.indexOf(next) - 1
  const prev = prevIdx >= 0 ? MILESTONES[prevIdx] : 0
  const pct = Math.min(100, ((total - prev) / (next - prev)) * 100)
  const reached = MILESTONES.filter(m => total >= m).length
  const allDone = total >= MILESTONES[MILESTONES.length - 1]

  if (variant === 'banner') {
    return (
      <div
        className="w-full rounded-2xl px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        {/* Left: Trophy + title + value */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Trophy className="h-8 w-8 text-violet-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-0.5">Faturamento Total</p>
            <p className="text-3xl font-black text-white leading-none">{fmtShort(total)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {allDone
                ? 'Todas as metas atingidas'
                : `Próximo: ${fmtShort(next)} — ${Math.round(pct)}% concluído`
              }
            </p>
          </div>
        </div>

        {/* Right: progress bar + milestone dots */}
        <div className="flex-1 min-w-0">
          {/* Milestone dots */}
          <div className="flex items-end justify-between mb-2">
            {MILESTONES.map((m) => {
              const isReached = total >= m
              const label = m >= 1000000 ? `${(m / 1000000).toFixed(0)}M` : `${m / 1000}k`
              return (
                <div key={m} className="flex flex-col items-center gap-1">
                  <div
                    className="h-2.5 w-2.5 rounded-full transition-all"
                    style={isReached
                      ? { background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.6)' }
                      : { border: '1.5px solid rgba(139,92,246,0.35)', background: 'transparent' }
                    }
                  />
                  <span className="text-[9px] text-zinc-500 font-medium">{label}</span>
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3 w-3 text-violet-400" />
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-violet-400">Faturamento</p>
        </div>
        <p className="text-[11px] font-bold text-slate-200">{fmtShort(total)}</p>
      </div>

      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}
        />
      </div>

      <p className="text-[9px] text-slate-600 leading-tight">
        {allDone
          ? `Todas as metas atingidas`
          : `Próximo: ${fmtShort(next)}${reached > 0 ? ` · ${reached} meta${reached > 1 ? 's' : ''} ✓` : ''}`
        }
      </p>
    </div>
  )
}
