import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('tgsession')?.value
  const ubsession = cookieStore.get('ubsession')?.value
  const secret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  if (session !== secret && !ubsession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  const [leadsRes, paymentsRes, cloakerRes] = await Promise.all([
    supabaseAdmin
      .from('telegram_users')
      .select('id, telegram_id, bot_id, created_at, bots(name)')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('payments')
      .select('id, telegram_id, status, created_at, plan:plans(name, price), bot:bots(name)')
      .gte('created_at', since)
      .in('status', ['paid', 'pending'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('cloaker_clicks')
      .select('id, verdict, ip, created_at, referer, cloakers(name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const events: {
    id: string
    type: 'lead' | 'pix' | 'sale' | 'cloaker'
    label: string
    sub: string
    verdict?: string
    created_at: string
  }[] = [
    ...(leadsRes.data ?? []).map(l => ({
      id: `lead_${l.id}`,
      type: 'lead' as const,
      label: `Novo lead`,
      sub: `#${l.telegram_id} · ${(l.bots as unknown as { name: string } | null)?.name ?? 'bot'}`,
      created_at: l.created_at as string,
    })),
    ...(paymentsRes.data ?? []).map(p => ({
      id: `pay_${p.id}`,
      type: (p.status === 'paid' ? 'sale' : 'pix') as 'sale' | 'pix',
      label: p.status === 'paid' ? 'Venda aprovada' : 'PIX gerado',
      sub: `#${p.telegram_id} · ${(p.plan as unknown as { name: string } | null)?.name ?? '—'} · R$ ${Number((p.plan as unknown as { price: number } | null)?.price ?? 0).toFixed(2).replace('.', ',')}`,
      created_at: p.created_at as string,
    })),
    ...(cloakerRes.data ?? []).map(c => ({
      id: `clk_${c.id}`,
      type: 'cloaker' as const,
      label: c.verdict === 'h' ? 'Cloaker: Humano' : 'Cloaker: Bot/Spy',
      sub: `${(c.cloakers as unknown as { name: string } | null)?.name ?? '—'} · ${(c.ip as string | null) ?? 'IP ocultado'}`,
      verdict: c.verdict as string,
      created_at: c.created_at as string,
    })),
  ]

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ events: events.slice(0, 60) })
}
