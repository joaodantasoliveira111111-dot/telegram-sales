import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import { MESSAGE_KEYS } from '@/lib/messages'

async function ownBot(session: Awaited<ReturnType<typeof getSessionFromRequest>>, botId: string): Promise<boolean> {
  if (!session) return false
  if (session.type === 'admin') return true
  const { data } = await supabaseAdmin.from('bots').select('id').eq('id', botId).eq('saas_user_id', session.userId!).maybeSingle()
  return !!data
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const { id } = await params
  if (!(await ownBot(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('bot_messages')
    .select('message_key, content')
    .eq('bot_id', id)

  const saved: Record<string, string> = {}
  for (const row of data ?? []) saved[row.message_key] = row.content

  const result = Object.entries(MESSAGE_KEYS).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    vars: meta.vars,
    default: meta.default,
    content: saved[key] ?? meta.default,
    customized: key in saved,
  }))

  return NextResponse.json(result)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  const { id } = await params
  if (!(await ownBot(session, id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { key: string; content: string }[]

  const rows = body.map((item) => ({
    bot_id: id,
    message_key: item.key,
    content: item.content,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabaseAdmin
    .from('bot_messages')
    .upsert(rows, { onConflict: 'bot_id,message_key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
