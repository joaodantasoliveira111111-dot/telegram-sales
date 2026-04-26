'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

type Period = '7d' | '30d' | '90d'

interface DataPoint {
  date: string
  revenue: number
  count: number
}

function formatLabel(date: string) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-bold text-green-400">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      <p className="text-xs text-zinc-400">{payload[1]?.value ?? 0} venda(s)</p>
    </div>
  )
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('30d')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats/revenue?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const totalRevenue = data.reduce((a, b) => a + b.revenue, 0)
  const totalSales = data.reduce((a, b) => a + b.count, 0)

  const periods: { label: string; value: Period }[] = [
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: '90 dias', value: '90d' },
  ]

  return (
    <Card className="col-span-full border-zinc-800 bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-zinc-100">Receita</CardTitle>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-sm text-zinc-500">{totalSales} vendas no período</span>
          </div>
        </div>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'ghost'}
              onClick={() => setPeriod(p.value)}
              className="text-xs"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-zinc-500">
            Carregando...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                interval={period === '7d' ? 0 : period === '30d' ? 4 : 9}
              />
              <YAxis
                tickFormatter={(v) => `R$${v}`}
                tick={{ fontSize: 11, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="none"
                strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
