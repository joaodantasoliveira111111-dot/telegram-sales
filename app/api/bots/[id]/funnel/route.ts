import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const days = Number(request.nextUrl.searchParams.get('days') ?? '7')

  const since = days > 0
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    : null

  // ── bot_events counts ───────────────────────────────────────────────────
  let eventsQuery = supabaseAdmin
    .from('bot_events')
    .select('event_type, ab_variant')
    .eq('bot_id', id)
  if (since) eventsQuery = eventsQuery.gte('created_at', since)
  const { data: events } = await eventsQuery

  // ── payments counts ────────────────────────────────────────────────────
  let paymentsQuery = supabaseAdmin
    .from('payments')
    .select('pix_code, status, ab_variant')
    .eq('bot_id', id)
  if (since) paymentsQuery = paymentsQuery.gte('created_at', since)
  const { data: payments } = await paymentsQuery

  function count(arr: unknown[], filter: (x: unknown) => boolean) {
    return (arr ?? []).filter(filter).length
  }

  // ── overall funnel ──────────────────────────────────────────────────────
  const starts        = count(events ?? [], (e: unknown) => (e as {event_type: string}).event_type === 'start')
  const plan_clicks   = count(events ?? [], (e: unknown) => (e as {event_type: string}).event_type === 'plan_click')
  const pix_generated = count(payments ?? [], (p: unknown) => !!(p as {pix_code: string}).pix_code)
  const paid          = count(payments ?? [], (p: unknown) => (p as {status: string}).status === 'paid')

  // ── A/B split ──────────────────────────────────────────────────────────
  const makeVariant = (variant: string) => ({
    starts:        count(events ?? [], (e: unknown) => { const x = e as {event_type: string; ab_variant: string}; return x.event_type === 'start' && x.ab_variant === variant }),
    plan_clicks:   count(events ?? [], (e: unknown) => { const x = e as {event_type: string; ab_variant: string}; return x.event_type === 'plan_click' && x.ab_variant === variant }),
    pix_generated: count(payments ?? [], (p: unknown) => { const x = p as {pix_code: string; ab_variant: string}; return !!x.pix_code && x.ab_variant === variant }),
    paid:          count(payments ?? [], (p: unknown) => { const x = p as {status: string; ab_variant: string}; return x.status === 'paid' && x.ab_variant === variant }),
  })

  return NextResponse.json({
    overall: { starts, plan_clicks, pix_generated, paid },
    a: makeVariant('a'),
    b: makeVariant('b'),
  })
}
