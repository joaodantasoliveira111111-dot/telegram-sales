'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const PERIODS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: '7 dias', value: '7d' },
  { label: 'Este mês', value: '30d' },
]

interface PeriodSelectorProps {
  defaultValue?: string
}

export function PeriodSelector({ defaultValue = '30d' }: PeriodSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get('period') ?? defaultValue

  return (
    <div className="flex gap-0.5 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => {
            const sp = new URLSearchParams(params.toString())
            sp.set('period', p.value)
            router.push(`${pathname}?${sp.toString()}`)
          }}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
            current === p.value
              ? 'shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          )}
          style={current === p.value ? { background: '#ffffff', color: '#1a1625' } : undefined}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
