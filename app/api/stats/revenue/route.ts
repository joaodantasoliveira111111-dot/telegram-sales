import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getRange(period: string): { since: Date; until: Date; points: { key: string; label: string }[] } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'today') {
    // 24 points (by hour) from midnight to now
    const points = Array.from({ length: 24 }, (_, h) => {
      const label = `${String(h).padStart(2, '0')}:00`
      return { key: label, label }
    })
    return { since: todayStart, until: now, points }
  }

  if (period === 'yesterday') {
    const yStart = new Date(todayStart)
    yStart.setDate(yStart.getDate() - 1)
    const points = Array.from({ length: 24 }, (_, h) => {
      const label = `${String(h).padStart(2, '0')}:00`
      return { key: label, label }
    })
    return { since: yStart, until: todayStart, points }
  }

  const days = period === '7d' ? 7 : 30
  const since = new Date(now)
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  const points = Array.from({ length: days }, (_, i) => {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    return { key, label: key }
  })

  return { since, until: now, points }
}

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get('period') ?? '30d'
  const { since, until, points } = getRange(period)
  const isHourly = period === 'today' || period === 'yesterday'

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('created_at, plan:plans(price)')
    .eq('status', 'paid')
    .gte('created_at', since.toISOString())
    .lt('created_at', until.toISOString())
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const grouped: Record<string, { date: string; revenue: number; count: number }> = {}
  for (const p of points) {
    grouped[p.key] = { date: p.label, revenue: 0, count: 0 }
  }

  for (const p of data ?? []) {
    const dt = new Date(p.created_at)
    const key = isHourly
      ? `${String(dt.getHours()).padStart(2, '0')}:00`
      : p.created_at.slice(0, 10)
    if (grouped[key]) {
      const price = (p.plan as unknown as { price: number } | null)?.price ?? 0
      grouped[key].revenue += Number(price)
      grouped[key].count += 1
    }
  }

  return NextResponse.json(Object.values(grouped))
}
