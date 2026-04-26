import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MESSAGE_KEYS } from '@/lib/messages'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data } = await supabaseAdmin
    .from('bot_messages')
    .select('message_key, content')
    .eq('bot_id', id)

  const saved: Record<string, string> = {}
  for (const row of data ?? []) saved[row.message_key] = row.content

  // Return all keys with saved content or defaults
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
  const { id } = await params
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
