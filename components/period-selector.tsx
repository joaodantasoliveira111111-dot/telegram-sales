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
    <div className="flex gap-0.5 rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-1">
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
              ? 'bg-zinc-700 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-200'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
