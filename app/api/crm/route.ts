import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest, getUserBotIds } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const botId = request.nextUrl.searchParams.get('bot_id')
  const tag = request.nextUrl.searchParams.get('tag')
  const search = request.nextUrl.searchParams.get('q')
  const page = Number(request.nextUrl.searchParams.get('page') ?? '1')
  const limit = 30
  const from = (page - 1) * limit

  let q = supabaseAdmin
    .from('telegram_users')
    .select('*, bot:bots(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) return NextResponse.json({ data: [], total: 0, page, limit })
    q = q.in('bot_id', botIds)
  }

  if (botId) q = q.eq('bot_id', botId)
  if (tag) q = q.contains('tags', [tag])
  if (search) q = q.or(`telegram_id.ilike.%${search}%,username.ilike.%${search}%,first_name.ilike.%${search}%`)

  const { data: users, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (users ?? []).map(u => u.telegram_id as string)
  let ltv: Record<string, number> = {}
  let pixCount: Record<string, number> = {}

  if (ids.length > 0) {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('telegram_id, plan_price, status')
      .in('telegram_id', ids)
      .eq('bot_id', botId ?? undefined as unknown as string)

    for (const p of payments ?? []) {
      const tid = String(p.telegram_id)
      if (p.status === 'paid') ltv[tid] = (ltv[tid] ?? 0) + Number(p.plan_price ?? 0)
      pixCount[tid] = (pixCount[tid] ?? 0) + 1
    }
  }

  const enriched = (users ?? []).map(u => ({
    ...u,
    ltv: ltv[String(u.telegram_id)] ?? 0,
    total_pix: pixCount[String(u.telegram_id)] ?? 0,
    churn_score: calcChurnScore(u),
  }))

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit })
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { telegram_id, bot_id, tags, notes } = body
  if (!telegram_id || !bot_id) return NextResponse.json({ error: 'telegram_id e bot_id obrigatórios' }, { status: 400 })

  if (session.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (!botIds.includes(bot_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update: Record<string, unknown> = {}
  if (tags !== undefined) update.tags = tags
  if (notes !== undefined) update.notes = notes

  const { data, error } = await supabaseAdmin
    .from('telegram_users')
    .update(update)
    .eq('telegram_id', telegram_id)
    .eq('bot_id', bot_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

function calcChurnScore(user: { last_seen?: string | null; created_at: string }): 'low' | 'medium' | 'high' {
  const lastActivity = user.last_seen ?? user.created_at
  const daysSince = (Date.now() - new Date(lastActivity).getTime()) / 86400000
  if (daysSince > 30) return 'high'
  if (daysSince > 14) return 'medium'
  return 'low'
}
