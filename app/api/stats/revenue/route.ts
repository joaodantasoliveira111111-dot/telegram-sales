import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get('period') ?? '30d'

  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('created_at, plan:plans(price)')
    .eq('status', 'paid')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by date
  const grouped: Record<string, { date: string; revenue: number; count: number }> = {}

  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)
    grouped[key] = { date: key, revenue: 0, count: 0 }
  }

  for (const p of data ?? []) {
    const key = p.created_at.slice(0, 10)
    if (grouped[key]) {
      const price = (p.plan as unknown as { price: number } | null)?.price ?? 0
      grouped[key].revenue += Number(price)
      grouped[key].count += 1
    }
  }

  return NextResponse.json(Object.values(grouped))
}
