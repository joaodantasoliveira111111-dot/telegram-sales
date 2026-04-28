'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'

const MILESTONES = [10000, 50000, 100000, 500000, 1000000]

function fmtShort(n: number) {
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
  return `R$ ${n.toFixed(0)}`
}

export function RevenueMilestone() {
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
          ? `🏆 Todas as metas atingidas`
          : `Próximo: ${fmtShort(next)}${reached > 0 ? ` · ${reached} meta${reached > 1 ? 's' : ''} ✓` : ''}`
        }
      </p>
    </div>
  )
}
