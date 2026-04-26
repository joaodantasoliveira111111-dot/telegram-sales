'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const options = [
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
]

export function PeriodTabs() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('days') ?? '30'

  return (
    <div className="flex gap-1 rounded-lg bg-zinc-800/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => router.push(`/dashboard/reports?days=${o.value}`)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            current === o.value
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
